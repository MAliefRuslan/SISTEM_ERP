import pool from './_db.js';
import { authenticateToken } from './_auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  let user;
  try {
    user = authenticateToken(req);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    if (req.method === 'GET') {
      const result = await pool.query(`
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.company_id = $1
        ORDER BY p.id ASC
      `, [user.companyId]);
      // Format to match Laravel's with('category') structure
      const products = result.rows.map(row => ({
        ...row,
        category: row.category_name ? { id: row.category_id, name: row.category_name } : null,
      }));
      return res.status(200).json(products);
    }

    if (req.method === 'POST') {
      const { name, sku, price, description, category_id } = req.body;
      if (!name || !sku || price === undefined) {
        return res.status(422).json({ error: 'Name, SKU, and Price are required' });
      }

      const result = await pool.query(
        `INSERT INTO products (company_id, name, sku, price, description, category_id, stock, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, 0, NOW(), NOW()) RETURNING *`,
        [user.companyId, name, sku, price, description || null, category_id || null]
      );
      return res.status(201).json(result.rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Products API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
