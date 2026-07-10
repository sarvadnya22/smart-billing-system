# ⚡ Smart Billing System (POS)

A premium, modern, responsive, and feature-rich client-side Point of Sale (POS) & Billing Web Application. It operates completely serverless, runs directly in the browser with **Zero-Config Setup**, and preserves data across sessions via `localStorage`.

---

## ✨ Features

### 1. 📊 Interactive Dashboard & Analytics
- **Summary Metrics**: Live tracking of Today's Sales Revenue, Total Invoices Generated, Active Customers database, and Low Stock Warnings.
- **Visual Charts**: Interactive **Monthly Sales Trends** (Bar chart) and **Product Category Distribution** (Doughnut chart) powered by **Chart.js**.
- **Alert logs**: Quick activity feeds for recent invoice logs and low-inventory warnings.

### 2. 🛒 High-Tech POS Billing Terminal
- **Autocomplete Product Finder**: Fast search by SKU Code, Name, or Category.
- **Flexible Cart Grid**: Dynamically adjust quantity with click controls, apply item-level discounts (%), and specify Custom Tax/GST (%) parameters.
- **Smart CRM Sync**: Inputting a registered customer number auto-populates their details. New customer details are automatically cataloged to the CRM database upon invoice generation.
- **Multi-Payment Support**: Tracks UPI, Credit/Debit Cards, and Cash transactions.

### 3. 🧾 Professional Invoice Exporter
- **Optimized Thermal Receipt Printing**: Clean `@media print` styles formatted specifically for standard thermal receipt printers.
- **PDF Download Integration**: Download high-quality A4 layout invoice copies directly using `html2pdf.js`.

### 4. 📦 Product Inventory & Customer CRM Directories
- Full CRUD (Create, Read, Update, Delete) modals to manage product stock levels, costs, prices, tax categories, and customer profiles.

### 5. 🔒 Lockout-Proof Passcode Access
- Secure store access with passcode lock protection (disabled by default, customizable in Settings).
- **Emergency Bypass (Guest Access)** to prevent password lockouts.

### 6. 💾 Database Backup & Reset Tools
- Export all custom products, customer details, and invoice logs into a single backup `.json` file.
- Restore all data instantly on any device by importing a backup JSON file.
- One-click "Reset Database" to clear configurations and reload default seed products for testing.

---

## 🎨 UI Design System & Aesthetics
- **Theme**: Futuristic Dark Glassmorphism.
- **Background**: Translucent cards (`backdrop-filter: blur(15px)`) over an indigo-emerald gradient background.
- **Fonts & Visuals**: Premium `Outfit` Google font with `Font Awesome 6` vector icons.
- **Animations**: Fluid fade-in-up animations for page changes and micro-interactive scale animations on hover.

---

## 📂 File Architecture

- `index.html` - Primary HTML shell, tabs structure, and modals wrapper.
- `style.css` - Custom styling rules, animations, and printer styling.
- `db.js` - Database wrapper for browser `localStorage` and mock seeder.
- `app.js` - App state router, login triggers, and toast alert notifications.
- `dashboard.js` - Dashboard data calculator and Chart.js settings.
- `billing.js` - POS terminal logic, auto-fill search, and invoice print template.
- `inventory.js` - Stock management CRUD logic.
- `customers.js` - CRM client ledger CRUD controller.
- `invoices.js` - Invoice log viewer, date range filters, and PDF generation.
- `settings.js` - Profile editor, backup JSON inputs/outputs, and security settings.

---

## 🚀 Getting Started (Zero Setup Needed)

Because this is a serverless frontend application, running it is extremely simple:

1. Download/Clone this repository:
   ```bash
   git clone https://github.com/sarvadnya22/smart-billing-system.git
   ```
2. Navigate to the project directory:
   ```bash
   cd "smart billing system"
   ```
3. **Double-click `index.html`** to open the app directly in your web browser. 

No terminal commands, Node.js packages (`npm install`), or local servers are required! It works 100% offline.
