import pool from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const checks = {
    env_vars: {
      DB_HOST: !!process.env.DB_HOST,
      DB_DATABASE: !!process.env.DB_DATABASE,
      DB_USERNAME: !!process.env.DB_USERNAME,
      DB_PASSWORD: !!process.env.DB_PASSWORD,
      DB_PORT: process.env.DB_PORT || '5432 (default)',
      JWT_SECRET: !!process.env.JWT_SECRET,
    },
    database_connection: false,
    tables: {},
  };

  try {
    const result = await pool.query('SELECT NOW() as server_time');
    checks.database_connection = true;
    checks.server_time = result.rows[0].server_time;

    // Check which tables exist
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const existingTables = tablesRes.rows.map(r => r.table_name);
    const requiredTables = ['companies', 'users', 'categories', 'products', 'inventory_transactions'];
    
    for (const t of requiredTables) {
      checks.tables[t] = existingTables.includes(t) ? '✅ exists' : '❌ missing';
    }

    // Count rows in existing tables
    for (const t of requiredTables) {
      if (existingTables.includes(t)) {
        try {
          const countRes = await pool.query(`SELECT COUNT(*) as count FROM ${t}`);
          checks.tables[t] += ` (${countRes.rows[0].count} rows)`;
        } catch (e) {
          checks.tables[t] += ` (error counting: ${e.message})`;
        }
      }
    }

    return res.status(200).json({ status: 'ok', checks });
  } catch (error) {
    checks.database_connection = false;
    checks.error = error.message;
    return res.status(500).json({ status: 'error', checks });
  }
}
