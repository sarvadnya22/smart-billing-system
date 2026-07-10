// db.js - LocalStorage Database Layer for Smart Billing System

const DB_PREFIX = "smart_billing_";

const KEYS = {
    PRODUCTS: DB_PREFIX + "products",
    INVOICES: DB_PREFIX + "invoices",
    CUSTOMERS: DB_PREFIX + "customers",
    SETTINGS: DB_PREFIX + "settings",
    AUTH: DB_PREFIX + "auth"
};

// Default Store Profile settings
const DEFAULT_SETTINGS = {
    storeName: "Smart Mart & Electronics",
    address: "123, Dynamic Tech Park, Sector 62, Noida, UP, India",
    phone: "+91 98765 43210",
    email: "billing@smartmart.com",
    gstin: "09AAAAA1111A1Z1",
    currency: "₹",
    terms: "Thank you for shopping with us! Goods once sold cannot be returned. Please check before leaving.",
    authEnabled: false, // Login is disabled by default
    passcode: "1234"
};

// Initial Seed Data for Products
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

// Initial Seed Data for Customers
const MOCK_CUSTOMERS = [
    { id: "c1", name: "Rahul Sharma", phone: "9876543201", email: "rahul.sharma@example.com", address: "A-45, Green Park, New Delhi", gstin: "07AAAAA1234A1ZA" },
    { id: "c2", name: "Priya Patel", phone: "9988776655", email: "priya.patel@example.com", address: "302, Royal Residency, Mumbai", gstin: "" },
    { id: "c3", name: "Amit Verma", phone: "8877665544", email: "amit.verma@example.com", address: "Flat 12B, Regency Heights, Bangalore", gstin: "29BBBBB5678B1ZB" }
];

// Helper to seed standard data if localStorage is empty
function initializeDB() {
    if (!localStorage.getItem(KEYS.SETTINGS)) {
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!localStorage.getItem(KEYS.PRODUCTS)) {
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(MOCK_PRODUCTS));
    }
    if (!localStorage.getItem(KEYS.CUSTOMERS)) {
        localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(MOCK_CUSTOMERS));
    }
    if (!localStorage.getItem(KEYS.INVOICES)) {
        // Create 3-4 default invoices to make dashboard look pretty on load
        const today = new Date();
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        const dayBefore = new Date(today); dayBefore.setDate(today.getDate() - 2);
        
        const mockInvoices = [
            {
                id: "INV-1001",
                date: dayBefore.toISOString().split('T')[0] + " 11:24",
                customer: MOCK_CUSTOMERS[0],
                items: [
                    { id: "p1", name: "iPhone 15 Pro Max 256GB", price: 129999.00, qty: 1, discountPercent: 5, taxRate: 18, subtotal: 123499.05, tax: 22229.83, total: 145728.88 }
                ],
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
                customer: MOCK_CUSTOMERS[1],
                items: [
                    { id: "p3", name: "Sony WH-1000XM5 Headphones", price: 29999.00, qty: 2, discountPercent: 10, taxRate: 18, subtotal: 53998.20, tax: 9719.68, total: 63717.88 },
                    { id: "p6", name: "Logitech MX Master 3S", price: 9495.00, qty: 1, discountPercent: 0, taxRate: 18, subtotal: 9495.00, tax: 1709.10, total: 11204.10 }
                ],
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
                customer: MOCK_CUSTOMERS[2],
                items: [
                    { id: "p5", name: "Apple Watch Series 9", price: 41999.00, qty: 1, discountPercent: 0, taxRate: 12, subtotal: 41999.00, tax: 5039.88, total: 47038.88 }
                ],
                subtotal: 41999.00,
                taxTotal: 5039.88,
                discountTotal: 0.00,
                grandTotal: 47038.88,
                paymentMode: "Cash",
                status: "Pending",
                remarks: "Will clear balance by evening"
            }
        ];
        localStorage.setItem(KEYS.INVOICES, JSON.stringify(mockInvoices));
    }
}

// Global DB access object
const db = {
    // PRODUCTS
    getProducts: () => JSON.parse(localStorage.getItem(KEYS.PRODUCTS)) || [],
    saveProducts: (products) => localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products)),
    addProduct: (product) => {
        const products = db.getProducts();
        product.id = 'p_' + Date.now();
        products.push(product);
        db.saveProducts(products);
        return product;
    },
    updateProduct: (updatedProduct) => {
        const products = db.getProducts();
        const idx = products.findIndex(p => p.id === updatedProduct.id);
        if (idx !== -1) {
            products[idx] = updatedProduct;
            db.saveProducts(products);
            return true;
        }
        return false;
    },
    deleteProduct: (id) => {
        const products = db.getProducts();
        const filtered = products.filter(p => p.id !== id);
        db.saveProducts(filtered);
    },
    updateProductStock: (id, quantityToReduce) => {
        const products = db.getProducts();
        const product = products.find(p => p.id === id);
        if (product) {
            product.stock = Math.max(0, product.stock - quantityToReduce);
            db.saveProducts(products);
        }
    },

    // CUSTOMERS
    getCustomers: () => JSON.parse(localStorage.getItem(KEYS.CUSTOMERS)) || [],
    saveCustomers: (customers) => localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers)),
    addCustomer: (customer) => {
        const customers = db.getCustomers();
        customer.id = 'c_' + Date.now();
        customers.push(customer);
        db.saveCustomers(customers);
        return customer;
    },
    updateCustomer: (updatedCustomer) => {
        const customers = db.getCustomers();
        const idx = customers.findIndex(c => c.id === updatedCustomer.id);
        if (idx !== -1) {
            customers[idx] = updatedCustomer;
            db.saveCustomers(customers);
            return true;
        }
        return false;
    },
    deleteCustomer: (id) => {
        const customers = db.getCustomers();
        const filtered = customers.filter(c => c.id !== id);
        db.saveCustomers(filtered);
    },

    // INVOICES
    getInvoices: () => JSON.parse(localStorage.getItem(KEYS.INVOICES)) || [],
    saveInvoices: (invoices) => localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices)),
    addInvoice: (invoice) => {
        const invoices = db.getInvoices();
        invoices.unshift(invoice); // Add new invoices to the top
        db.saveInvoices(invoices);
        return invoice;
    },
    updateInvoiceStatus: (id, status) => {
        const invoices = db.getInvoices();
        const idx = invoices.findIndex(inv => inv.id === id);
        if (idx !== -1) {
            invoices[idx].status = status;
            db.saveInvoices(invoices);
            return true;
        }
        return false;
    },
    deleteInvoice: (id) => {
        const invoices = db.getInvoices();
        const filtered = invoices.filter(inv => inv.id !== id);
        db.saveInvoices(filtered);
    },

    // SETTINGS
    getSettings: () => JSON.parse(localStorage.getItem(KEYS.SETTINGS)) || DEFAULT_SETTINGS,
    saveSettings: (settings) => localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings)),

    // UTILITIES
    exportBackup: () => {
        const backupData = {
            settings: db.getSettings(),
            products: db.getProducts(),
            customers: db.getCustomers(),
            invoices: db.getInvoices(),
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
    importBackup: (jsonContent) => {
        try {
            const data = JSON.parse(jsonContent);
            if (data.settings && data.products && data.customers && data.invoices) {
                localStorage.setItem(KEYS.SETTINGS, JSON.stringify(data.settings));
                localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(data.products));
                localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(data.customers));
                localStorage.setItem(KEYS.INVOICES, JSON.stringify(data.invoices));
                return { success: true };
            }
            return { success: false, message: "Invalid backup file structure." };
        } catch (e) {
            return { success: false, message: e.message };
        }
    },
    resetDatabase: () => {
        localStorage.clear();
        initializeDB();
    }
};

// Run immediately to prepare database
initializeDB();
window.db = db; // Make global for other modules to import/access
