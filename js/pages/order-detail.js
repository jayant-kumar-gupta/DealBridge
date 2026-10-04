import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { isLoggedIn, logout } from '../state/auth.js';
import { api } from '../utils/api.js';
import { formatPrice, formatDate, copyToClipboard } from '../utils/helpers.js';
import { showToast } from '../components/toast.js';

document.addEventListener('DOMContentLoaded', async () => {
    initHeader();
    initFooter();

    if (!isLoggedIn()) {
        window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
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

    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    const container = document.getElementById('order-container');

    if (!orderId) {
        container.innerHTML = '<div class="alert alert--error">Order ID not specified. <a href="/orders.html">Back to Orders</a></div>';
        return;
    }

    await loadOrder(orderId);
});

async function loadOrder(orderId) {
    const container = document.getElementById('order-container');
    container.innerHTML = '<p class="text-secondary" style="padding: 2rem; text-align: center;">Loading order details...</p>';

    try {
        const data = await api.get(`/orders/${orderId}`);
        if (!data || !data.order_detail) {
            container.innerHTML = '<div class="alert alert--error">Order not found. <a href="/orders.html">Back to Orders</a></div>';
            return;
        }

        renderOrderDetail(data);
    } catch (err) {
        console.error('Failed to load order:', err);
        container.innerHTML = `<div class="alert alert--error">${err.message || 'Failed to load order details.'} <a href="/orders.html">Back to Orders</a></div>`;
    }
}

function renderOrderDetail(data) {
    const container = document.getElementById('order-container');
    const { order_detail, address, order_items } = data;
    const status = order_detail.status || 'Active';
    const statusLower = status.toLowerCase();
    const isCancelled = statusLower === 'cancelled';
    const isDelivered = statusLower === 'delivered';

    let timelineHtml = `
        <ul class="timeline" id="order-timeline">
            <li class="timeline-step completed">
                <div class="timeline-indicator"></div>
                <div class="timeline-content">
                    <div class="timeline-title">Order Placed</div>
                    <div class="timeline-date">${formatDate(order_detail.date)}</div>
                </div>
            </li>
            <li class="timeline-step completed">
                <div class="timeline-indicator"></div>
                <div class="timeline-content">
                    <div class="timeline-title">Payment Confirmed</div>
                    <div class="timeline-date">Paid Online • ${formatPrice(order_detail.amount_paid)}</div>
                </div>
            </li>
            <li class="timeline-step completed">
                <div class="timeline-indicator"></div>
                <div class="timeline-content">
                    <div class="timeline-title">Redemption Token Generated</div>
                    <div class="timeline-date">Ready to redeem at partner store</div>
                </div>
            </li>
            <li class="timeline-step ${isDelivered ? 'completed' : ''}">
                <div class="timeline-indicator"></div>
                <div class="timeline-content">
                    <div class="timeline-title">Delivered</div>
                    <div class="timeline-date">${isDelivered ? 'Product delivered' : isCancelled ? 'Order Cancelled' : 'Pending partner fulfillment'}</div>
                </div>
            </li>
        </ul>
    `;

    // Render items list
    let itemsHtml = '<div style="margin-top: var(--spacing-lg);"><h3>Items in this Order</h3><div style="margin-top: var(--spacing-md); border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden;">';
    const items = Array.isArray(order_items) ? order_items : [];

    items.forEach(item => {
        const name = item.product_name || `Product #${item.product_id}`;
        const image = item.image_path || '/assets/images/placeholder.jpg';
        const itemTotal = Math.round(Number(item.price) * item.quantity * 100) / 100;

        itemsHtml += `
            <div style="display: flex; gap: var(--spacing-md); padding: var(--spacing-md); border-bottom: 1px solid var(--color-border); align-items: center; flex-wrap: wrap;">
                <img src="${image}" alt="${name}" style="width: 70px; height: 70px; object-fit: contain; border-radius: var(--radius-sm); border: 1px solid var(--color-border); background: var(--color-bg);">
                <div style="flex: 1; min-width: 200px;">
                    <div style="font-weight: 600; font-size: 1rem;">${name}</div>
                    <div style="color: var(--color-text-secondary); font-size: 0.9rem;">Qty: ${item.quantity} × ${formatPrice(item.price)}</div>
                </div>
                <div style="font-weight: 700; font-size: 1.05rem;">
                    ${formatPrice(itemTotal)}
                </div>
            </div>
        `;
    });
    itemsHtml += '</div></div>';

    // Promo code box
    let promoHtml = '';
    if (order_detail.promocode) {
        promoHtml = `
            <div class="promo-box">
                <p style="margin-bottom: var(--spacing-xs); font-weight: 500;">Partner 100% Off Redemption Code</p>
                <div class="promo-code-text" id="promo-code">${order_detail.promocode}</div>
                <button class="promo-copy-button" id="copy-btn">Copy Code</button>
            </div>
        `;
    }

    // Delivery address section
    let addressHtml = '<p class="text-secondary">No delivery address saved.</p>';
    if (address) {
        addressHtml = `
            <div style="line-height: 1.6; font-size: 0.95rem;">
                <strong>${address.type || 'Delivery Address'}</strong><br>
                ${address.address_line1}<br>
                ${address.address_line2 ? `${address.address_line2}<br>` : ''}
                ${address.city}, ${address.state} - ${address.pincode}
            </div>
        `;
    }

    container.innerHTML = `
        <div class="card" style="margin-bottom: var(--spacing-lg);">
            <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: var(--spacing-md); border-bottom: 1px solid var(--color-border); padding-bottom: var(--spacing-md); margin-bottom: var(--spacing-md);">
                <div>
                    <h2 style="margin-bottom: var(--spacing-xs);">Order #${order_detail.id}</h2>
                    <p style="color: var(--color-text-secondary); margin: 0;">Placed on ${formatDate(order_detail.date)}</p>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 1.3rem; font-weight: 700; color: var(--color-deal); margin-bottom: var(--spacing-xs);">${formatPrice(order_detail.amount_paid)}</div>
                    <span class="badge ${isDelivered ? 'badge-status-delivered' : isCancelled ? 'badge-status-cancelled' : 'badge-status-active'}">
                        ${status.toUpperCase()}
                    </span>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--spacing-xl); margin-bottom: var(--spacing-lg);">
                <div>
                    <h3>Order Status</h3>
                    ${timelineHtml}
                </div>
                <div>
                    <h3>Delivery Address</h3>
                    <div style="background: var(--color-bg); padding: var(--spacing-md); border-radius: var(--radius-md); margin-top: var(--spacing-md); border: 1px solid var(--color-border);">
                        ${addressHtml}
                    </div>

                    ${promoHtml}
                </div>
            </div>
            
            ${itemsHtml}

            ${statusLower === 'active' ? `
                <div style="margin-top: var(--spacing-xl); padding-top: var(--spacing-md); border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end;">
                    <button id="btn-cancel-order" class="btn btn--outline" style="color: var(--color-error); border-color: var(--color-error);">
                        Cancel Order
                    </button>
                </div>
            ` : ''}
        </div>
    `;

    // Handle copy code button
    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn && order_detail.promocode) {
        copyBtn.addEventListener('click', () => {
            copyToClipboard(order_detail.promocode);
            showToast('Redemption code copied to clipboard!', 'success');
            copyBtn.textContent = 'Copied!';
            setTimeout(() => { copyBtn.textContent = 'Copy Code'; }, 2000);
        });
    }

    // Handle cancel order button
    const cancelBtn = document.getElementById('btn-cancel-order');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', async () => {
            if (!confirm(`Are you sure you want to cancel Order #${order_detail.id}? This will restore stock to the partner inventory.`)) {
                return;
            }

            cancelBtn.disabled = true;
            cancelBtn.textContent = 'Cancelling...';

            try {
                await api.delete(`/orders/${order_detail.id}`);
                showToast('Order cancelled successfully.', 'success');
                setTimeout(() => {
                    window.location.href = '/orders.html';
                }, 1000);
            } catch (err) {
                console.error('Failed to cancel order:', err);
                showToast(err.message || 'Failed to cancel order.', 'error');
                cancelBtn.disabled = false;
                cancelBtn.textContent = 'Cancel Order';
            }
        });
    }
}
