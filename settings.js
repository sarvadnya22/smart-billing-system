// settings.js - Store Profile Config, Passcode Lock and DB Backup Controller

const settingsModule = {
    // Initialize form fields with DB data
    init: () => {
        const settings = db.getSettings();

        // 1. Populate store profile form details
        document.getElementById('set-store-name').value = settings.storeName;
        document.getElementById('set-store-address').value = settings.address;
        document.getElementById('set-store-phone').value = settings.phone;
        document.getElementById('set-store-email').value = settings.email;
        document.getElementById('set-store-gst').value = settings.gstin || '';
        document.getElementById('set-store-currency').value = settings.currency;
        document.getElementById('set-store-terms').value = settings.terms;

        // 2. Populate security check state
        const authCheckbox = document.getElementById('set-auth-enabled');
        const passcodeGroup = document.getElementById('set-passcode-group');
        
        authCheckbox.checked = settings.authEnabled;
        passcodeGroup.style.display = settings.authEnabled ? 'block' : 'none';
        document.getElementById('set-store-passcode').value = settings.passcode || '';

        settingsModule.setupEventListeners();
    },

    // Setup interactive handlers
    setupEventListeners: () => {
        // Toggle passcode input display dynamically
        const authCheckbox = document.getElementById('set-auth-enabled');
        const passcodeGroup = document.getElementById('set-passcode-group');
        authCheckbox.onchange = (e) => {
            passcodeGroup.style.display = e.target.checked ? 'block' : 'none';
        };

        // Form submits: Store Profile
        document.getElementById('settings-store-form').onsubmit = (e) => {
            e.preventDefault();
            settingsModule.saveStoreDetails();
        };

        // Button action: Save passcode lock
        document.getElementById('save-security-btn').onclick = (e) => {
            e.preventDefault();
            settingsModule.saveSecurityDetails();
        };

        // Database backups: Export JSON
        document.getElementById('db-export-btn').onclick = () => {
            db.exportBackup();
            app.showToast("Database backup downloaded!", "success");
        };

        // Database backups: Trigger Import file input click
        const fileInput = document.getElementById('db-import-file');
        document.getElementById('db-trigger-import-btn').onclick = () => {
            fileInput.click();
        };

        // File input change handler for restoration
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (evt) => {
                const result = db.importBackup(evt.target.result);
                if (result.success) {
                    app.showToast("Database restored successfully! Reloading...", "success");
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    app.showToast("Restoration failed: " + result.message, "error");
                }
            };
            reader.readAsText(file);
        };

        // Database backups: Reset database confirm triggers
        document.getElementById('db-reset-btn').onclick = () => {
            if (confirm("WARNING: This will delete ALL transactions, products, and custom settings, and seed default mock items. Proceed?")) {
                db.resetDatabase();
                app.showToast("Database reset successfully! Reloading...", "success");
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        };
    },

    // Save profile metadata
    saveStoreDetails: () => {
        const settings = db.getSettings();
        
        settings.storeName = document.getElementById('set-store-name').value.trim();
        settings.address = document.getElementById('set-store-address').value.trim();
        settings.phone = document.getElementById('set-store-phone').value.trim();
        settings.email = document.getElementById('set-store-email').value.trim();
        settings.gstin = document.getElementById('set-store-gst').value.trim();
        settings.currency = document.getElementById('set-store-currency').value.trim();
        settings.terms = document.getElementById('set-store-terms').value.trim();

        db.saveSettings(settings);
        app.updateProfileDisplay();
        app.showToast("Store profile saved!", "success");
    },

    // Save passcode protection settings
    saveSecurityDetails: () => {
        const settings = db.getSettings();
        const enabled = document.getElementById('set-auth-enabled').checked;
        const passcode = document.getElementById('set-store-passcode').value.trim();

        if (enabled && passcode.length < 4) {
            app.showToast("Passcode must be at least 4 digits!", "error");
            return;
        }

        settings.authEnabled = enabled;
        settings.passcode = passcode;

        db.saveSettings(settings);
        app.checkAuthRequirement();
        app.showToast("Security configuration saved!", "success");
    }
};

window.settings = settingsModule;
