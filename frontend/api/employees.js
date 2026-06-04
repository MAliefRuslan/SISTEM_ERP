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
        'SELECT * FROM employees WHERE company_id = $1 ORDER BY name ASC',
        [user.companyId]
      );
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { name, position, department, phone, email, hire_date, salary, status } = req.body;
      if (!name) {
        return res.status(422).json({ error: 'Name is required' });
      }

      const result = await pool.query(
        `INSERT INTO employees (company_id, name, position, department, phone, email, hire_date, salary, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING *`,
        [
          user.companyId,
          name,
          position || null,
          department || null,
          phone || null,
          email || null,
          hire_date || null,
          salary ? parseFloat(salary) : 0,
          status || 'active'
        ]
      );
      return res.status(201).json(result.rows[0]);
    }

    if (req.method === 'PUT') {
      const { id, name, position, department, phone, email, hire_date, salary, status } = req.body;
      if (!id || !name) {
        return res.status(422).json({ error: 'ID and Name are required' });
      }

      const result = await pool.query(
        `UPDATE employees 
         SET name = $1, position = $2, department = $3, phone = $4, email = $5, hire_date = $6, salary = $7, status = $8, updated_at = NOW()
         WHERE id = $9 AND company_id = $10 RETURNING *`,
        [
          name,
          position || null,
          department || null,
          phone || null,
          email || null,
          hire_date || null,
          salary ? parseFloat(salary) : 0,
          status || 'active',
          id,
          user.companyId
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Employee not found or unauthorized' });
      }
      return res.status(200).json(result.rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(422).json({ error: 'ID query parameter is required' });
      }

      const result = await pool.query(
        'DELETE FROM employees WHERE id = $1 AND company_id = $2 RETURNING *',
        [id, user.companyId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Employee not found or unauthorized' });
      }
      return res.status(200).json({ message: 'Employee deleted successfully', employee: result.rows[0] });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Employees API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
