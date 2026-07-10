// inventory.js - Products Catalog and Stock Management CRUD Controller

const inventory = {
    // Render and refresh table contents (Asynchronous)
    render: async () => {
        const products = await db.getProducts();
        const searchQuery = document.getElementById('product-search').value.toLowerCase().trim();
        const tbody = document.getElementById('product-table-body');
        const settings = await db.getSettings();
        tbody.innerHTML = '';

        // Filter based on search criteria
        const filtered = products.filter(p => 
            p.name.toLowerCase().includes(searchQuery) || 
            p.code.toLowerCase().includes(searchQuery) || 
            (p.category && p.category.toLowerCase().includes(searchQuery))
        );

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 30px;">No products found matching your search.</td></tr>`;
            return;
        }

        filtered.forEach(p => {
            let stockBadge = `<span style="font-weight:600;">${p.stock}</span>`;
            if (p.stock === 0) {
                stockBadge = `<span class="badge danger">Out of Stock</span>`;
            } else if (p.stock <= 5) {
                stockBadge = `<span class="badge warning">${p.stock} Low Stock</span>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${p.code}</strong></td>
                <td>${p.name}</td>
                <td><span style="background: rgba(255,255,255,0.03); padding: 4px 8px; border-radius: 4px; font-size:12px;">${p.category || 'General'}</span></td>
                <td style="font-weight: 500;">${settings.currency}${p.price.toFixed(2)}</td>
                <td style="color: var(--text-muted);">${settings.currency}${p.cost.toFixed(2)}</td>
                <td>${p.taxRate}%</td>
                <td>${stockBadge}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="inventory.openEditModal('${p.id}')" title="Edit Product"><i class="fa-regular fa-pen-to-square"></i></button>
                        <button class="action-btn delete" onclick="inventory.deleteItem('${p.id}')" title="Delete Product"><i class="fa-regular fa-trash-can"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    // Open Modal in Create mode
    openAddModal: async () => {
        document.getElementById('product-modal-title').textContent = "Add New Product";
        document.getElementById('prod-id').value = '';
        document.getElementById('product-form').reset();
        
        // Auto-generate some code
        const products = await db.getProducts();
        const nextCodeNum = products.length + 1;
        document.getElementById('prod-code').value = `PROD` + nextCodeNum.toString().padStart(3, '0');
        
        document.getElementById('product-modal').classList.add('active');
    },

    // Open Modal in Edit mode
    openEditModal: async (id) => {
        const products = await db.getProducts();
        const product = products.find(p => p.id === id);

        if (!product) return;

        document.getElementById('product-modal-title').textContent = "Edit Product Details";
        document.getElementById('prod-id').value = product.id;
        document.getElementById('prod-code').value = product.code;
        document.getElementById('prod-name').value = product.name;
        document.getElementById('prod-category').value = product.category || '';
        document.getElementById('prod-price').value = product.price;
        document.getElementById('prod-cost').value = product.cost;
        document.getElementById('prod-tax').value = product.taxRate;
        document.getElementById('prod-stock').value = product.stock;

        document.getElementById('product-modal').classList.add('active');
    },

    // Save item details (Submit form)
    saveProduct: async (e) => {
        e.preventDefault();

        const id = document.getElementById('prod-id').value;
        const code = document.getElementById('prod-code').value.trim();
        const name = document.getElementById('prod-name').value.trim();
        const category = document.getElementById('prod-category').value.trim();
        const price = parseFloat(document.getElementById('prod-price').value) || 0;
        const cost = parseFloat(document.getElementById('prod-cost').value) || 0;
        const taxRate = parseInt(document.getElementById('prod-tax').value) || 0;
        const stock = parseInt(document.getElementById('prod-stock').value) || 0;

        const productData = { code, name, category, price, cost, taxRate, stock };

        if (id) {
            // Update mode
            productData.id = id;
            await db.updateProduct(productData);
            app.showToast("Product details updated successfully!", "success");
        } else {
            // Create mode
            await db.addProduct(productData);
            app.showToast("New product cataloged successfully!", "success");
        }

        document.getElementById('product-modal').classList.remove('active');
        await inventory.render();
    },

    // Delete item
    deleteItem: async (id) => {
        if (confirm("Are you sure you want to delete this product? All transaction history logs remain but product list will update.")) {
            await db.deleteProduct(id);
            app.showToast("Product deleted successfully", "warning");
            await inventory.render();
        }
    },

    // Setup module event bindings
    init: () => {
        document.getElementById('product-search').addEventListener('input', () => inventory.render());
        document.getElementById('add-product-btn').addEventListener('click', () => inventory.openAddModal());
        
        // Modal close hooks
        document.getElementById('product-modal-close').addEventListener('click', () => {
            document.getElementById('product-modal').classList.remove('active');
        });
        document.getElementById('product-modal-cancel').addEventListener('click', () => {
            document.getElementById('product-modal').classList.remove('active');
        });
        
        // Form submit
        document.getElementById('product-form').addEventListener('submit', (e) => inventory.saveProduct(e));
    }
};

// Initialize once
document.addEventListener('DOMContentLoaded', () => {
    inventory.init();
});

window.inventory = inventory;
