import pool from './_db.js';
import { authenticateToken, requireRole } from './_auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
      const { month, employee_id } = req.query;

      let query = `
        SELECT a.*, e.name as employee_name, e.department, e.position
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        WHERE a.company_id = $1
      `;
      const params = [user.companyId];
      let paramCount = 1;

      if (month) {
        paramCount++;
        query += ` AND TO_CHAR(a.date, 'YYYY-MM') = $${paramCount}`;
        params.push(month); // Format: 'YYYY-MM'
      }

      if (employee_id) {
        paramCount++;
        query += ` AND a.employee_id = $${paramCount}`;
        params.push(employee_id);
      }

      query += ` ORDER BY a.date DESC, e.name ASC`;

      const result = await pool.query(query, params);
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { employee_id, date, check_in, check_out, status, notes } = req.body;
      if (!employee_id || !status) {
        return res.status(422).json({ error: 'Employee ID and Status are required' });
      }

      // Check if employee belongs to company
      const empCheck = await pool.query(
        'SELECT id FROM employees WHERE id = $1 AND company_id = $2',
        [employee_id, user.companyId]
      );
      if (empCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Employee not found or unauthorized' });
      }

      const attDate = date || new Date().toISOString().split('T')[0];

      // Check if attendance already exists for this employee on this date
      const existingCheck = await pool.query(
        'SELECT id FROM attendance WHERE employee_id = $1 AND date = $2 AND company_id = $3',
        [employee_id, attDate, user.companyId]
      );

      let result;
      if (existingCheck.rows.length > 0) {
        // Update existing record
        result = await pool.query(
          `UPDATE attendance 
           SET check_in = $1, check_out = $2, status = $3, notes = $4
           WHERE employee_id = $5 AND date = $6 AND company_id = $7 RETURNING *`,
          [
            check_in || null,
            check_out || null,
            status,
            notes || null,
            employee_id,
            attDate,
            user.companyId
          ]
        );
      } else {
        // Insert new record
        result = await pool.query(
          `INSERT INTO attendance (company_id, employee_id, date, check_in, check_out, status, notes, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
          [
            user.companyId,
            employee_id,
            attDate,
            check_in || null,
            check_out || null,
            status,
            notes || null
          ]
        );
      }

      return res.status(existingCheck.rows.length > 0 ? 200 : 201).json(result.rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Attendance API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
