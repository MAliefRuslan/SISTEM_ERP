import pool from './_db.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get or create company_id
    let companyId;
    const { company_id } = req.query;

    if (company_id) {
      companyId = parseInt(company_id);
    } else {
      // Find the first company
      const compRes = await client.query('SELECT id FROM companies ORDER BY id ASC LIMIT 1');
      if (compRes.rows.length > 0) {
        companyId = compRes.rows[0].id;
      } else {
        // Create a default company
        const newComp = await client.query(
          "INSERT INTO companies (name, address) VALUES ('Toko Kelontong Demo', 'Jl. Sudirman No. 123, Jakarta') RETURNING id"
        );
        companyId = newComp.rows[0].id;

        // Create a default admin user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);
        await client.query(
          "INSERT INTO users (company_id, name, email, password, role) VALUES ($1, 'Demo Admin', 'demo@erp.com', $2, 'admin')",
          [companyId, hashedPassword]
        );
      }
    }

    // Verify company exists
    const compCheck = await client.query('SELECT name FROM companies WHERE id = $1', [companyId]);
    if (compCheck.rows.length === 0) {
      throw new Error(`Company ID ${companyId} does not exist.`);
    }
    const companyName = compCheck.rows[0].name;

    // Clean up existing data for this company to avoid duplicate key issues during seeding
    await client.query('DELETE FROM attendance WHERE company_id = $1', [companyId]);
    await client.query('DELETE FROM employees WHERE company_id = $1', [companyId]);
    await client.query('DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE company_id = $1)', [companyId]);
    await client.query('DELETE FROM sales WHERE company_id = $1', [companyId]);
    await client.query('DELETE FROM purchase_order_items WHERE purchase_order_id IN (SELECT id FROM purchase_orders WHERE company_id = $1)', [companyId]);
    await client.query('DELETE FROM purchase_orders WHERE company_id = $1', [companyId]);
    await client.query('DELETE FROM suppliers WHERE company_id = $1', [companyId]);
    await client.query('DELETE FROM inventory_transactions WHERE company_id = $1', [companyId]);
    await client.query('DELETE FROM products WHERE company_id = $1', [companyId]);
    await client.query('DELETE FROM categories WHERE company_id = $1', [companyId]);

    // 2. Seed Categories
    const categoriesData = [
      { name: 'Elektronik', desc: 'Gadget, komputer, aksesoris elektronik' },
      { name: 'Makanan & Minuman', desc: 'Makanan ringan, minuman segar, bahan pokok' },
      { name: 'Pakaian & Fashion', desc: 'Baju, celana, aksesoris fashion' },
      { name: 'Alat Tulis Kantor', desc: 'Kertas, pena, buku catatan, perlengkapan kantor' }
    ];

    const categoryMap = {};
    for (const cat of categoriesData) {
      const catRes = await client.query(
        'INSERT INTO categories (company_id, name, description) VALUES ($1, $2, $3) RETURNING id, name',
        [companyId, cat.name, cat.desc]
      );
      categoryMap[cat.name] = catRes.rows[0].id;
    }

    // 3. Seed Products
    const productsData = [
      { name: 'Laptop ASUS Vivobook', sku: 'LAP-AS-001', price: 8500000, stock: 12, cat: 'Elektronik' },
      { name: 'Mouse Wireless Logitech', sku: 'MOU-LO-002', price: 185000, stock: 45, cat: 'Elektronik' },
      { name: 'Keyboard Mechanical Rexus', sku: 'KEY-RE-003', price: 350000, stock: 18, cat: 'Elektronik' },
      
      { name: 'Kopi Susu Aren 250ml', sku: 'MUM-KS-001', price: 15000, stock: 120, cat: 'Makanan & Minuman' },
      { name: 'Roti Sobek Cokelat', sku: 'MAK-RS-002', price: 12000, stock: 35, cat: 'Makanan & Minuman' },
      { name: 'Keripik Singkong Balado', sku: 'MAK-KS-003', price: 10000, stock: 60, cat: 'Makanan & Minuman' },
      
      { name: 'Kaos Polos Cotton 30s', sku: 'PAK-KP-001', price: 65000, stock: 85, cat: 'Pakaian & Fashion' },
      { name: 'Celana Chino Slimfit', sku: 'PAK-CC-002', price: 145000, stock: 30, cat: 'Pakaian & Fashion' },
      
      { name: 'Kertas HVS A4 80gr Sidu', sku: 'ATK-K4-001', price: 52000, stock: 25, cat: 'Alat Tulis Kantor' },
      { name: 'Pulpen Gel Pilot G2', sku: 'ATK-PP-002', price: 14000, stock: 110, cat: 'Alat Tulis Kantor' }
    ];

    const productMap = {};
    for (const prod of productsData) {
      const prodRes = await client.query(
        `INSERT INTO products (company_id, category_id, name, sku, description, price, stock, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING id, name, price`,
        [
          companyId,
          categoryMap[prod.cat],
          prod.name,
          prod.sku,
          `Demo product ${prod.name}`,
          prod.price,
          prod.stock
        ]
      );
      productMap[prod.name] = prodRes.rows[0];
      
      // Also add initial stock transactions
      await client.query(
        `INSERT INTO inventory_transactions (company_id, product_id, type, quantity, created_at, updated_at)
         VALUES ($1, $2, 'in', $3, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days')`,
        [companyId, prodRes.rows[0].id, prod.stock]
      );
    }

    // 4. Seed Suppliers
    const suppliersData = [
      { name: 'PT Sinar Abadi Distributor', contact: 'Andi Wijaya', phone: '081234567890', email: 'andi@sinarabadi.com', address: 'Kawasan Industri Pulogadung, Jakarta' },
      { name: 'CV Pangan Makmur Bersama', contact: 'Siti Rahma', phone: '082187654321', email: 'siti@panganmakmur.com', address: 'Jl. Merdeka No. 45, Bandung' }
    ];

    const supplierMap = {};
    for (const sup of suppliersData) {
      const supRes = await client.query(
        `INSERT INTO suppliers (company_id, name, contact_person, phone, email, address, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id, name`,
        [companyId, sup.name, sup.contact, sup.phone, sup.email, sup.address]
      );
      supplierMap[sup.name] = supRes.rows[0].id;
    }

    // Get an admin/user ID to associate POs and sales
    const userRes = await client.query('SELECT id FROM users WHERE company_id = $1 LIMIT 1', [companyId]);
    const userId = userRes.rows.length > 0 ? userRes.rows[0].id : null;

    // 5. Seed Purchase Orders
    // PO 1 (Received)
    const poNumber1 = 'PO-20260525-4819';
    const po1Res = await client.query(
      `INSERT INTO purchase_orders (company_id, supplier_id, order_number, status, total_amount, notes, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, 'received', 11700000, 'Pesanan produk IT awal', $4, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days') RETURNING id`,
      [companyId, supplierMap['PT Sinar Abadi Distributor'], poNumber1, userId]
    );
    await client.query(
      `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price, subtotal)
       VALUES ($1, $2, 1, 8000000, 8000000), ($1, $3, 20, 185000, 3700000)`,
      [po1Res.rows[0].id, productMap['Laptop ASUS Vivobook'].id, productMap['Mouse Wireless Logitech'].id]
    );

    // PO 2 (Pending)
    const poNumber2 = 'PO-20260601-7291';
    const po2Res = await client.query(
      `INSERT INTO purchase_orders (company_id, supplier_id, order_number, status, total_amount, notes, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, 'pending', 560000, 'Stok ulang ATK bulanan', $4, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days') RETURNING id`,
      [companyId, supplierMap['PT Sinar Abadi Distributor'], poNumber2, userId]
    );
    await client.query(
      `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price, subtotal)
       VALUES ($1, $2, 10, 42000, 420000), ($1, $3, 10, 14000, 140000)`,
      [po2Res.rows[0].id, productMap['Kertas HVS A4 80gr Sidu'].id, productMap['Pulpen Gel Pilot G2'].id]
    );

    // 6. Seed Sales (Spanned over the last 7 days for the chart)
    const salesData = [
      { daysAgo: 6, customer: 'Rudi Hermawan', pay: 'cash', items: [
        { name: 'Kopi Susu Aren 250ml', qty: 3 },
        { name: 'Roti Sobek Cokelat', qty: 2 }
      ]},
      { daysAgo: 5, customer: 'Dewi Lestari', pay: 'qris', items: [
        { name: 'Kaos Polos Cotton 30s', qty: 2 },
        { name: 'Mouse Wireless Logitech', qty: 1 }
      ]},
      { daysAgo: 4, customer: 'Walk-in Customer', pay: 'cash', items: [
        { name: 'Roti Sobek Cokelat', qty: 1 },
        { name: 'Keripik Singkong Balado', qty: 3 }
      ]},
      { daysAgo: 3, customer: 'Anwar Sadat', pay: 'transfer', items: [
        { name: 'Laptop ASUS Vivobook', qty: 1 }
      ]},
      { daysAgo: 3, customer: 'Walk-in Customer', pay: 'cash', items: [
        { name: 'Pulpen Gel Pilot G2', qty: 5 },
        { name: 'Kertas HVS A4 80gr Sidu', qty: 1 }
      ]},
      { daysAgo: 2, customer: 'Citra Kirana', pay: 'qris', items: [
        { name: 'Kaos Polos Cotton 30s', qty: 1 },
        { name: 'Celana Chino Slimfit', qty: 1 }
      ]},
      { daysAgo: 1, customer: 'Walk-in Customer', pay: 'cash', items: [
        { name: 'Kopi Susu Aren 250ml', qty: 5 },
        { name: 'Keripik Singkong Balado', qty: 2 },
        { name: 'Roti Sobek Cokelat', qty: 2 }
      ]},
      { daysAgo: 0, customer: 'Bambang Tri', pay: 'qris', items: [
        { name: 'Keyboard Mechanical Rexus', qty: 1 },
        { name: 'Mouse Wireless Logitech', qty: 2 }
      ]}
    ];

    for (const sale of salesData) {
      let totalAmount = 0;
      const invoiceNumber = `INV-2026060${7 - sale.daysAgo}-${Math.floor(1000 + Math.random() * 9000)}`;

      const saleRes = await client.query(
        `INSERT INTO sales (company_id, invoice_number, customer_name, total_amount, payment_method, cashier_id, created_at)
         VALUES ($1, $2, $3, 0, $4, $5, NOW() - INTERVAL '${sale.daysAgo} days') RETURNING id`,
        [companyId, invoiceNumber, sale.customer, sale.pay, userId]
      );
      const saleId = saleRes.rows[0].id;

      for (const item of sale.items) {
        const prod = productMap[item.name];
        const subtotal = item.qty * parseFloat(prod.price);
        totalAmount += subtotal;

        await client.query(
          `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [saleId, prod.id, item.qty, prod.price, subtotal]
        );

        // Record stock reduction & transaction
        await client.query(
          `INSERT INTO inventory_transactions (company_id, product_id, type, quantity, created_at, updated_at)
           VALUES ($1, $2, 'out', $3, NOW() - INTERVAL '${sale.daysAgo} days', NOW() - INTERVAL '${sale.daysAgo} days')`,
          [companyId, prod.id, item.qty]
        );
      }

      // Update sale grand total
      await client.query('UPDATE sales SET total_amount = $1 WHERE id = $2', [totalAmount, saleId]);
    }

    // 7. Seed Employees
    const employeesData = [
      { name: 'Agus Prayitno', pos: 'Kasir Utama', dept: 'Operasional', phone: '085311223344', email: 'agus@tokodemo.com', hire: '2025-01-15', salary: 3800000, status: 'active' },
      { name: 'Lia Safitri', pos: 'Staf Gudang', dept: 'Inventory & Logistik', phone: '085355667788', email: 'lia@tokodemo.com', hire: '2025-03-01', salary: 3600000, status: 'active' },
      { name: 'Doni Setiawan', pos: 'Supervisor Toko', dept: 'Manajemen', phone: '085399001122', email: 'doni@tokodemo.com', hire: '2024-06-10', salary: 5000000, status: 'active' }
    ];

    const employeeIds = [];
    for (const emp of employeesData) {
      const empRes = await client.query(
        `INSERT INTO employees (company_id, name, position, department, phone, email, hire_date, salary, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING id`,
        [companyId, emp.name, emp.pos, emp.dept, emp.phone, emp.email, emp.hire, emp.salary, emp.status]
      );
      employeeIds.push(empRes.rows[0].id);
    }

    // 8. Seed Attendance (For past 5 days)
    for (let dAgo = 4; dAgo >= 0; dAgo--) {
      // Don't seed on weekend days (Sunday/Saturday) if we want to be realistic, but let's just seed all 5 days
      const attDate = new Date();
      attDate.setDate(attDate.getDate() - dAgo);
      const dateString = attDate.toISOString().split('T')[0];

      for (const empId of employeeIds) {
        // Randomize attendance status
        const statuses = ['present', 'present', 'present', 'present', 'late', 'present'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        let checkIn = '08:00:00';
        let checkOut = '17:00:00';
        let notes = '';

        if (status === 'late') {
          checkIn = '08:45:00';
          notes = 'Terlambat karena macet';
        }

        await client.query(
          `INSERT INTO attendance (company_id, employee_id, date, check_in, check_out, status, notes, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '${dAgo} days')`,
          [companyId, empId, dateString, checkIn, checkOut, status, notes]
        );
      }
    }

    await client.query('COMMIT');
    return res.status(200).json({
      message: `Database seeded successfully for company "${companyName}"!`,
      details: {
        categories: categoriesData.length,
        products: productsData.length,
        suppliers: suppliersData.length,
        purchase_orders: 2,
        sales: salesData.length,
        employees: employeesData.length,
        attendance_days: 5
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeder execution error:', error);
    return res.status(500).json({ error: 'Database seeding failed', details: error.message });
  } finally {
    client.release();
  }
}
