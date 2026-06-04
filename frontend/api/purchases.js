import pool from './_db.js';
import { authenticateToken, requireRole } from './_auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  let user;
  try {
    user = authenticateToken(req);
    requireRole(user, 'admin');
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    if (req.method === 'GET') {
      const { id } = req.query;

      if (id) {
        // Get single purchase order with items and product details
        const poResult = await pool.query(
          `SELECT po.*, s.name as supplier_name, u.name as creator_name
           FROM purchase_orders po
           JOIN suppliers s ON po.supplier_id = s.id
           LEFT JOIN users u ON po.created_by = u.id
           WHERE po.id = $1 AND po.company_id = $2`,
          [id, user.companyId]
        );

        if (poResult.rows.length === 0) {
          return res.status(404).json({ error: 'Purchase order not found or unauthorized' });
        }

        const itemsResult = await pool.query(
          `SELECT poi.*, p.name as product_name, p.sku as product_sku
           FROM purchase_order_items poi
           JOIN products p ON poi.product_id = p.id
           WHERE poi.purchase_order_id = $1`,
          [id]
        );

        return res.status(200).json({
          ...poResult.rows[0],
          items: itemsResult.rows
        });
      } else {
        // List all purchase orders for the company with supplier name and item count
        const result = await pool.query(
          `SELECT po.*, s.name as supplier_name, COUNT(poi.id)::int as item_count
           FROM purchase_orders po
           JOIN suppliers s ON po.supplier_id = s.id
           LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
           WHERE po.company_id = $1
           GROUP BY po.id, s.name
           ORDER BY po.created_at DESC`,
          [user.companyId]
        );
        return res.status(200).json(result.rows);
      }
    }

    if (req.method === 'POST') {
      const { supplier_id, notes, items } = req.body;
      if (!supplier_id || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(422).json({ error: 'Supplier and items are required' });
      }

      // Check if supplier belongs to company
      const supplierCheck = await pool.query(
        'SELECT id FROM suppliers WHERE id = $1 AND company_id = $2',
        [supplier_id, user.companyId]
      );
      if (supplierCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Supplier not found or unauthorized' });
      }

      // Generate PO Number PO-YYYYMMDD-XXXX
      const today = new Date();
      const dateString = today.getFullYear().toString() +
        (today.getMonth() + 1).toString().padStart(2, '0') +
        today.getDate().toString().padStart(2, '0');
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `PO-${dateString}-${randomDigits}`;

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Calculate totals and verify products
        let grandTotal = 0;
        const processedItems = [];

        for (const item of items) {
          const { product_id, quantity, unit_price } = item;
          if (!product_id || !quantity || quantity <= 0 || unit_price === undefined || unit_price < 0) {
            throw new Error(`Invalid item: product_id, quantity (>0), and unit_price are required`);
          }

          // Verify product belongs to company
          const productCheck = await client.query(
            'SELECT id, price FROM products WHERE id = $1 AND company_id = $2',
            [product_id, user.companyId]
          );
          if (productCheck.rows.length === 0) {
            throw new Error(`Product ID ${product_id} not found or unauthorized`);
          }

          const subtotal = parseInt(quantity) * parseFloat(unit_price);
          grandTotal += subtotal;
          processedItems.push({
            product_id,
            quantity: parseInt(quantity),
            unit_price: parseFloat(unit_price),
            subtotal
          });
        }

        // Insert Purchase Order
        const poResult = await client.query(
          `INSERT INTO purchase_orders (company_id, supplier_id, order_number, status, total_amount, notes, created_by, created_at, updated_at)
           VALUES ($1, $2, $3, 'pending', $4, $5, $6, NOW(), NOW()) RETURNING *`,
          [user.companyId, supplier_id, orderNumber, grandTotal, notes || null, user.userId]
        );

        const newPO = poResult.rows[0];

        // Insert PO Items
        for (const item of processedItems) {
          await client.query(
            `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price, subtotal)
             VALUES ($1, $2, $3, $4, $5)`,
            [newPO.id, item.product_id, item.quantity, item.unit_price, item.subtotal]
          );
        }

        await client.query('COMMIT');
        return res.status(201).json({ ...newPO, items: processedItems });
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('PO Creation transaction failed:', error);
        return res.status(422).json({ error: error.message });
      } finally {
        client.release();
      }
    }

    if (req.method === 'PUT') {
      const { id, status } = req.body;
      if (!id || !status) {
        return res.status(422).json({ error: 'ID and Status are required' });
      }

      if (!['received', 'cancelled'].includes(status)) {
        return res.status(422).json({ error: "Status must be 'received' or 'cancelled'" });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Get current PO status
        const poCheck = await client.query(
          'SELECT status FROM purchase_orders WHERE id = $1 AND company_id = $2 FOR UPDATE',
          [id, user.companyId]
        );

        if (poCheck.rows.length === 0) {
          throw new Error('Purchase order not found or unauthorized');
        }

        const currentStatus = poCheck.rows[0].status;
        if (currentStatus !== 'pending') {
          throw new Error(`Cannot update status: Purchase order is already ${currentStatus}`);
        }

        // Update status
        await client.query(
          'UPDATE purchase_orders SET status = $1, updated_at = NOW() WHERE id = $2',
          [status, id]
        );

        // If status is received, add stock to products and create inventory transaction records
        if (status === 'received') {
          const itemsResult = await client.query(
            'SELECT product_id, quantity, unit_price FROM purchase_order_items WHERE purchase_order_id = $1',
            [id]
          );

          for (const item of itemsResult.rows) {
            // Update product stock
            await client.query(
              'UPDATE products SET stock = stock + $1, updated_at = NOW() WHERE id = $2 AND company_id = $3',
              [item.quantity, item.product_id, user.companyId]
            );

            // Record inventory transaction
            await client.query(
              `INSERT INTO inventory_transactions (company_id, product_id, type, quantity, created_at, updated_at)
               VALUES ($1, $2, 'in', $3, NOW(), NOW())`,
              [user.companyId, item.product_id, item.quantity]
            );
          }
        }

        await client.query('COMMIT');
        return res.status(200).json({ message: `Purchase order status updated to ${status} successfully` });
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('PO Update status transaction failed:', error);
        return res.status(422).json({ error: error.message });
      } finally {
        client.release();
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Purchase Orders API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
