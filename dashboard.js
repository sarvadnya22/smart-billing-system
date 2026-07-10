// dashboard.js - Dashboard Calculations and Chart.js Configurations

const dashboard = {
    salesChart: null,
    categoryChart: null,

    // Initialize Dashboard data and charts
    init: () => {
        dashboard.renderKPIs();
        dashboard.renderRecentTransactions();
        dashboard.renderLowStockAlerts();
        dashboard.renderCharts();
    },

    // Calculate and render Key Performance Indicators
    renderKPIs: () => {
        const invoices = db.getInvoices();
        const products = db.getProducts();
        const customers = db.getCustomers();
        const settings = db.getSettings();

        // 1. Today's Revenue (only count Paid & Pending invoices, exclude Cancelled)
        const todayStr = new Date().toISOString().split('T')[0];
        let todayRevenue = 0;
        let todayInvoiceCount = 0;

        invoices.forEach(inv => {
            // Invoice date format is "YYYY-MM-DD HH:MM"
            if (inv.date.startsWith(todayStr) && inv.status !== 'Cancelled') {
                todayRevenue += inv.grandTotal;
                todayInvoiceCount++;
            }
        });

        // 2. Low Stock Alerts (threshold: stock <= 5)
        const lowStockCount = products.filter(p => p.stock <= 5).length;

        // Render to DOM
        document.getElementById('kpi-revenue').textContent = settings.currency + todayRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('kpi-invoices').textContent = todayInvoiceCount;
        document.getElementById('kpi-lowstock').textContent = lowStockCount;
        document.getElementById('kpi-customers').textContent = customers.length;
    },

    // Render Recent 5 Invoices list
    renderRecentTransactions: () => {
        const invoices = db.getInvoices();
        const settings = db.getSettings();
        const tbody = document.getElementById('recent-invoices-body');
        tbody.innerHTML = '';

        const recents = invoices.slice(0, 5);

        if (recents.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No transactions recorded.</td></tr>`;
            return;
        }

        recents.forEach(inv => {
            let statusBadge = '';
            if (inv.status === 'Paid') statusBadge = '<span class="badge success">Paid</span>';
            else if (inv.status === 'Pending') statusBadge = '<span class="badge warning">Pending</span>';
            else if (inv.status === 'Cancelled') statusBadge = '<span class="badge danger">Cancelled</span>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${inv.id}</strong></td>
                <td>${inv.customer.name || 'Walk-in Customer'}</td>
                <td>${inv.date}</td>
                <td>${settings.currency}${inv.grandTotal.toFixed(2)}</td>
                <td>${statusBadge}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    // Render Low Stock list panel
    renderLowStockAlerts: () => {
        const products = db.getProducts();
        const tbody = document.getElementById('low-stock-body');
        tbody.innerHTML = '';

        const lowStockItems = products.filter(p => p.stock <= 5);

        if (lowStockItems.length === 0) {
            tbody.innerHTML = `<tr><td colspan="2" style="text-align: center; color: var(--accent-success); font-weight: 500;"><i class="fa-solid fa-circle-check"></i> All stocks healthy!</td></tr>`;
            return;
        }

        lowStockItems.slice(0, 5).forEach(item => {
            let stockClass = item.stock === 0 ? 'color: var(--accent-danger); font-weight: 600;' : 'color: var(--accent-warning);';
            let stockIcon = item.stock === 0 ? '<i class="fa-solid fa-battery-empty"></i>' : '<i class="fa-solid fa-battery-quarter"></i>';
            tbody.innerHTML += `
                <tr>
                    <td>${item.name} <span style="font-size:11px; color:var(--text-secondary); block;">(${item.code})</span></td>
                    <td style="${stockClass}">${stockIcon} ${item.stock} left</td>
                </tr>
            `;
        });
    },

    // Render Charts
    renderCharts: () => {
        const invoices = db.getInvoices();
        const products = db.getProducts();

        // Destroy existing chart instances to avoid redraw bugs
        if (dashboard.salesChart) dashboard.salesChart.destroy();
        if (dashboard.categoryChart) dashboard.categoryChart.destroy();

        // 1. Process Monthly Sales for the last 6 months
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const salesData = new Array(6).fill(0);
        const chartLabels = [];

        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            chartLabels.push(monthNames[d.getMonth()] + " " + d.getFullYear().toString().slice(-2));
        }

        // Sum sales per month bin
        invoices.forEach(inv => {
            if (inv.status === 'Cancelled') return;
            // Invoice date format "YYYY-MM-DD HH:MM"
            const invDate = new Date(inv.date.replace(' ', 'T') + ':00'); // Convert to ISO parseable
            for (let i = 5; i >= 0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                if (invDate.getMonth() === d.getMonth() && invDate.getFullYear() === d.getFullYear()) {
                    salesData[5 - i] += inv.grandTotal;
                }
            }
        });

        // 2. Process Categories distribution
        const categories = {};
        products.forEach(p => {
            const cat = p.category || "General";
            categories[cat] = (categories[cat] || 0) + 1;
        });

        const categoryLabels = Object.keys(categories);
        const categoryCounts = Object.values(categories);

        // Chart Styling Options for Glassmorphic dark theme
        const gridColor = 'rgba(255, 255, 255, 0.05)';
        const textColor = '#94a3b8';

        // Render Sales Trends Bar Chart
        const salesCtx = document.getElementById('salesTrendsChart').getContext('2d');
        dashboard.salesChart = new Chart(salesCtx, {
            type: 'bar',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Monthly Sales Revenue',
                    data: salesData,
                    backgroundColor: 'rgba(99, 102, 241, 0.45)',
                    borderColor: '#6366f1',
                    borderWidth: 2,
                    borderRadius: 6,
                    hoverBackgroundColor: 'rgba(99, 102, 241, 0.7)',
                    hoverBorderColor: '#6366f1',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: {
                            color: textColor,
                            callback: function(value) {
                                const settings = db.getSettings();
                                return settings.currency + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });

        // Render Category Doughnut Chart
        const catCtx = document.getElementById('categoryDistributionChart').getContext('2d');
        
        // Color palette for category slices
        const chartColors = [
            'rgba(99, 102, 241, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(239, 68, 68, 0.7)',
            'rgba(167, 139, 250, 0.7)',
            'rgba(6, 182, 212, 0.7)'
        ];

        dashboard.categoryChart = new Chart(catCtx, {
            type: 'doughnut',
            data: {
                labels: categoryLabels.length > 0 ? categoryLabels : ['No Products'],
                datasets: [{
                    data: categoryCounts.length > 0 ? categoryCounts : [1],
                    backgroundColor: chartColors.slice(0, Math.max(1, categoryLabels.length)),
                    borderColor: 'rgba(15, 22, 36, 0.8)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: textColor,
                            boxWidth: 12,
                            font: { size: 12 }
                        }
                    }
                },
                cutout: '65%'
            }
        });
    }
};

window.dashboard = dashboard;
