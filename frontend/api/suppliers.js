import pool from './_db.js';
import { authenticateToken, requireRole } from './_auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
      const result = await pool.query(
        'SELECT * FROM suppliers WHERE company_id = $1 ORDER BY name ASC',
        [user.companyId]
      );
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { name, contact_person, phone, email, address } = req.body;
      if (!name) {
        return res.status(422).json({ error: 'Name is required' });
      }

      const result = await pool.query(
        `INSERT INTO suppliers (company_id, name, contact_person, phone, email, address, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
        [user.companyId, name, contact_person || null, phone || null, email || null, address || null]
      );
      return res.status(201).json(result.rows[0]);
    }

    if (req.method === 'PUT') {
      const { id, name, contact_person, phone, email, address } = req.body;
      if (!id || !name) {
        return res.status(422).json({ error: 'ID and Name are required' });
      }

      const result = await pool.query(
        `UPDATE suppliers 
         SET name = $1, contact_person = $2, phone = $3, email = $4, address = $5, updated_at = NOW()
         WHERE id = $6 AND company_id = $7 RETURNING *`,
        [name, contact_person || null, phone || null, email || null, address || null, id, user.companyId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Supplier not found or unauthorized' });
      }
      return res.status(200).json(result.rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(422).json({ error: 'ID query parameter is required' });
      }

      const result = await pool.query(
        'DELETE FROM suppliers WHERE id = $1 AND company_id = $2 RETURNING *',
        [id, user.companyId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Supplier not found or unauthorized' });
      }
      return res.status(200).json({ message: 'Supplier deleted successfully', supplier: result.rows[0] });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Suppliers API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
