import pool from '../_db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { companyName, companyAddress, userName, email, password } = req.body;

  if (!companyName || !userName || !email || !password) {
    return res.status(400).json({ error: 'Company Name, User Name, Email, and Password are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Check if user already exists
    const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Email already exists' });
    }

    // 2. Create the company
    const companyRes = await client.query(
      'INSERT INTO companies (name, address) VALUES ($1, $2) RETURNING id',
      [companyName, companyAddress]
    );
    const companyId = companyRes.rows[0].id;

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create the super admin user for the company
    const userRes = await client.query(
      'INSERT INTO users (company_id, name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
      [companyId, userName, email, hashedPassword, 'admin']
    );

    await client.query('COMMIT');

    // 5. Generate JWT Token
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_12345';
    const token = jwt.sign(
      { 
        userId: userRes.rows[0].id, 
        companyId: companyId,
        role: userRes.rows[0].role 
      },
      jwtSecret,
      { expiresIn: '1d' }
    );

    return res.status(201).json({
      message: 'Company and Admin User created successfully',
      token,
      user: {
        id: userRes.rows[0].id,
        name: userRes.rows[0].name,
        email: userRes.rows[0].email,
        role: userRes.rows[0].role,
        companyId: companyId
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  } finally {
    client.release();
  }
}
