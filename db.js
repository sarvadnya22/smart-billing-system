// db.js - Fail-safe Dual Mode Database Layer (SQL Backend + LocalStorage Fallback)

const DB_PREFIX = "smart_billing_";
const API_BASE = "http://localhost:3000/api";

const KEYS = {
    PRODUCTS: DB_PREFIX + "products",
    INVOICES: DB_PREFIX + "invoices",
    CUSTOMERS: DB_PREFIX + "customers",
    SETTINGS: DB_PREFIX + "settings",
};

// Default Store Profile settings fallback
const DEFAULT_SETTINGS = {
    storeName: "Smart Mart & Electronics",
    address: "123, Dynamic Tech Park, Sector 62, Noida, UP, India",
    phone: "+91 98765 43210",
    email: "billing@smartmart.com",
    gstin: "09AAAAA1111A1Z1",
    currency: "₹",
    terms: "Thank you for shopping with us! Goods once sold cannot be returned. Please check before leaving.",
    authEnabled: false,
    passcode: "1234"
};

const db = {
    isServerOnline: false,

    // Probe the backend server health check
    checkConnection: async () => {
        try {
            // Set a quick 1.2-second timeout so it doesn't hang if offline
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1200);

            const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                db.isServerOnline = true;
                console.log("SQL Backend Connected (API Mode active)");
            } else {
                db.isServerOnline = false;
            }
        } catch (e) {
            db.isServerOnline = false;
            console.warn("SQL Backend Offline. LocalStorage fallback mode active.");
        }
        return db.isServerOnline;
    },

    // Initialize LocalStorage structures as a backup seeder
    initializeLocalDB: () => {
        if (!localStorage.getItem(KEYS.SETTINGS)) {
            localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        }
        if (!localStorage.getItem(KEYS.PRODUCTS)) {
            const MOCK_PRODUCTS = [
                { id: "p1", code: "PROD001", name: "iPhone 15 Pro Max 256GB", category: "Electronics", price: 129999.00, cost: 110000.00, taxRate: 18, stock: 15 },
                { id: "p2", code: "PROD002", name: "Samsung Galaxy S24 Ultra", category: "Electronics", price: 119999.00, cost: 98000.00, taxRate: 18, stock: 20 },
                { id: "p3", code: "PROD003", name: "Sony WH-1000XM5 Headphones", category: "Accessories", price: 29999.00, cost: 24000.00, taxRate: 18, stock: 8 },
                { id: "p4", code: "PROD004", name: "Dell XPS 13 Laptop", category: "Computers", price: 145000.00, cost: 125000.00, taxRate: 18, stock: 5 }
            ];
            localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(MOCK_PRODUCTS));
        }
        if (!localStorage.getItem(KEYS.CUSTOMERS)) {
            const MOCK_CUSTOMERS = [
                { id: "c1", name: "Rahul Sharma", phone: "9876543201", email: "rahul.sharma@example.com", address: "A-45, Green Park, New Delhi", gstin: "07AAAAA1234A1ZA" }
            ];
            localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(MOCK_CUSTOMERS));
        }
        if (!localStorage.getItem(KEYS.INVOICES)) {
            localStorage.setItem(KEYS.INVOICES, JSON.stringify([]));
        }
    },

    // ==========================================
    // PRODUCTS CRUD (ASYNCHRONOUS)
    // ==========================================
    getProducts: async () => {
        if (db.isServerOnline) {
            try {
                const res = await fetch(`${API_BASE}/products`);
                if (res.ok) return await res.json();
            } catch(e) { db.isServerOnline = false; }
        }
        return JSON.parse(localStorage.getItem(KEYS.PRODUCTS)) || [];
    },

    saveProductsLocal: (products) => {
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    },

    addProduct: async (product) => {
        product.id = 'p_' + Date.now();
        if (db.isServerOnline) {
            try {
                const res = await fetch(`${API_BASE}/products`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(product)
                });
                if (res.ok) return product;
            } catch(e) { db.isServerOnline = false; }
        }
        // Local Fallback
        const list = await db.getProducts();
        list.push(product);
        db.saveProductsLocal(list);
        return product;
    },

    updateProduct: async (updatedProduct) => {
        if (db.isServerOnline) {
            try {
                const res = await fetch(`${API_BASE}/products`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedProduct)
                });
                if (res.ok) return true;
            } catch(e) { db.isServerOnline = false; }
        }
        // Local Fallback
        const list = await db.getProducts();
        const idx = list.findIndex(p => p.id === updatedProduct.id);
        if (idx !== -1) {
            list[idx] = updatedProduct;
            db.saveProductsLocal(list);
            return true;
        }
        return false;
    },

    deleteProduct: async (id) => {
        if (db.isServerOnline) {
            try {
                const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
                if (res.ok) return true;
            } catch(e) { db.isServerOnline = false; }
        }
        // Local Fallback
        const list = await db.getProducts();
        const filtered = list.filter(p => p.id !== id);
        db.saveProductsLocal(filtered);
        return true;
    },

    updateProductStock: async (id, qtyToReduce) => {
        // Fetch current product, update stock locally or on server
        const list = await db.getProducts();
        const prod = list.find(p => p.id === id);
        if (prod) {
            prod.stock = Math.max(0, prod.stock - qtyToReduce);
            await db.updateProduct(prod);
        }
    },

    // ==========================================
    // CUSTOMERS CRUD (ASYNCHRONOUS)
    // ==========================================
    getCustomers: async () => {
        if (db.isServerOnline) {
            try {
                const res = await fetch(`${API_BASE}/customers`);
                if (res.ok) return await res.json();
            } catch(e) { db.isServerOnline = false; }
        }
        return JSON.parse(localStorage.getItem(KEYS.CUSTOMERS)) || [];
    },

    saveCustomersLocal: (customers) => {
        localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
    },

    addCustomer: async (customer) => {
        customer.id = 'c_' + Date.now();
        if (db.isServerOnline) {
            try {
                const res = await fetch(`${API_BASE}/customers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(customer)
                });
                if (res.ok) return customer;
            } catch(e) { db.isServerOnline = false; }
        }
        // Local Fallback
        const list = await db.getCustomers();
        list.push(customer);
        db.saveCustomersLocal(list);
        return customer;
    },

    updateCustomer: async (updatedCustomer) => {
        if (db.isServerOnline) {
            try {
                const res = await fetch(`${API_BASE}/customers`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedCustomer)
                });
                if (res.ok) return true;
            } catch(e) { db.isServerOnline = false; }
        }
        // Local Fallback
        const list = await db.getCustomers();
        const idx = list.findIndex(c => c.id === updatedCustomer.id);
        if (idx !== -1) {
            list[idx] = updatedCustomer;
            db.saveCustomersLocal(list);
            return true;
        }
        return false;
    },

    deleteCustomer: async (id) => {
        if (db.isServerOnline) {
            try {
                const res = await fetch(`${API_BASE}/customers/${id}`, { method: 'DELETE' });
                if (res.ok) return true;
            } catch(e) { db.isServerOnline = false; }
        }
        // Local Fallback
        const list = await db.getCustomers();
        const filtered = list.filter(c => c.id !== id);
        db.saveCustomersLocal(filtered);
        return true;
    },

    // ==========================================
    // INVOICES CRUD (ASYNCHRONOUS)
    // ==========================================
    getInvoices: async () => {
        if (db.isServerOnline) {
            try {
                const res = await fetch(`${API_BASE}/invoices`);
                if (res.ok) return await res.json();
            } catch(e) { db.isServerOnline = false; }
        }
        return JSON.parse(localStorage.getItem(KEYS.INVOICES)) || [];
    },

    saveInvoicesLocal: (invoices) => {
        localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
    },

    addInvoice: async (invoice) => {
        if (db.isServerOnline) {
            try {
                const res = await fetch(`${API_BASE}/invoices`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invoice)
                });
                if (res.ok) return invoice;
            } catch(e) { db.isServerOnline = false; }
        }
        // Local Fallback
        const list = await db.getInvoices();
        list.unshift(invoice);
        db.saveInvoicesLocal(list);
        return invoice;
    },

    updateInvoiceStatus: async (id, status) => {
        if (db.isServerOnline) {
            try {
                const res = await fetch(`${API_BASE}/invoices/${id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status })
                });
                if (res.ok) return true;
            } catch(e) { db.isServerOnline = false; }
        }
        // Local Fallback
        const list = await db.getInvoices();
        const idx = list.findIndex(inv => inv.id === id);
        if (idx !== -1) {
            list[idx].status = status;
            db.saveInvoicesLocal(list);
            return true;
        }
        return false;
    },

    deleteInvoice: async (id) => {
        if (db.isServerOnline) {
            try {
                const res = await fetch(`${API_BASE}/invoices/${id}`, { method: 'DELETE' });
                if (res.ok) return true;
            } catch(e) { db.isServerOnline = false; }
        }
        // Local Fallback
        const list = await db.getInvoices();
        const filtered = list.filter(inv => inv.id !== id);
        db.saveInvoicesLocal(filtered);
        return true;
    },

    // ==========================================
    // SETTINGS CRUD (ASYNCHRONOUS)
    // ==========================================
    getSettings: async () => {
        if (db.isServerOnline) {
            try {
                const res = await fetch(`${API_BASE}/settings`);
                if (res.ok) return await res.json();
            } catch(e) { db.isServerOnline = false; }
        }
        return JSON.parse(localStorage.getItem(KEYS.SETTINGS)) || DEFAULT_SETTINGS;
    },

    saveSettings: async (settings) => {
        if (db.isServerOnline) {
            try {
                const res = await fetch(`${API_BASE}/settings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(settings)
                });
                if (res.ok) return true;
            } catch(e) { db.isServerOnline = false; }
        }
        // Local Fallback
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
        return true;
    },

    // ==========================================
    // BACKUP & RESET OPERATIONS
    // ==========================================
    exportBackup: async () => {
        const backupData = {
            settings: await db.getSettings(),
            products: await db.getProducts(),
            customers: await db.getCustomers(),
            invoices: await db.getInvoices(),
            exportedAt: new Date().toISOString()
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `billing_backup_${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    },

    importBackup: async (jsonContent) => {
        try {
            const data = JSON.parse(jsonContent);
            if (data.settings && data.products && data.customers && data.invoices) {
                if (db.isServerOnline) {
                    // Seed server database (for this demo, we reset tables first)
                    // Then we populate products, customers, and invoices sequentially
                    await fetch(`${API_BASE}/reset`, { method: 'POST' });
                    await fetch(`${API_BASE}/settings`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data.settings)
                    });
                    for (const p of data.products) {
                        await fetch(`${API_BASE}/products`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(p)
                        });
                    }
                    for (const c of data.customers) {
                        await fetch(`${API_BASE}/customers`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(c)
                        });
                    }
                    for (const inv of data.invoices) {
                        await fetch(`${API_BASE}/invoices`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(inv)
                        });
                    }
                } else {
                    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(data.settings));
                    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(data.products));
                    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(data.customers));
                    localStorage.setItem(KEYS.INVOICES, JSON.stringify(data.invoices));
                }
                return { success: true };
            }
            return { success: false, message: "Invalid backup file structure." };
        } catch (e) {
            return { success: false, message: e.message };
        }
    },

    resetDatabase: async () => {
        if (db.isServerOnline) {
            try {
                await fetch(`${API_BASE}/reset`, { method: 'POST' });
                return true;
            } catch(e) { db.isServerOnline = false; }
        }
        localStorage.clear();
        db.initializeLocalDB();
        return true;
    }
};

// Auto-run local backup preparation immediately
db.initializeLocalDB();
window.db = db;
