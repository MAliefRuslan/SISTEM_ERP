import pool from './_db.js';
import { authenticateToken } from './_auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let user;
  try {
    user = authenticateToken(req);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  const client = await pool.connect();
  try {
    const { product_id, type, quantity } = req.body;

    if (!product_id || !type || !quantity) {
      return res.status(422).json({ error: 'product_id, type, and quantity are required' });
    }

    await client.query('BEGIN');

    // Verify product belongs to company
    const productCheck = await client.query('SELECT id FROM products WHERE id = $1 AND company_id = $2', [product_id, user.companyId]);
    if (productCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    // Insert transaction
    await client.query(
      `INSERT INTO inventory_transactions (company_id, product_id, type, quantity, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [user.companyId, product_id, type, parseInt(quantity)]
    );

    // Update product stock
    const stockChange = type === 'in' ? parseInt(quantity) : -parseInt(quantity);
    const result = await client.query(
      'UPDATE products SET stock = stock + $1, updated_at = NOW() WHERE id = $2 AND company_id = $3 RETURNING *',
      [stockChange, product_id, user.companyId]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Transaction recorded successfully',
      product: result.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
}
