import pool from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const client = await pool.connect();
  try {
    const { product_id, type, quantity } = req.body;

    if (!product_id || !type || !quantity) {
      return res.status(422).json({ error: 'product_id, type, and quantity are required' });
    }

    await client.query('BEGIN');

    // Insert transaction
    await client.query(
      `INSERT INTO inventory_transactions (product_id, type, quantity, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [product_id, type, parseInt(quantity)]
    );

    // Update product stock
    const stockChange = type === 'in' ? parseInt(quantity) : -parseInt(quantity);
    const result = await client.query(
      'UPDATE products SET stock = stock + $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [stockChange, product_id]
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
