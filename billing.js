// billing.js - POS Billing Terminal and Invoice Generation Logic

const billing = {
    cart: [],
    selectedPaymentMode: 'UPI',
    customerSuggestions: [],
    productSuggestions: [],

    // Initialize BillingPOS Module
    init: () => {
        billing.setupEventListeners();
        billing.renderCart();
    },

    // Set up POS UI elements interaction listeners
    setupEventListeners: () => {
        const prodSearch = document.getElementById('billing-product-search');
        const custPhone = document.getElementById('billing-cust-phone');
        const checkoutBtn = document.getElementById('pos-checkout-btn');

        // Product search autocomplete
        prodSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            billing.suggestProducts(query);
        });

        // Close dropdowns on clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.id !== 'billing-product-search') {
                document.getElementById('billing-dropdown').style.display = 'none';
            }
            if (e.target.id !== 'billing-cust-phone') {
                document.getElementById('customer-dropdown').style.display = 'none';
            }
        });

        // Customer autocomplete suggestions
        custPhone.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            billing.suggestCustomers(query);
        });

        // Payment mode selection toggling
        const payBtns = document.querySelectorAll('.pay-mode-btn');
        payBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                payBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                billing.selectedPaymentMode = btn.getAttribute('data-mode');
            });
        });

        // Main checkout generation handler
        checkoutBtn.onclick = (e) => {
            e.preventDefault();
            billing.processCheckout();
        };
    },

    // Search and display matches in product list
    suggestProducts: (query) => {
        const dropdown = document.getElementById('billing-dropdown');
        dropdown.innerHTML = '';

        if (!query) {
            dropdown.style.display = 'none';
            return;
        }

        const products = db.getProducts();
        const matches = products.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.code.toLowerCase().includes(query) || 
            (p.category && p.category.toLowerCase().includes(query))
        );

        if (matches.length === 0) {
            dropdown.style.display = 'none';
            return;
        }

        dropdown.style.display = 'block';
        matches.slice(0, 8).forEach(prod => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.innerHTML = `
                <div>
                    <div class="autocomplete-item-name">${prod.name}</div>
                    <div class="autocomplete-item-meta">Code: ${prod.code} | Stock: ${prod.stock}</div>
                </div>
                <div style="font-weight: 600;">₹${prod.price.toFixed(2)}</div>
            `;
            item.addEventListener('click', () => {
                billing.addToCart(prod);
                dropdown.style.display = 'none';
                document.getElementById('billing-product-search').value = '';
            });
            dropdown.appendChild(item);
        });
    },

    // Suggest customer based on typed phone number
    suggestCustomers: (query) => {
        const dropdown = document.getElementById('customer-dropdown');
        dropdown.innerHTML = '';

        if (!query) {
            dropdown.style.display = 'none';
            return;
        }

        const customers = db.getCustomers();
        const matches = customers.filter(c => c.phone.includes(query) || c.name.toLowerCase().includes(query.toLowerCase()));

        if (matches.length === 0) {
            dropdown.style.display = 'none';
            return;
        }

        dropdown.style.display = 'block';
        matches.slice(0, 5).forEach(cust => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.innerHTML = `
                <div>
                    <div class="autocomplete-item-name">${cust.name}</div>
                    <div class="autocomplete-item-meta">${cust.phone}</div>
                </div>
            `;
            item.addEventListener('click', () => {
                document.getElementById('billing-cust-phone').value = cust.phone;
                document.getElementById('billing-cust-name').value = cust.name;
                document.getElementById('billing-cust-email').value = cust.email || '';
                document.getElementById('billing-cust-gst').value = cust.gstin || '';
                dropdown.style.display = 'none';
            });
            dropdown.appendChild(item);
        });
    },

    // Cart operations: Add product to cart
    addToCart: (product) => {
        const existing = billing.cart.find(item => item.id === product.id);

        if (existing) {
            if (existing.qty >= product.stock) {
                app.showToast(`Warning: Selling quantity exceeds available stock (${product.stock})`, "warning");
            }
            existing.qty++;
        } else {
            if (product.stock === 0) {
                app.showToast(`Warning: Product out of stock!`, "warning");
            }
            billing.cart.push({
                id: product.id,
                code: product.code,
                name: product.name,
                price: product.price,
                qty: 1,
                discountPercent: 0,
                taxRate: product.taxRate || 18,
                stock: product.stock
            });
        }
        billing.renderCart();
    },

    // Update quantities in item row
    updateQty: (productId, qty) => {
        const item = billing.cart.find(i => i.id === productId);
        if (item) {
            const count = parseInt(qty) || 0;
            if (count > item.stock) {
                app.showToast(`Selected quantity (${count}) exceeds stock (${item.stock})!`, "warning");
            }
            item.qty = count;
            billing.renderCart();
        }
    },

    // Update tax parameters in row
    updateTax: (productId, taxRate) => {
        const item = billing.cart.find(i => i.id === productId);
        if (item) {
            item.taxRate = parseFloat(taxRate) || 0;
            billing.renderCart();
        }
    },

    // Update discount parameter in row
    updateDiscount: (productId, discount) => {
        const item = billing.cart.find(i => i.id === productId);
        if (item) {
            item.discountPercent = parseFloat(discount) || 0;
            billing.renderCart();
        }
    },

    // Remove row from cart grid
    removeFromCart: (productId) => {
        billing.cart = billing.cart.filter(item => item.id !== productId);
        billing.renderCart();
    },

    // Clear cart entirely
    clearCart: () => {
        billing.cart = [];
        document.getElementById('billing-cust-phone').value = '';
        document.getElementById('billing-cust-name').value = '';
        document.getElementById('billing-cust-email').value = '';
        document.getElementById('billing-cust-gst').value = '';
        document.getElementById('billing-remarks').value = '';
        billing.renderCart();
    },

    // Recalculate totals and render grid elements
    renderCart: () => {
        const tbody = document.getElementById('billing-cart-body');
        const emptyCart = document.getElementById('billing-empty-cart');
        tbody.innerHTML = '';

        if (billing.cart.length === 0) {
            emptyCart.style.display = 'block';
            document.getElementById('pos-subtotal').textContent = '₹0.00';
            document.getElementById('pos-tax').textContent = '₹0.00';
            document.getElementById('pos-discount').textContent = '₹0.00';
            document.getElementById('pos-grandtotal').textContent = '₹0.00';
            return;
        }

        emptyCart.style.display = 'none';

        let subtotalAccumulator = 0;
        let taxAccumulator = 0;
        let discountAccumulator = 0;
        let grandTotalAccumulator = 0;

        billing.cart.forEach((item, index) => {
            const rawSubtotal = item.price * item.qty;
            const discountAmt = rawSubtotal * (item.discountPercent / 100);
            const taxableAmt = rawSubtotal - discountAmt;
            const taxAmt = taxableAmt * (item.taxRate / 100);
            const lineTotal = taxableAmt + taxAmt;

            subtotalAccumulator += taxableAmt;
            taxAccumulator += taxAmt;
            discountAccumulator += discountAmt;
            grandTotalAccumulator += lineTotal;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="font-weight: 500;">${item.name}</div>
                    <div style="font-size: 11px; color: var(--text-secondary);">SKU: ${item.code}</div>
                </td>
                <td style="font-weight: 500;">₹${item.price.toFixed(2)}</td>
                <td>
                    <div class="qty-control">
                        <button class="qty-btn" onclick="billing.updateQty('${item.id}', ${item.qty - 1})">-</button>
                        <input type="number" class="qty-input" value="${item.qty}" onchange="billing.updateQty('${item.id}', this.value)" min="1">
                        <button class="qty-btn" onclick="billing.updateQty('${item.id}', ${item.qty + 1})">+</button>
                    </div>
                </td>
                <td>
                    <input type="number" class="table-input" value="${item.discountPercent}" onchange="billing.updateDiscount('${item.id}', this.value)" min="0" max="100">%
                </td>
                <td>
                    <input type="number" class="table-input" value="${item.taxRate}" onchange="billing.updateTax('${item.id}', this.value)" min="0" max="100">%
                </td>
                <td style="font-weight: 600;">₹${lineTotal.toFixed(2)}</td>
                <td>
                    <button class="remove-btn" onclick="billing.removeFromCart('${item.id}')"><i class="fa-regular fa-trash-can"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Display totals summary
        const settings = db.getSettings();
        document.getElementById('pos-subtotal').textContent = settings.currency + subtotalAccumulator.toFixed(2);
        document.getElementById('pos-tax').textContent = settings.currency + taxAccumulator.toFixed(2);
        document.getElementById('pos-discount').textContent = settings.currency + discountAccumulator.toFixed(2);
        document.getElementById('pos-grandtotal').textContent = settings.currency + grandTotalAccumulator.toFixed(2);
    },

    // Process Checkout and Save Invoice
    processCheckout: () => {
        if (billing.cart.length === 0) {
            app.showToast("Cannot generate invoice for an empty cart!", "error");
            return;
        }

        const settings = db.getSettings();
        
        // Grab Customer credentials
        const phone = document.getElementById('billing-cust-phone').value.trim();
        const name = document.getElementById('billing-cust-name').value.trim() || 'Walk-in Customer';
        const email = document.getElementById('billing-cust-email').value.trim();
        const gstin = document.getElementById('billing-cust-gst').value.trim();
        const remarks = document.getElementById('billing-remarks').value.trim();

        // 1. CRM Check: If customer has mobile number, save/update customer in DB list
        let customerObj = { id: "", name, phone, email, gstin };
        if (phone) {
            const customers = db.getCustomers();
            const existingCust = customers.find(c => c.phone === phone);
            if (existingCust) {
                existingCust.name = name;
                existingCust.email = email;
                existingCust.gstin = gstin;
                db.updateCustomer(existingCust);
                customerObj.id = existingCust.id;
            } else {
                const added = db.addCustomer({ name, phone, email, address: "", gstin });
                customerObj.id = added.id;
            }
        } else {
            customerObj.id = "walk_in";
        }

        // 2. Generate unique Bill/Invoice Number (INV-1004, etc.)
        const invoices = db.getInvoices();
        let nextNumber = 1001;
        if (invoices.length > 0) {
            // Get highest invoice number suffix
            const ids = invoices.map(inv => parseInt(inv.id.replace('INV-', '')) || 0);
            nextNumber = Math.max(...ids) + 1;
        }
        const invoiceId = `INV-${nextNumber}`;

        // 3. Compile cart items totals details
        let subtotalAccumulator = 0;
        let taxAccumulator = 0;
        let discountAccumulator = 0;
        let grandTotalAccumulator = 0;

        const finalItems = billing.cart.map(item => {
            const itemSubtotal = item.price * item.qty;
            const itemDiscount = itemSubtotal * (item.discountPercent / 100);
            const taxable = itemSubtotal - itemDiscount;
            const itemTax = taxable * (item.taxRate / 100);
            const itemTotal = taxable + itemTax;

            subtotalAccumulator += taxable;
            taxAccumulator += itemTax;
            discountAccumulator += itemDiscount;
            grandTotalAccumulator += itemTotal;

            // 4. Update inventories
            db.updateProductStock(item.id, item.qty);

            return {
                id: item.id,
                name: item.name,
                price: item.price,
                qty: item.qty,
                discountPercent: item.discountPercent,
                taxRate: item.taxRate,
                subtotal: taxable,
                tax: itemTax,
                total: itemTotal
            };
        });

        // 5. Build final invoice object
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0] + " " + today.toTimeString().split(' ')[0].slice(0, 5);

        const newInvoice = {
            id: invoiceId,
            date: formattedDate,
            customer: customerObj,
            items: finalItems,
            subtotal: subtotalAccumulator,
            taxTotal: taxAccumulator,
            discountTotal: discountAccumulator,
            grandTotal: grandTotalAccumulator,
            paymentMode: billing.selectedPaymentMode,
            status: "Paid", // POS invoice is paid on checkout by default
            remarks: remarks
        };

        // 6. Save Invoice to localStorage
        db.addInvoice(newInvoice);

        app.showToast(`Invoice ${invoiceId} generated successfully!`, "success");

        // 7. Render Printer layout structure
        billing.triggerInvoicePrint(newInvoice);

        // 8. Reset Billing POS screen
        billing.clearCart();
    },

    // Prepare html structure inside the isolated print-section and fire standard window.print()
    triggerInvoicePrint: (invoice) => {
        const settings = db.getSettings();
        const printBox = document.getElementById('print-section');
        
        let itemsRows = '';
        invoice.items.forEach((item, index) => {
            itemsRows += `
                <tr>
                    <td>${index + 1}. ${item.name}</td>
                    <td>₹${item.price.toFixed(2)}</td>
                    <td style="text-align: center;">${item.qty}</td>
                    <td style="text-align: center;">${item.discountPercent}%</td>
                    <td style="text-align: center;">${item.taxRate}%</td>
                    <td style="text-align: right;">₹${item.total.toFixed(2)}</td>
                </tr>
            `;
        });

        printBox.innerHTML = `
            <div class="print-invoice-box">
                <div class="print-header">
                    <h2>${settings.storeName}</h2>
                    <p style="font-size: 12px; margin-bottom: 2px;">${settings.address}</p>
                    <p style="font-size: 11px;">Ph: ${settings.phone} | Email: ${settings.email}</p>
                    ${settings.gstin ? `<p style="font-size: 11px;"><strong>GSTIN:</strong> ${settings.gstin}</p>` : ''}
                </div>
                
                <div class="print-info-grid">
                    <div class="print-info-col">
                        <span><strong>Billed To:</strong></span>
                        <span>Name: ${invoice.customer.name}</span>
                        ${invoice.customer.phone ? `<span>Ph: ${invoice.customer.phone}</span>` : ''}
                        ${invoice.customer.gstin ? `<span>GSTIN: ${invoice.customer.gstin}</span>` : ''}
                    </div>
                    <div class="print-info-col">
                        <span><strong>Invoice ID:</strong> ${invoice.id}</span>
                        <span><strong>Date:</strong> ${invoice.date}</span>
                        <span><strong>Status:</strong> ${invoice.status}</span>
                        <span><strong>Payment:</strong> ${invoice.paymentMode}</span>
                    </div>
                </div>
                
                <table class="print-table">
                    <thead>
                        <tr>
                            <th>Item Description</th>
                            <th>Rate</th>
                            <th style="text-align: center;">Qty</th>
                            <th style="text-align: center;">Disc</th>
                            <th style="text-align: center;">Tax</th>
                            <th style="text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRows}
                    </tbody>
                </table>
                
                <div class="print-totals">
                    <div class="print-totals-row">
                        <span>Sub Total:</span>
                        <span>₹${invoice.subtotal.toFixed(2)}</span>
                    </div>
                    <div class="print-totals-row">
                        <span>Discount Savings:</span>
                        <span>- ₹${invoice.discountTotal.toFixed(2)}</span>
                    </div>
                    <div class="print-totals-row">
                        <span>Tax Total:</span>
                        <span>+ ₹${invoice.taxTotal.toFixed(2)}</span>
                    </div>
                    <div class="print-totals-row bold">
                        <span>Grand Total:</span>
                        <span>₹${invoice.grandTotal.toFixed(2)}</span>
                    </div>
                </div>
                
                ${invoice.remarks ? `<p style="margin-top:10px; font-size:11px;"><strong>Remarks:</strong> ${invoice.remarks}</p>` : ''}
                
                <div class="print-footer">
                    <p style="margin-bottom: 6px;"><strong>Terms & Conditions</strong></p>
                    <p>${settings.terms}</p>
                    <p style="margin-top: 15px; font-weight: bold; font-size: 11px;">* Have a Great Day! Visit Again *</p>
                </div>
            </div>
        `;

        // Direct standard system browser print action triggering
        setTimeout(() => {
            window.print();
        }, 300);
    }
};

window.billing = billing;
