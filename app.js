// app.js - Core Application Router, State Manager and Auth Bypass

const app = {
    currentTab: 'dashboard',
    isAuthenticated: false,

    // Initialize application (Asynchronous)
    init: async () => {
        // 1. Check connection status with SQL Server
        await db.checkConnection();
        app.updateConnectionBadge();
        
        // 2. Load configurations and events
        await app.checkAuthRequirement();
        app.setupEventListeners();
        await app.updateProfileDisplay();
        
        // 3. Initial tab load
        await app.switchTab(app.currentTab);
    },

    // Handle Authentication Check
    checkAuthRequirement: async () => {
        const settings = await db.getSettings();
        const authScreen = document.getElementById('auth-screen');
        const logoutBtn = document.getElementById('header-logout-btn');
        
        // Update auth title
        document.getElementById('auth-store-title').textContent = settings.storeName;

        if (settings.authEnabled && !app.isAuthenticated) {
            authScreen.style.display = 'flex';
            logoutBtn.style.display = 'none';
        } else {
            authScreen.style.display = 'none';
            if (settings.authEnabled) {
                logoutBtn.style.display = 'flex';
            } else {
                logoutBtn.style.display = 'none';
            }
        }
    },

    // Update connection status badge in sidebar
    updateConnectionBadge: () => {
        const badge = document.getElementById('db-status-badge');
        if (!badge) return;

        if (db.isServerOnline) {
            badge.className = 'db-status success';
            badge.innerHTML = `<span class="status-dot"></span> SQL Server Connected`;
        } else {
            badge.className = 'db-status warning';
            badge.innerHTML = `<span class="status-dot"></span> Offline (Local DB)`;
        }
    },

    // Attempt Login
    login: async (passcode) => {
        const settings = await db.getSettings();
        if (passcode === settings.passcode) {
            app.isAuthenticated = true;
            app.showToast("System unlocked successfully!", "success");
            await app.checkAuthRequirement();
            await app.switchTab('dashboard');
        } else {
            app.showToast("Incorrect passcode! Try again.", "error");
        }
    },

    // Bypass Authentication (Emergency Guest Access)
    bypassAuth: async () => {
        app.isAuthenticated = true;
        app.showToast("Access granted via Bypass mode", "warning");
        await app.checkAuthRequirement();
        await app.switchTab('dashboard');
    },

    // Log out / Lock screen
    logout: async () => {
        app.isAuthenticated = false;
        app.showToast("System locked", "warning");
        await app.checkAuthRequirement();
    },

    // Setup global navigation and action listeners
    setupEventListeners: () => {
        // Tab Navigation click handlers
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = item.getAttribute('data-tab');
                app.switchTab(tab);
            });
        });

        // Login inputs
        document.getElementById('auth-login-btn').addEventListener('click', () => {
            const passcode = document.getElementById('auth-passcode').value;
            app.login(passcode);
            document.getElementById('auth-passcode').value = '';
        });

        document.getElementById('auth-passcode').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const passcode = e.target.value;
                app.login(passcode);
                e.target.value = '';
            }
        });

        // Security bypass trigger
        document.getElementById('auth-bypass-btn').addEventListener('click', () => {
            app.bypassAuth();
        });

        // Header buttons
        document.getElementById('header-new-sale-btn').addEventListener('click', () => {
            app.switchTab('billing');
            if (window.billing) {
                billing.clearCart();
            }
        });

        document.getElementById('header-logout-btn').addEventListener('click', () => {
            app.logout();
        });
    },

    // Switch between page views
    switchTab: async (tabId) => {
        // Verify login check
        const settings = await db.getSettings();
        if (settings.authEnabled && !app.isAuthenticated) {
            await app.checkAuthRequirement();
            return;
        }

        app.currentTab = tabId;

        // Hide all tabs
        const tabs = document.querySelectorAll('.tab-content');
        tabs.forEach(tab => tab.classList.remove('active'));

        // Remove active class from nav
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));

        // Show selected tab
        const activeTab = document.getElementById(`${tabId}-tab`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Add active class to selected nav item
        const activeNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }

        // Update titles
        const titles = {
            dashboard: { title: "Dashboard Overview", subtitle: "Real-time store analysis and health indicators." },
            billing: { title: "POS Billing Terminal", subtitle: "Create and process customer bills instantly." },
            inventory: { title: "Inventory Database", subtitle: "Manage stock quantities, categories, and unit price details." },
            customers: { title: "Customer Ledger CRM", subtitle: "Track phone contacts, email lists, and profiles." },
            invoices: { title: "Invoices & Receipts Ledger", subtitle: "Audit historical invoices, print copies, and filter date records." },
            settings: { title: "System Configuration", subtitle: "Customize receipt layouts, set code locks, and backup local database." }
        };

        if (titles[tabId]) {
            document.getElementById('view-title').textContent = titles[tabId].title;
            document.getElementById('view-subtitle').textContent = titles[tabId].subtitle;
        }

        // Load modules dynamically
        switch (tabId) {
            case 'dashboard':
                if (window.dashboard) dashboard.init();
                break;
            case 'billing':
                if (window.billing) billing.init();
                break;
            case 'inventory':
                if (window.inventory) inventory.render();
                break;
            case 'customers':
                if (window.customers) customers.render();
                break;
            case 'invoices':
                if (window.invoices) invoices.render();
                break;
            case 'settings':
                if (window.settings) settings.init();
                break;
        }
    },

    // Refresh profile widgets
    updateProfileDisplay: async () => {
        const settings = await db.getSettings();
        document.getElementById('profile-store-name').textContent = settings.storeName;
    },

    // Global Toast Notification Helper
    showToast: (message, type = "success") => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = "fa-circle-check";
        if (type === "error") icon = "fa-circle-xmark";
        if (type === "warning") icon = "fa-triangle-exclamation";

        toast.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);

        // Slide out and remove after 3.5 seconds
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3500);
    }
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

window.app = app;
