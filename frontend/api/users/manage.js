import pool from '../_db.js';
import { authenticateToken, requireRole } from '../_auth.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
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
        'SELECT id, name, email, role, created_at, updated_at FROM users WHERE company_id = $1 ORDER BY name ASC',
        [user.companyId]
      );
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password || !role) {
        return res.status(422).json({ error: 'Name, Email, Password, and Role are required' });
      }

      if (!['admin', 'kasir'].includes(role)) {
        return res.status(422).json({ error: "Role must be either 'admin' or 'kasir'" });
      }

      // Check if email already exists
      const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (emailCheck.rows.length > 0) {
        return res.status(422).json({ error: 'Email already registered' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const result = await pool.query(
        `INSERT INTO users (company_id, name, email, password, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, name, email, role, created_at`,
        [user.companyId, name, email, hashedPassword, role]
      );

      return res.status(201).json(result.rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(422).json({ error: 'ID query parameter is required' });
      }

      if (parseInt(id) === user.userId) {
        return res.status(422).json({ error: 'Cannot delete your own account' });
      }

      const result = await pool.query(
        'DELETE FROM users WHERE id = $1 AND company_id = $2 RETURNING id, name, email, role',
        [id, user.companyId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found or unauthorized' });
      }

      return res.status(200).json({ message: 'User deleted successfully', user: result.rows[0] });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('User management API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
