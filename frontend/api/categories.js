import pool from './_db.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const result = await pool.query('SELECT * FROM categories ORDER BY id ASC');
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { name, description } = req.body;
      if (!name) return res.status(422).json({ error: 'Name is required' });

      const result = await pool.query(
        'INSERT INTO categories (name, description, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING *',
        [name, description || null]
      );
      return res.status(201).json(result.rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Categories API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
