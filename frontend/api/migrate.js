import pool from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(15,2) NOT NULL DEFAULT 0,
        stock INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(company_id, sku)
      );

      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        type VARCHAR(10) NOT NULL CHECK (type IN ('in', 'out')),
        quantity INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS purchase_orders (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
        order_number VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        total_amount DECIMAL(15,2) DEFAULT 0,
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id SERIAL PRIMARY KEY,
        purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(15,2) NOT NULL,
        subtotal DECIMAL(15,2) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        invoice_number VARCHAR(50) NOT NULL,
        customer_name VARCHAR(255) DEFAULT 'Walk-in Customer',
        total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        payment_method VARCHAR(20) DEFAULT 'cash',
        cashier_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sale_items (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(15,2) NOT NULL,
        subtotal DECIMAL(15,2) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        position VARCHAR(255),
        department VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        hire_date DATE,
        salary DECIMAL(15,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        check_in TIME,
        check_out TIME,
        status VARCHAR(20) DEFAULT 'present',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    return res.status(200).json({ message: 'Database migrated successfully! All tables created.' });
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({ error: 'Migration failed', details: error.message });
  }
}
