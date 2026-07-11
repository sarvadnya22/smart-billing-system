// invoices.js - Historical Invoices Ledger, Filters and Print/PDF Exporter

const invoices = {
    selectedInvoice: null,

    // Render historical invoices table with filters (Asynchronous)
    render: async () => {
        const list = await db.getInvoices();
        const settings = await db.getSettings();
        const searchVal = document.getElementById('invoice-search').value.toLowerCase().trim();
        const dateFrom = document.getElementById('filter-date-from').value;
        const dateTo = document.getElementById('filter-date-to').value;
        const statusVal = document.getElementById('filter-status').value;
        
        const tbody = document.getElementById('invoice-table-body');
        tbody.innerHTML = '';

        // Apply filters
        const filtered = list.filter(inv => {
            // Search filter (Invoice ID or Customer Name)
            const matchesSearch = inv.id.toLowerCase().includes(searchVal) || 
                                 (inv.customer.name && inv.customer.name.toLowerCase().includes(searchVal)) ||
                                 (inv.customer.phone && inv.customer.phone.includes(searchVal));
            
            // Status filter
            const matchesStatus = !statusVal || inv.status === statusVal;

            // Date Range filter (inv.date is "YYYY-MM-DD HH:MM")
            const invDateOnly = inv.date.split(' ')[0];
            const matchesDateFrom = !dateFrom || invDateOnly >= dateFrom;
            const matchesDateTo = !dateTo || invDateOnly <= dateTo;

            return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 30px;">No invoices found matching current filters.</td></tr>`;
            return;
        }

        filtered.forEach(inv => {
            let statusBadge = '';
            if (inv.status === 'Paid') statusBadge = '<span class="badge success">Paid</span>';
            else if (inv.status === 'Pending') statusBadge = '<span class="badge warning">Pending</span>';
            else if (inv.status === 'Cancelled') statusBadge = '<span class="badge danger">Cancelled</span>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${inv.id}</strong></td>
                <td>${inv.date}</td>
                <td>
                    <div style="font-weight: 500;">${inv.customer.name}</div>
                    ${inv.customer.phone ? `<div style="font-size:11px; color:var(--text-secondary);"><i class="fa-solid fa-phone" style="font-size:10px;"></i> ${inv.customer.phone}</div>` : ''}
                </td>
                <td>${settings.currency}${inv.subtotal.toFixed(2)}</td>
                <td>${settings.currency}${inv.taxTotal.toFixed(2)}</td>
                <td style="font-weight: 600;">${settings.currency}${inv.grandTotal.toFixed(2)}</td>
                <td><span style="font-size: 12px; font-weight:500;"><i class="fa-solid fa-credit-card" style="font-size:11px; margin-right:4px;"></i>${inv.paymentMode}</span></td>
                <td>${statusBadge}</td>
                <td style="text-align: center;">
                    <div class="action-buttons" style="justify-content: center;">
                        <button class="action-btn" onclick="invoices.openInvoiceModal('${inv.id}')" title="View details & Print"><i class="fa-regular fa-file-lines" style="color: var(--accent-primary);"></i></button>
                        <button class="action-btn" onclick="invoices.openStatusModal('${inv.id}', '${inv.status}')" title="Change Payment Status"><i class="fa-solid fa-arrow-rotate-left" style="color: var(--accent-warning);"></i></button>
                        <button class="action-btn delete" onclick="invoices.deleteInvoiceItem('${inv.id}')" title="Delete record"><i class="fa-regular fa-trash-can"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    // Populate Detailed Invoice Modal and open it (Asynchronous)
    openInvoiceModal: async (id) => {
        const list = await db.getInvoices();
        const inv = list.find(i => i.id === id);
        if (!inv) return;

        invoices.selectedInvoice = inv;
        const settings = await db.getSettings();
        const contentBox = document.getElementById('invoice-modal-content');

        let rowsHTML = '';
        inv.items.forEach((item, index) => {
            rowsHTML += `
                <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding: 10px 0;">
                        <div style="font-weight:500;">${item.name}</div>
                    </td>
                    <td style="padding: 10px 0;">₹${item.price.toFixed(2)}</td>
                    <td style="padding: 10px 0; text-align: center;">${item.qty}</td>
                    <td style="padding: 10px 0; text-align: center;">${item.discountPercent}%</td>
                    <td style="padding: 10px 0; text-align: center;">${item.taxRate}%</td>
                    <td style="padding: 10px 0; text-align: right; font-weight:500;">₹${item.total.toFixed(2)}</td>
                </tr>
            `;
        });

        contentBox.innerHTML = `
            <div id="invoice-modal-print-area" style="padding: 10px; color: var(--text-primary);">
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:16px; margin-bottom:16px;">
                    <div>
                        <h2 style="font-weight:700; color:white; font-size:22px;">${settings.storeName}</h2>
                        <p style="font-size:13px; color:var(--text-secondary); max-width:260px; margin-top:4px;">${settings.address}</p>
                        <p style="font-size:12px; color:var(--text-secondary); margin-top:2px;">Phone: ${settings.phone}</p>
                        ${settings.gstin ? `<p style="font-size:12px; color:var(--text-secondary);">Store GSTIN: ${settings.gstin}</p>` : ''}
                    </div>
                    <div style="text-align:right;">
                        <h3 style="color:var(--accent-primary); font-weight:700; font-size:20px; text-transform:uppercase;">INVOICE</h3>
                        <p style="font-size:14px; font-weight:500; margin-top:6px; color:white;">Bill No: ${inv.id}</p>
                        <p style="font-size:12px; color:var(--text-secondary); margin-top:2px;">Date: ${inv.date}</p>
                        <p style="font-size:12px; color:var(--text-secondary);">Method: ${inv.paymentMode}</p>
                    </div>
                </div>

                <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:8px; padding:12px 16px; margin-bottom:20px; display:flex; justify-content:space-between;">
                    <div>
                        <span style="font-size:11px; color:var(--text-muted); font-weight:600; text-transform:uppercase; block; margin-bottom:4px;">Billed To</span>
                        <div style="font-weight:600; color:white;">${inv.customer.name}</div>
                        ${inv.customer.phone ? `<div style="font-size:13px; color:var(--text-secondary); margin-top:2px;">Ph: ${inv.customer.phone}</div>` : ''}
                        ${inv.customer.email ? `<div style="font-size:13px; color:var(--text-secondary);">Email: ${inv.customer.email}</div>` : ''}
                    </div>
                    ${inv.customer.gstin ? `
                    <div style="text-align:right;">
                        <span style="font-size:11px; color:var(--text-muted); font-weight:600; text-transform:uppercase; block; margin-bottom:4px;">GSTIN</span>
                        <div style="font-family:monospace; color:white;">${inv.customer.gstin}</div>
                    </div>` : ''}
                </div>

                <table style="width:100%; border-collapse:collapse; text-align:left; margin-bottom:20px; font-size:14px;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--border-color); color:var(--text-secondary); font-weight:600; font-size:12px; text-transform:uppercase;">
                            <th style="padding-bottom:10px;">Item Details</th>
                            <th style="padding-bottom:10px;">Rate</th>
                            <th style="padding-bottom:10px; text-align:center;">Qty</th>
                            <th style="padding-bottom:10px; text-align:center;">Disc</th>
                            <th style="padding-bottom:10px; text-align:center;">Tax</th>
                            <th style="padding-bottom:10px; text-align:right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHTML}
                    </tbody>
                </table>

                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="max-width:300px;">
                        ${inv.remarks ? `<p style="font-size:12px; color:var(--text-secondary);"><strong>Note:</strong> ${inv.remarks}</p>` : ''}
                    </div>
                    <div style="width:240px; display:flex; flex-direction:column; gap:8px; font-size:14px;">
                        <div style="display:flex; justify-content:space-between;">
                            <span style="color:var(--text-secondary);">Sub Total:</span>
                            <span style="font-weight:500;">₹${inv.subtotal.toFixed(2)}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span style="color:var(--text-secondary);">Discount Savings:</span>
                            <span style="color:var(--accent-success); font-weight:500;">- ₹${inv.discountTotal.toFixed(2)}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span style="color:var(--text-secondary);">Tax Total:</span>
                            <span style="font-weight:500;">+ ₹${inv.taxTotal.toFixed(2)}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; border-top:1px dashed var(--border-color); padding-top:8px; font-size:18px; font-weight:700; color:white;">
                            <span>Grand Total:</span>
                            <span>₹${inv.grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('invoice-modal').classList.add('active');
    },

    // Trigger standard browser window print on selected invoice
    printSelectedInvoice: async () => {
        if (invoices.selectedInvoice) {
            await billing.triggerInvoicePrint(invoices.selectedInvoice);
        }
    },

    // Export selected invoice to PDF
    exportToPDF: () => {
        const inv = invoices.selectedInvoice;
        if (!inv) return;

        app.showToast("Preparing PDF download...", "warning");

        const element = document.getElementById('invoice-modal-print-area');
        
        // Add temporary PDF layout class to override theme colors
        element.classList.add('pdf-render-mode');

        const options = {
            margin:       [10, 10, 10, 10],
            filename:     `invoice_${inv.id}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, backgroundColor: '#ffffff' }, // Always white background for PDF
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(options).from(element).save().then(() => {
            element.classList.remove('pdf-render-mode');
            app.showToast("PDF Invoice downloaded successfully!", "success");
        }).catch(err => {
            element.classList.remove('pdf-render-mode');
            app.showToast("Error generating PDF: " + err.message, "error");
        });
    },

    // Open Change Status Modal
    openStatusModal: (id, currentStatus) => {
        document.getElementById('status-inv-id').value = id;
        document.getElementById('status-select').value = currentStatus;
        document.getElementById('status-modal').classList.add('active');
    },

    // Save payment status change (Asynchronous)
    saveStatusChange: async () => {
        const id = document.getElementById('status-inv-id').value;
        const newStatus = document.getElementById('status-select').value;

        await db.updateInvoiceStatus(id, newStatus);
        app.showToast(`Invoice ${id} updated to ${newStatus}`, "success");
        
        document.getElementById('status-modal').classList.remove('active');
        await invoices.render();
    },

    // Delete Invoice Record (Asynchronous)
    deleteInvoiceItem: async (id) => {
        if (confirm(`CAUTION: Are you sure you want to permanently delete Invoice ${id}? This cannot be undone.`)) {
            await db.deleteInvoice(id);
            app.showToast(`Invoice ${id} deleted`, "warning");
            await invoices.render();
        }
    },

    // Clear filters and reset list
    resetFilters: () => {
        document.getElementById('invoice-search').value = '';
        document.getElementById('filter-date-from').value = '';
        document.getElementById('filter-date-to').value = '';
        document.getElementById('filter-status').value = '';
        invoices.render();
    },

    // Initialize module event listeners
    init: () => {
        document.getElementById('invoice-search').addEventListener('input', () => invoices.render());
        document.getElementById('filter-date-from').addEventListener('change', () => invoices.render());
        document.getElementById('filter-date-to').addEventListener('change', () => invoices.render());
        document.getElementById('filter-status').addEventListener('change', () => invoices.render());
        document.getElementById('invoices-reset-filters').addEventListener('click', invoices.resetFilters);

        // Modal triggers close
        document.getElementById('invoice-modal-close').addEventListener('click', () => {
            document.getElementById('invoice-modal').classList.remove('active');
        });
        document.getElementById('invoice-modal-close-btn').addEventListener('click', () => {
            document.getElementById('invoice-modal').classList.remove('active');
        });
        
        // Print & PDF hooks
        document.getElementById('invoice-modal-print-btn').addEventListener('click', () => invoices.printSelectedInvoice());
        document.getElementById('invoice-modal-pdf-btn').addEventListener('click', invoices.exportToPDF);

        // Status Modal close
        document.getElementById('status-modal-close').addEventListener('click', () => {
            document.getElementById('status-modal').classList.remove('active');
        });
        document.getElementById('status-modal-cancel').addEventListener('click', () => {
            document.getElementById('status-modal').classList.remove('active');
        });
        document.getElementById('status-modal-save').addEventListener('click', () => invoices.saveStatusChange());
    }
};

// Start
document.addEventListener('DOMContentLoaded', () => {
    invoices.init();
});

window.invoices = invoices;
