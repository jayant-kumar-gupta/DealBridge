import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { isLoggedIn, getCurrentUser, logout } from '../state/auth.js';
import { getOrdersByUser } from '../data/orders.js';
import { products } from '../data/products.js';
import { formatPrice } from '../utils/helpers.js';

document.addEventListener('DOMContentLoaded', () => {
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

    const user = getCurrentUser();
    const allOrders = getOrdersByUser(user.id);
    let currentFilter = 'all';

    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.tab;
            renderOrders();
        });
    });

    function getStatusColor(status) {
        const s = status.toLowerCase();
        if (s.includes('delivered')) return 'var(--color-success)';
        if (s.includes('cancelled')) return 'var(--color-error)';
        return 'var(--color-warning)';
    }

    function renderOrders() {
        const container = document.getElementById('orders-list');
        const emptyState = document.getElementById('empty-state');
        container.innerHTML = '';

        let filteredOrders = allOrders;
        if (currentFilter === 'active') {
            filteredOrders = allOrders.filter(o => !['delivered', 'cancelled'].includes(o.status.toLowerCase()));
        } else if (currentFilter !== 'all') {
            filteredOrders = allOrders.filter(o => o.status.toLowerCase() === currentFilter);
        }

        if (filteredOrders.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        container.style.display = 'flex';
        emptyState.style.display = 'none';

        filteredOrders.forEach(order => {
            // Get first product for display
            const firstItem = order.items[0];
            const product = products.find(p => p.id === firstItem.productId);
            
            const card = document.createElement('div');
            card.className = 'card order-card';
            card.style.display = 'flex';
            card.style.justifyContent = 'space-between';
            card.style.alignItems = 'center';
            card.style.gap = 'var(--spacing-md)';
            card.style.padding = 'var(--spacing-md)';
            card.style.border = '1px solid var(--color-border)';
            card.style.borderRadius = 'var(--radius-md)';
            
            card.innerHTML = `
                <div style="display: flex; gap: var(--spacing-md); align-items: center; flex: 1;">
                    <img src="${product ? product.images[0] : '/assets/images/products/product-1.jpg'}" alt="${product ? product.name : 'Product'}" style="width: 80px; height: 80px; object-fit: cover; border-radius: var(--radius-sm);">
                    <div>
                        <div style="font-weight: 600; margin-bottom: var(--space-xs);">${product ? product.name : 'Product'} ${order.items.length > 1 ? `+ ${order.items.length - 1} more` : ''}</div>
                        <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">
                            Order ID: ${order.id} • ${new Date(order.date).toLocaleDateString()}
                        </div>
                        <span class="badge ${order.status.toLowerCase() === 'delivered' ? 'badge-status-delivered' : order.status.toLowerCase() === 'cancelled' ? 'badge-status-cancelled' : 'badge-status-active'}">
                            ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                    </div>
                </div>
                <div style="text-align: right; min-width: 120px;">
                    <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: var(--spacing-sm);">${formatPrice(order.total)}</div>
                    <a href="/order-detail.html?id=${order.id}" class="btn btn--outline" style="padding: 0.5rem 1rem; font-size: 0.9rem;">View Details</a>
                </div>
            `;
            container.appendChild(card);
        });
    }

    renderOrders();
});
