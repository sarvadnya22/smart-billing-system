// settings.js - Store Profile Config Controller

const settingsModule = {
    // Initialize form fields with DB data (Asynchronous)
    init: async () => {
        const settings = await db.getSettings();

        // Populate store profile form details
        document.getElementById('set-store-name').value = settings.storeName;
        document.getElementById('set-store-address').value = settings.address;
        document.getElementById('set-store-phone').value = settings.phone;
        document.getElementById('set-store-email').value = settings.email;
        document.getElementById('set-store-gst').value = settings.gstin || '';
        document.getElementById('set-store-currency').value = settings.currency;
        document.getElementById('set-store-terms').value = settings.terms;

        settingsModule.setupEventListeners();
    },

    // Setup interactive handlers
    setupEventListeners: () => {
        // Form submits: Store Profile
        document.getElementById('settings-store-form').onsubmit = async (e) => {
            e.preventDefault();
            await settingsModule.saveStoreDetails();
        };
    },

    // Save profile metadata
    saveStoreDetails: async () => {
        const settings = await db.getSettings();
        
        settings.storeName = document.getElementById('set-store-name').value.trim();
        settings.address = document.getElementById('set-store-address').value.trim();
        settings.phone = document.getElementById('set-store-phone').value.trim();
        settings.email = document.getElementById('set-store-email').value.trim();
        settings.gstin = document.getElementById('set-store-gst').value.trim();
        settings.currency = document.getElementById('set-store-currency').value.trim();
        settings.terms = document.getElementById('set-store-terms').value.trim();

        await db.saveSettings(settings);
        await app.updateProfileDisplay();
        app.showToast("Store profile saved!", "success");
    }
};

window.settings = settingsModule;
