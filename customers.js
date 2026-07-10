// customers.js - CRM Customer Ledger Directory Controller

const customers = {
    // Render and refresh customer table
    render: () => {
        const list = db.getCustomers();
        const searchQuery = document.getElementById('customer-search').value.toLowerCase().trim();
        const tbody = document.getElementById('customer-table-body');
        tbody.innerHTML = '';

        // Filter based on search criteria
        const filtered = list.filter(c => 
            c.name.toLowerCase().includes(searchQuery) || 
            c.phone.includes(searchQuery) || 
            (c.email && c.email.toLowerCase().includes(searchQuery))
        );

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">No customers found matching search criteria.</td></tr>`;
            return;
        }

        filtered.forEach(c => {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${c.name}</strong></td>
                    <td><i class="fa-solid fa-phone" style="font-size:12px; color:var(--text-secondary); margin-right:4px;"></i> ${c.phone}</td>
                    <td>${c.email || '<span style="color:var(--text-muted); font-style:italic;">N/A</span>'}</td>
                    <td>${c.address || '<span style="color:var(--text-muted); font-style:italic;">N/A</span>'}</td>
                    <td><span style="font-family:monospace; font-size:13px;">${c.gstin || '—'}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn edit" onclick="customers.openEditModal('${c.id}')" title="Edit Profile"><i class="fa-regular fa-pen-to-square"></i></button>
                            <button class="action-btn delete" onclick="customers.deleteItem('${c.id}')" title="Delete Profile"><i class="fa-regular fa-trash-can"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        });
    },

    // Open Modal in Create mode
    openAddModal: () => {
        document.getElementById('customer-modal-title').textContent = "Add New Customer Profile";
        document.getElementById('cust-id').value = '';
        document.getElementById('customer-form').reset();
        document.getElementById('customer-modal').classList.add('active');
    },

    // Open Modal in Edit mode
    openEditModal: (id) => {
        const list = db.getCustomers();
        const cust = list.find(c => c.id === id);

        if (!cust) return;

        document.getElementById('customer-modal-title').textContent = "Edit Customer Profile";
        document.getElementById('cust-id').value = cust.id;
        document.getElementById('cust-name').value = cust.name;
        document.getElementById('cust-phone').value = cust.phone;
        document.getElementById('cust-email').value = cust.email || '';
        document.getElementById('cust-address').value = cust.address || '';
        document.getElementById('cust-gst').value = cust.gstin || '';

        document.getElementById('customer-modal').classList.add('active');
    },

    // Save profile details (Submit form)
    saveCustomer: (e) => {
        e.preventDefault();

        const id = document.getElementById('cust-id').value;
        const name = document.getElementById('cust-name').value.trim();
        const phone = document.getElementById('cust-phone').value.trim();
        const email = document.getElementById('cust-email').value.trim();
        const address = document.getElementById('cust-address').value.trim();
        const gstin = document.getElementById('cust-gst').value.trim();

        // Simple validation check for phone
        if (phone.length < 8) {
            app.showToast("Please enter a valid phone number", "error");
            return;
        }

        const customerData = { name, phone, email, address, gstin };

        if (id) {
            // Update
            customerData.id = id;
            db.updateCustomer(customerData);
            app.showToast("Customer profile updated!", "success");
        } else {
            // Create
            db.addCustomer(customerData);
            app.showToast("Customer profile created!", "success");
        }

        document.getElementById('customer-modal').classList.remove('active');
        customers.render();
    },

    // Delete customer
    deleteItem: (id) => {
        if (confirm("Are you sure you want to delete this customer? Invoice reports remain but CRM listings will clear.")) {
            db.deleteCustomer(id);
            app.showToast("Customer removed", "warning");
            customers.render();
        }
    },

    // Initialize listeners
    init: () => {
        document.getElementById('customer-search').addEventListener('input', customers.render);
        document.getElementById('add-customer-btn').addEventListener('click', customers.openAddModal);

        // Modal triggers
        document.getElementById('customer-modal-close').addEventListener('click', () => {
            document.getElementById('customer-modal').classList.remove('active');
        });
        document.getElementById('customer-modal-cancel').addEventListener('click', () => {
            document.getElementById('customer-modal').classList.remove('active');
        });

        // Form submit
        document.getElementById('customer-form').addEventListener('submit', customers.saveCustomer);
    }
};

// Start
document.addEventListener('DOMContentLoaded', () => {
    customers.init();
});

window.customers = customers;
