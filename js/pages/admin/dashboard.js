import { initAdminLayout } from '../../components/admin-layout.js';
import { api } from '../../utils/api.js';
import { formatPrice, formatDate } from '../../utils/helpers.js';
import { showToast } from '../../components/toast.js';

let cachedMonthsData = [];

document.addEventListener('DOMContentLoaded', async () => {
    initAdminLayout();
    await loadDashboardData();

    // Re-draw charts when window resizes
    window.addEventListener('resize', () => {
        if (cachedMonthsData && cachedMonthsData.length > 0) {
            drawRevenueChart(cachedMonthsData);
            drawOrdersChart(cachedMonthsData);
        }
    });
});

async function loadDashboardData() {
    const statsContainer = document.getElementById('dashboard-stats');
    const ordersBody = document.getElementById('recent-orders-body');

    if (statsContainer) {
        statsContainer.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; color: var(--color-text-secondary);">
                Loading live dashboard metrics...
            </div>
        `;
    }

    if (ordersBody) {
        ordersBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2.5rem; color: var(--color-text-secondary);">
                    Loading recent orders...
                </td>
            </tr>
        `;
    }

    try {
        const [ordersData, productsData, partnersData, categoriesData] = await Promise.all([
            api.get('/orders/').catch(err => {
                console.warn('Failed to load orders for dashboard:', err);
                return [];
            }),
            api.get('/products/?limit=100').catch(err => {
                console.warn('Failed to load products for dashboard:', err);
                return [];
            }),
            api.get('/partners/').catch(err => {
                console.warn('Failed to load partners for dashboard:', err);
                return [];
            }),
            api.get('/categories/').catch(err => {
                console.warn('Failed to load categories for dashboard:', err);
                return [];
            })
        ]);

        const orders = Array.isArray(ordersData) ? ordersData : [];
        const products = Array.isArray(productsData) ? productsData : [];
        const partners = Array.isArray(partnersData) ? partnersData : [];
        const categories = Array.isArray(categoriesData) ? categoriesData : [];

        // Calculate live metrics
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, item) => {
            const detail = item.order_detail || {};
            return sum + (Number(detail.amount_paid) || 0);
        }, 0);

        const activeOrdersCount = orders.filter(item => {
            const status = (item.order_detail?.status || '').toUpperCase();
            return status === 'ACTIVE';
        }).length;

        const uniqueCustomerIds = new Set(orders.map(item => item.order_detail?.user_id).filter(Boolean));
        const totalCustomers = uniqueCustomerIds.size;

        const activeProducts = products.length;
        const activeDeals = products.filter(p => p.our_deal && p.price && Number(p.our_deal) < Number(p.price)).length;
        const partnerCount = partners.length;
        const categoryCount = categories.length;

        // Render Stats Cards
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-card">
                    <div class="stat-card__label">Total Revenue</div>
                    <div class="stat-card__value">${formatPrice(totalRevenue)}</div>
                    <div class="stat-card__change positive">Live Sales</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card__label">Total Orders</div>
                    <div class="stat-card__value">${totalOrders}</div>
                    <div class="stat-card__change ${activeOrdersCount > 0 ? 'positive' : ''}">${activeOrdersCount} Active orders</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card__label">Active Customers</div>
                    <div class="stat-card__value">${totalCustomers}</div>
                    <div class="stat-card__change">Ordering accounts</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card__label">Active Products</div>
                    <div class="stat-card__value">${activeProducts}</div>
                    <div class="stat-card__change positive">${activeDeals} with deals</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card__label">Categories</div>
                    <div class="stat-card__value">${categoryCount}</div>
                    <div class="stat-card__change">Catalog sections</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card__label">Partners</div>
                    <div class="stat-card__value">${partnerCount}</div>
                    <div class="stat-card__change">Active partners</div>
                </div>
            `;
        }

        // Render Recent Orders Table
        if (ordersBody) {
            if (orders.length === 0) {
                ordersBody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 2.5rem; color: var(--color-text-secondary);">
                            No customer orders placed yet.
                        </td>
                    </tr>
                `;
            } else {
                const sortedOrders = [...orders].sort((a, b) => {
                    const dateA = new Date(a.order_detail?.date || 0);
                    const dateB = new Date(b.order_detail?.date || 0);
                    if (dateB - dateA !== 0) return dateB - dateA;
                    return (b.order_detail?.id || 0) - (a.order_detail?.id || 0);
                }).slice(0, 5);

                ordersBody.innerHTML = sortedOrders.map(item => {
                    const order = item.order_detail || {};
                    const address = item.address;
                    const status = (order.status || 'Active').toUpperCase();

                    let badgeStyle = 'background: rgba(16, 185, 129, 0.12); color: #059669; border: 1px solid rgba(16, 185, 129, 0.25);';
                    if (status === 'DELIVERED') {
                        badgeStyle = 'background: rgba(59, 130, 246, 0.12); color: #2563eb; border: 1px solid rgba(59, 130, 246, 0.25);';
                    } else if (status === 'CANCELLED') {
                        badgeStyle = 'background: rgba(239, 68, 68, 0.12); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.25);';
                    }

                    const customerName = address?.name || (order.user_id ? `User #${order.user_id}` : 'Customer');
                    const customerSub = address ? `${address.city || ''}${address.state ? ', ' + address.state : ''}` : '';

                    return `
                        <tr>
                            <td><strong>#${order.id}</strong></td>
                            <td>${formatDate(order.date || new Date())}</td>
                            <td>
                                <div><strong>${customerName}</strong></div>
                                ${customerSub ? `<div style="font-size: 0.78rem; color: var(--color-text-secondary); margin-top: 2px;">${customerSub}</div>` : ''}
                            </td>
                            <td><strong>${formatPrice(order.amount_paid || 0)}</strong></td>
                            <td>
                                <span class="badge" style="${badgeStyle}; padding: 3px 9px; border-radius: 999px; font-weight: 600; font-size: 0.75rem;">
                                    ${order.status || 'Active'}
                                </span>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }

        // Aggregate and draw charts
        prepareAndDrawCharts(orders);

    } catch (err) {
        console.error('Failed to load dashboard data:', err);
        showToast('Failed to load dashboard data: ' + (err.message || 'Error'), 'error');
    }
}

function prepareAndDrawCharts(orders) {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            year: d.getFullYear(),
            month: d.getMonth(),
            label: d.toLocaleDateString('en-US', { month: 'short' }),
            revenue: 0,
            orderCount: 0
        });
    }

    orders.forEach(item => {
        const order = item.order_detail || {};
        if (!order.date) return;
        const d = new Date(order.date);
        const y = d.getFullYear();
        const m = d.getMonth();
        const bucket = months.find(b => b.year === y && b.month === m);
        if (bucket) {
            bucket.revenue += Number(order.amount_paid) || 0;
            bucket.orderCount += 1;
        }
    });

    cachedMonthsData = months;
    drawRevenueChart(months);
    drawOrdersChart(months);
}

function drawRevenueChart(months) {
    const canvas = document.getElementById('revenueChart');
    if (!canvas || !canvas.parentElement) return;
    const ctx = canvas.getContext('2d');

    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = rect.width ? Math.floor(rect.width) - 40 : 400;
    const displayHeight = 280;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    const data = months.map(m => m.revenue);
    const maxVal = Math.max(...data, 1000);

    const paddingLeft = 60;
    const paddingBottom = 40;
    const paddingTop = 25;
    const paddingRight = 20;

    const chartWidth = displayWidth - paddingLeft - paddingRight;
    const chartHeight = displayHeight - paddingTop - paddingBottom;

    // Draw grid lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
        const y = paddingTop + (chartHeight / 4) * i;
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(displayWidth - paddingRight, y);

        // Y-axis label
        const val = Math.round(maxVal - (maxVal / 4) * i);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(val >= 1000 ? `₹${Math.round(val / 1000)}k` : `₹${val}`, paddingLeft - 8, y + 4);
    }
    ctx.stroke();

    // Draw bars
    const barSpacing = chartWidth / data.length;
    const barWidth = Math.min(barSpacing * 0.55, 45);

    months.forEach((m, i) => {
        const val = m.revenue;
        const barHeight = val > 0 ? (val / maxVal) * chartHeight : 4;
        const x = paddingLeft + i * barSpacing + (barSpacing - barWidth) / 2;
        const y = paddingTop + chartHeight - barHeight;

        // Bar gradient
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, '#0ea5e9');
        gradient.addColorStop(1, '#0284c7');

        ctx.fillStyle = val > 0 ? gradient : '#e2e8f0';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
        ctx.fill();

        // Month label
        ctx.fillStyle = '#64748b';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(m.label, x + barWidth / 2, displayHeight - paddingBottom + 20);

        // Value on top of bar if > 0
        if (val > 0) {
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            const textVal = val >= 1000 ? `₹${(val / 1000).toFixed(1)}k` : `₹${Math.round(val)}`;
            ctx.fillText(textVal, x + barWidth / 2, y - 6);
        }
    });
}

function drawOrdersChart(months) {
    const canvas = document.getElementById('ordersChart');
    if (!canvas || !canvas.parentElement) return;
    const ctx = canvas.getContext('2d');

    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = rect.width ? Math.floor(rect.width) - 40 : 400;
    const displayHeight = 280;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    const data = months.map(m => m.orderCount);
    const maxVal = Math.max(...data, 5);

    const paddingLeft = 45;
    const paddingBottom = 40;
    const paddingTop = 25;
    const paddingRight = 20;

    const chartWidth = displayWidth - paddingLeft - paddingRight;
    const chartHeight = displayHeight - paddingTop - paddingBottom;

    // Draw grid lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
        const y = paddingTop + (chartHeight / 4) * i;
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(displayWidth - paddingRight, y);

        // Y-axis label
        const val = Math.round(maxVal - (maxVal / 4) * i);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(String(val), paddingLeft - 8, y + 4);
    }
    ctx.stroke();

    const spacing = chartWidth / (months.length - 1);

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;

    months.forEach((m, i) => {
        const val = m.orderCount;
        const x = paddingLeft + i * spacing;
        const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw points & labels
    months.forEach((m, i) => {
        const val = m.orderCount;
        const x = paddingLeft + i * spacing;
        const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;

        // Outer dot
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();

        // Inner white dot
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Month label
        ctx.fillStyle = '#64748b';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(m.label, x, displayHeight - paddingBottom + 20);

        // Value label above dot
        if (val > 0) {
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(String(val), x, y - 8);
        }
    });
}
