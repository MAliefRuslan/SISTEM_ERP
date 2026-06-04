import pg from 'pg';

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  ssl: (process.env.DB_HOST === '127.0.0.1' || process.env.DB_HOST === 'localhost' || !process.env.DB_HOST) 
    ? false 
    : { rejectUnauthorized: false },
  max: 5,
});

export default pool;
