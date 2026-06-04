import pool from './_db.js';
import { authenticateToken } from './_auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  let user;
  try {
    user = authenticateToken(req);
    // Both admin and kasir can access sales/POS.
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    if (req.method === 'GET') {
      const { id, date } = req.query;

      if (id) {
        // Get single sale details with items and product names
        const saleResult = await pool.query(
          `SELECT s.*, u.name as cashier_name
           FROM sales s
           LEFT JOIN users u ON s.cashier_id = u.id
           WHERE s.id = $1 AND s.company_id = $2`,
          [id, user.companyId]
        );

        if (saleResult.rows.length === 0) {
          return res.status(404).json({ error: 'Sale not found or unauthorized' });
        }

        const itemsResult = await pool.query(
          `SELECT si.*, p.name as product_name, p.sku as product_sku
           FROM sale_items si
           JOIN products p ON si.product_id = p.id
           WHERE si.sale_id = $1`,
          [id]
        );

        return res.status(200).json({
          ...saleResult.rows[0],
          items: itemsResult.rows
        });
      } else {
        // List all sales with cashier name
        let query = `
          SELECT s.*, u.name as cashier_name
          FROM sales s
          LEFT JOIN users u ON s.cashier_id = u.id
          WHERE s.company_id = $1
        `;
        const params = [user.companyId];

        if (date) {
          query += ` AND DATE(s.created_at) = $2`;
          params.push(date);
        }

        query += ` ORDER BY s.created_at DESC`;

        const result = await pool.query(query, params);
        return res.status(200).json(result.rows);
      }
    }

    if (req.method === 'POST') {
      const { customer_name, payment_method, items } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(422).json({ error: 'Items are required' });
      }

      const payMethod = payment_method || 'cash';
      if (!['cash', 'transfer', 'qris'].includes(payMethod.toLowerCase())) {
        return res.status(422).json({ error: "Payment method must be 'cash', 'transfer', or 'qris'" });
      }

      // Generate invoice number: INV-YYYYMMDD-XXXX
      const today = new Date();
      const dateString = today.getFullYear().toString() +
        (today.getMonth() + 1).toString().padStart(2, '0') +
        today.getDate().toString().padStart(2, '0');
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const invoiceNumber = `INV-${dateString}-${randomDigits}`;

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        let grandTotal = 0;
        const processedItems = [];

        for (const item of items) {
          const { product_id, quantity, unit_price } = item;
          if (!product_id || !quantity || quantity <= 0) {
            throw new Error(`Invalid item: product_id and quantity (>0) are required`);
          }

          // Fetch product & lock row for update to ensure stock integrity
          const productResult = await client.query(
            'SELECT id, price, stock, name FROM products WHERE id = $1 AND company_id = $2 FOR UPDATE',
            [product_id, user.companyId]
          );

          if (productResult.rows.length === 0) {
            throw new Error(`Product ID ${product_id} not found or unauthorized`);
          }

          const product = productResult.rows[0];
          if (product.stock < quantity) {
            throw new Error(`Stok tidak mencukupi untuk produk "${product.name}". Stok tersedia: ${product.stock}, diminta: ${quantity}`);
          }

          // Use body unit_price, or fallback to database price
          const price = unit_price !== undefined ? parseFloat(unit_price) : parseFloat(product.price);
          const subtotal = parseInt(quantity) * price;
          grandTotal += subtotal;

          processedItems.push({
            product_id,
            quantity: parseInt(quantity),
            unit_price: price,
            subtotal,
            product_name: product.name
          });
        }

        // Insert sale
        const saleResult = await client.query(
          `INSERT INTO sales (company_id, invoice_number, customer_name, total_amount, payment_method, cashier_id, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
          [user.companyId, invoiceNumber, customer_name || 'Walk-in Customer', grandTotal, payMethod.toLowerCase(), user.userId]
        );

        const newSale = saleResult.rows[0];

        // Insert sale items and deduct stock + record inventory transaction
        for (const item of processedItems) {
          // Insert sale item
          await client.query(
            `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
             VALUES ($1, $2, $3, $4, $5)`,
            [newSale.id, item.product_id, item.quantity, item.unit_price, item.subtotal]
          );

          // Update product stock
          await client.query(
            'UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2',
            [item.quantity, item.product_id]
          );

          // Insert inventory transaction record for audit trail
          await client.query(
            `INSERT INTO inventory_transactions (company_id, product_id, type, quantity, created_at, updated_at)
             VALUES ($1, $2, 'out', $3, NOW(), NOW())`,
            [user.companyId, item.product_id, item.quantity]
          );
        }

        await client.query('COMMIT');
        return res.status(201).json({ ...newSale, items: processedItems });
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Sale transaction failed:', error);
        return res.status(422).json({ error: error.message });
      } finally {
        client.release();
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Sales API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
