// server.js - Node.js Express and SQLite Server for Smart Billing System

const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Initialize SQLite database connection
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
    } else {
        console.log("Connected to SQLite Database: database.sqlite");
        initializeTables();
    }
});

// Setup schema tables if they don't exist
function initializeTables() {
    db.serialize(() => {
        // 1. Settings Table (Single-row configuration)
        db.run(`CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            storeName TEXT,
            address TEXT,
            phone TEXT,
            email TEXT,
            gstin TEXT,
            currency TEXT,
            terms TEXT,
            authEnabled INTEGER DEFAULT 0,
            passcode TEXT
        )`);

        // Seed default settings if empty
        db.get("SELECT COUNT(*) AS count FROM settings", (err, row) => {
            if (row && row.count === 0) {
                db.run(`INSERT INTO settings (id, storeName, address, phone, email, gstin, currency, terms, authEnabled, passcode) 
                    VALUES (1, 'Smart Mart & Electronics', '123, Dynamic Tech Park, Sector 62, Noida, UP, India', '+91 98765 43210', 'billing@smartmart.com', '09AAAAA1111A1Z1', '₹', 'Thank you for shopping with us! Goods once sold cannot be returned. Please check before leaving.', 0, '1234')`);
            }
        });

        // 2. Products Table
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            code TEXT UNIQUE,
            name TEXT,
            category TEXT,
            price REAL,
            cost REAL,
            taxRate INTEGER,
            stock INTEGER
        )`);

        // Seed mock products if empty
        db.get("SELECT COUNT(*) AS count FROM products", (err, row) => {
            if (row && row.count === 0) {
                const MOCK_PRODUCTS = [
                    { id: "p1", code: "PROD001", name: "iPhone 15 Pro Max 256GB", category: "Electronics", price: 129999.00, cost: 110000.00, taxRate: 18, stock: 15 },
                    { id: "p2", code: "PROD002", name: "Samsung Galaxy S24 Ultra", category: "Electronics", price: 119999.00, cost: 98000.00, taxRate: 18, stock: 20 },
                    { id: "p3", code: "PROD003", name: "Sony WH-1000XM5 Headphones", category: "Accessories", price: 29999.00, cost: 24000.00, taxRate: 18, stock: 8 },
                    { id: "p4", code: "PROD004", name: "Dell XPS 13 Laptop", category: "Computers", price: 145000.00, cost: 125000.00, taxRate: 18, stock: 5 },
                    { id: "p5", code: "PROD005", name: "Apple Watch Series 9", category: "Wearables", price: 41999.00, cost: 35000.00, taxRate: 12, stock: 12 },
                    { id: "p6", code: "PROD006", name: "Logitech MX Master 3S", category: "Accessories", price: 9495.00, cost: 7500.00, taxRate: 18, stock: 45 },
                    { id: "p7", code: "PROD007", name: "SanDisk 1TB SSD Portable", category: "Accessories", price: 7999.00, cost: 6000.00, taxRate: 18, stock: 3 },
                    { id: "p8", code: "PROD008", name: "Mi Smart Air Purifier 4", category: "Appliances", price: 13999.00, cost: 11500.00, taxRate: 12, stock: 9 }
                ];
                const stmt = db.prepare("INSERT INTO products (id, code, name, category, price, cost, taxRate, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                MOCK_PRODUCTS.forEach(p => {
                    stmt.run(p.id, p.code, p.name, p.category, p.price, p.cost, p.taxRate, p.stock);
                });
                stmt.finalize();
            }
        });

        // 3. Customers Table
        db.run(`CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            name TEXT,
            phone TEXT UNIQUE,
            email TEXT,
            address TEXT,
            gstin TEXT
        )`);

        // Seed mock customers if empty
        db.get("SELECT COUNT(*) AS count FROM customers", (err, row) => {
            if (row && row.count === 0) {
                const MOCK_CUSTOMERS = [
                    { id: "c1", name: "Rahul Sharma", phone: "9876543201", email: "rahul.sharma@example.com", address: "A-45, Green Park, New Delhi", gstin: "07AAAAA1234A1ZA" },
                    { id: "c2", name: "Priya Patel", phone: "9988776655", email: "priya.patel@example.com", address: "302, Royal Residency, Mumbai", gstin: "" },
                    { id: "c3", name: "Amit Verma", phone: "8877665544", email: "amit.verma@example.com", address: "Flat 12B, Regency Heights, Bangalore", gstin: "29BBBBB5678B1ZB" }
                ];
                const stmt = db.prepare("INSERT INTO customers (id, name, phone, email, address, gstin) VALUES (?, ?, ?, ?, ?, ?)");
                MOCK_CUSTOMERS.forEach(c => {
                    stmt.run(c.id, c.name, c.phone, c.email, c.address, c.gstin);
                });
                stmt.finalize();
            }
        });

        // 4. Invoices Table
        db.run(`CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY,
            date TEXT,
            customer TEXT, -- JSON stringified customer details
            items TEXT,    -- JSON stringified items array
            subtotal REAL,
            taxTotal REAL,
            discountTotal REAL,
            grandTotal REAL,
            paymentMode TEXT,
            status TEXT,
            remarks TEXT
        )`);

        // Seed mock invoices if empty
        db.get("SELECT COUNT(*) AS count FROM invoices", (err, row) => {
            if (row && row.count === 0) {
                const today = new Date();
                const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
                const dayBefore = new Date(today); dayBefore.setDate(today.getDate() - 2);

                const mockInvoices = [
                    {
                        id: "INV-1001",
                        date: dayBefore.toISOString().split('T')[0] + " 11:24",
                        customer: JSON.stringify({ id: "c1", name: "Rahul Sharma", phone: "9876543201", email: "rahul.sharma@example.com", address: "A-45, Green Park, New Delhi", gstin: "07AAAAA1234A1ZA" }),
                        items: JSON.stringify([
                            { id: "p1", name: "iPhone 15 Pro Max 256GB", price: 129999.00, qty: 1, discountPercent: 5, taxRate: 18, subtotal: 123499.05, tax: 22229.83, total: 145728.88 }
                        ]),
                        subtotal: 123499.05,
                        taxTotal: 22229.83,
                        discountTotal: 6499.95,
                        grandTotal: 145728.88,
                        paymentMode: "UPI",
                        status: "Paid",
                        remarks: "Fast delivery requested"
                    },
                    {
                        id: "INV-1002",
                        date: yesterday.toISOString().split('T')[0] + " 15:42",
                        customer: JSON.stringify({ id: "c2", name: "Priya Patel", phone: "9988776655", email: "priya.patel@example.com", address: "302, Royal Residency, Mumbai", gstin: "" }),
                        items: JSON.stringify([
                            { id: "p3", name: "Sony WH-1000XM5 Headphones", price: 29999.00, qty: 2, discountPercent: 10, taxRate: 18, subtotal: 53998.20, tax: 9719.68, total: 63717.88 },
                            { id: "p6", name: "Logitech MX Master 3S", price: 9495.00, qty: 1, discountPercent: 0, taxRate: 18, subtotal: 9495.00, tax: 1709.10, total: 11204.10 }
                        ]),
                        subtotal: 63493.20,
                        taxTotal: 11428.78,
                        discountTotal: 5999.80,
                        grandTotal: 74921.98,
                        paymentMode: "Card",
                        status: "Paid",
                        remarks: ""
                    },
                    {
                        id: "INV-1003",
                        date: today.toISOString().split('T')[0] + " 10:15",
                        customer: JSON.stringify({ id: "c3", name: "Amit Verma", phone: "8877665544", email: "amit.verma@example.com", address: "Flat 12B, Regency Heights, Bangalore", gstin: "29BBBBB5678B1ZB" }),
                        items: JSON.stringify([
                            { id: "p5", name: "Apple Watch Series 9", price: 41999.00, qty: 1, discountPercent: 0, taxRate: 12, subtotal: 41999.00, tax: 5039.88, total: 47038.88 }
                        ]),
                        subtotal: 41999.00,
                        taxTotal: 5039.88,
                        discountTotal: 0.00,
                        grandTotal: 47038.88,
                        paymentMode: "Cash",
                        status: "Pending",
                        remarks: "Will clear balance by evening"
                    }
                ];

                const stmt = db.prepare("INSERT INTO invoices (id, date, customer, items, subtotal, taxTotal, discountTotal, grandTotal, paymentMode, status, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                mockInvoices.forEach(inv => {
                    stmt.run(inv.id, inv.date, inv.customer, inv.items, inv.subtotal, inv.taxTotal, inv.discountTotal, inv.grandTotal, inv.paymentMode, inv.status, inv.remarks);
                });
                stmt.finalize();
            }
        });
    });
}

// REST API Endpoints

// 1. Health Probe Check
app.get('/api/health', (req, res) => {
    res.json({ status: "ok" });
});

// 2. Settings Endpoints
app.get('/api/settings', (req, res) => {
    db.get("SELECT * FROM settings WHERE id = 1", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        // Convert integer boolean back to boolean for JS
        if (row) {
            row.authEnabled = row.authEnabled === 1;
        }
        res.json(row);
    });
});

app.post('/api/settings', (req, res) => {
    const { storeName, address, phone, email, gstin, currency, terms, authEnabled, passcode } = req.body;
    const authFlag = authEnabled ? 1 : 0;
    
    db.run(`UPDATE settings SET storeName = ?, address = ?, phone = ?, email = ?, gstin = ?, currency = ?, terms = ?, authEnabled = ?, passcode = ? WHERE id = 1`,
        [storeName, address, phone, email, gstin, currency, terms, authFlag, passcode],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// 3. Products CRUD
app.get('/api/products', (req, res) => {
    db.all("SELECT * FROM products", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/products', (req, res) => {
    const { id, code, name, category, price, cost, taxRate, stock } = req.body;
    db.run(`INSERT INTO products (id, code, name, category, price, cost, taxRate, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, code, name, category, price, cost, taxRate, stock],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: id });
        }
    );
});

app.put('/api/products', (req, res) => {
    const { id, code, name, category, price, cost, taxRate, stock } = req.body;
    db.run(`UPDATE products SET code = ?, name = ?, category = ?, price = ?, cost = ?, taxRate = ?, stock = ? WHERE id = ?`,
        [code, name, category, price, cost, taxRate, stock, id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

app.delete('/api/products/:id', (req, res) => {
    db.run(`DELETE FROM products WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// 4. Customers CRUD
app.get('/api/customers', (req, res) => {
    db.all("SELECT * FROM customers", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/customers', (req, res) => {
    const { id, name, phone, email, address, gstin } = req.body;
    db.run(`INSERT INTO customers (id, name, phone, email, address, gstin) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, name, phone, email, address, gstin],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: id });
        }
    );
});

app.put('/api/customers', (req, res) => {
    const { id, name, phone, email, address, gstin } = req.body;
    db.run(`UPDATE customers SET name = ?, phone = ?, email = ?, address = ?, gstin = ? WHERE id = ?`,
        [name, phone, email, address, gstin, id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

app.delete('/api/customers/:id', (req, res) => {
    db.run(`DELETE FROM customers WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// 5. Invoices CRUD
app.get('/api/invoices', (req, res) => {
    db.all("SELECT * FROM invoices ORDER BY rowid DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Parse JSON strings back to objects for the client
        const parsedRows = rows.map(r => {
            try { r.customer = JSON.parse(r.customer); } catch(e) {}
            try { r.items = JSON.parse(r.items); } catch(e) {}
            return r;
        });
        res.json(parsedRows);
    });
});

app.post('/api/invoices', (req, res) => {
    const { id, date, customer, items, subtotal, taxTotal, discountTotal, grandTotal, paymentMode, status, remarks } = req.body;
    db.run(`INSERT INTO invoices (id, date, customer, items, subtotal, taxTotal, discountTotal, grandTotal, paymentMode, status, remarks) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, date, JSON.stringify(customer), JSON.stringify(items), subtotal, taxTotal, discountTotal, grandTotal, paymentMode, status, remarks],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: id });
        }
    );
});

app.put('/api/invoices/:id/status', (req, res) => {
    const { status } = req.body;
    db.run(`UPDATE invoices SET status = ? WHERE id = ?`, [status, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/invoices/:id', (req, res) => {
    db.run(`DELETE FROM invoices WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// 6. DB Reset Endpoint (clears tables and re-seeds)
app.post('/api/reset', (req, res) => {
    db.serialize(() => {
        db.run("DROP TABLE IF EXISTS settings");
        db.run("DROP TABLE IF EXISTS products");
        db.run("DROP TABLE IF EXISTS customers");
        db.run("DROP TABLE IF EXISTS invoices");
        initializeTables();
        res.json({ success: true });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Smart Billing System Backend Server running on http://localhost:${PORT}`);
});
