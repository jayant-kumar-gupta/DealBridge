import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { isLoggedIn, logout } from '../state/auth.js';
import { api } from '../utils/api.js';
import { formatPrice, formatDate } from '../utils/helpers.js';

let allOrders = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
    initHeader();
    initFooter();

    if (!isLoggedIn()) {
        window.location.href = '/login.html?redirect=/orders.html';
        return;
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
            window.location.href = '/login.html';
        });
    }

    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.tab;
            renderOrders();
        });
    });

    await loadOrders();
});

async function loadOrders() {
    const container = document.getElementById('orders-list');
    container.innerHTML = '<p class="text-secondary" style="text-align: center; padding: 2rem;">Loading your orders...</p>';

    try {
        const data = await api.get('/orders/');
        allOrders = Array.isArray(data) ? data : [];
        renderOrders();
    } catch (err) {
        console.error('Failed to load orders:', err);
        container.innerHTML = '<p class="text-error" style="text-align: center; padding: 2rem;">Failed to load orders. Please refresh.</p>';
    }
}

function renderOrders() {
    const container = document.getElementById('orders-list');
    const emptyState = document.getElementById('empty-state');
    container.innerHTML = '';

    let filteredOrders = allOrders;
    if (currentFilter === 'active') {
        filteredOrders = allOrders.filter(o => (o.order_detail.status || '').toLowerCase() === 'active');
    } else if (currentFilter === 'delivered') {
        filteredOrders = allOrders.filter(o => (o.order_detail.status || '').toLowerCase() === 'delivered');
    } else if (currentFilter === 'cancelled') {
        filteredOrders = allOrders.filter(o => (o.order_detail.status || '').toLowerCase() === 'cancelled');
    }

    if (filteredOrders.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    container.style.display = 'flex';
    emptyState.style.display = 'none';

    filteredOrders.forEach(order => {
        const orderDetail = order.order_detail || {};
        const items = Array.isArray(order.order_items) ? order.order_items : [];
        const firstItem = items[0] || {};
        const productName = firstItem.product_name || (firstItem.product_id ? `Product #${firstItem.product_id}` : 'Order Item');
        const productImage = firstItem.image_path || '/assets/images/placeholder.jpg';
        const moreCount = items.length > 1 ? ` + ${items.length - 1} more item${items.length > 2 ? 's' : ''}` : '';
        const status = orderDetail.status || 'Active';
        const statusLower = status.toLowerCase();

        let badgeClass = 'badge-status-active';
        if (statusLower === 'delivered') badgeClass = 'badge-status-delivered';
        if (statusLower === 'cancelled') badgeClass = 'badge-status-cancelled';

        const card = document.createElement('div');
        card.className = 'card order-card';
        card.style.display = 'flex';
        card.style.justifyContent = 'space-between';
        card.style.alignItems = 'center';
        card.style.gap = 'var(--spacing-md)';
        card.style.padding = 'var(--spacing-md)';
        card.style.border = '1px solid var(--color-border)';
        card.style.borderRadius = 'var(--radius-md)';
        card.style.flexWrap = 'wrap';

        card.innerHTML = `
            <div style="display: flex; gap: var(--spacing-md); align-items: center; flex: 1; min-width: 260px;">
                <img src="${productImage}" alt="${productName}" style="width: 70px; height: 70px; object-fit: contain; border-radius: var(--radius-sm); border: 1px solid var(--color-border); background: var(--color-bg);">
                <div>
                    <div style="font-weight: 600; margin-bottom: var(--space-xs); font-size: 1.05rem;">
                        ${productName}${moreCount}
                    </div>
                    <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">
                        Order #${orderDetail.id} • ${formatDate(orderDetail.date)}
                    </div>
                    <div style="display: flex; gap: var(--space-xs); align-items: center; flex-wrap: wrap;">
                        <span class="badge ${badgeClass}">
                            ${status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                        ${orderDetail.promocode ? `
                            <span style="font-family: monospace; font-size: 0.8rem; background: var(--color-bg); padding: 2px 6px; border-radius: 4px; border: 1px dashed var(--color-primary); color: var(--color-primary-dark);">
                                Code: ${orderDetail.promocode}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
            <div style="text-align: right; min-width: 140px; margin-left: auto;">
                <div style="font-weight: 700; font-size: 1.15rem; color: var(--color-deal); margin-bottom: var(--spacing-sm);">
                    ${formatPrice(orderDetail.amount_paid)}
                </div>
                <a href="/order-detail.html?id=${orderDetail.id}" class="btn btn--outline" style="padding: 0.5rem 1rem; font-size: 0.9rem;">View Details</a>
            </div>
        `;
        container.appendChild(card);
    });
}
