import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { showToast } from '../components/toast.js';
import { requireAuth } from '../state/auth.js';
import { clearCart } from '../state/cart.js?v=2.1';
import { api } from '../utils/api.js';
import { formatPrice, formatDate, copyToClipboard } from '../utils/helpers.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;

    initHeader();
    initFooter();

    // Ensure cart is cleared locally
    clearCart();

    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');

    if (!orderId) {
        window.location.href = '/orders.html';
        return;
    }

    await loadOrderDetails(orderId);
});

async function loadOrderDetails(orderId) {
    try {
        const data = await api.get(`/orders/${orderId}`);
        if (!data || !data.order_detail) {
            showToast('Order details not found.', 'error');
            setTimeout(() => window.location.href = '/orders.html', 1500);
            return;
        }

        renderConfirmationData(data);
    } catch (err) {
        console.error('Error fetching order confirmation:', err);
        showToast(err.message || 'Failed to load order confirmation.', 'error');
        document.getElementById('conf-promo-code').textContent = 'ERROR';
    }
}

function renderConfirmationData(data) {
    const { order_detail, address, order_items } = data;

    const orderIdEl = document.getElementById('conf-order-id');
    const dateEl = document.getElementById('conf-date');
    const amountEl = document.getElementById('conf-amount');
    const promoCodeEl = document.getElementById('conf-promo-code');

    if (orderIdEl) orderIdEl.textContent = `#${order_detail.id}`;
    if (dateEl) dateEl.textContent = formatDate(order_detail.date);
    if (amountEl) amountEl.textContent = formatPrice(order_detail.amount_paid);
    if (promoCodeEl) promoCodeEl.textContent = order_detail.promocode || '---';

    // Render items list
    let itemsHtml = '';
    const items = Array.isArray(order_items) ? order_items : [];

    items.forEach(item => {
        const name = item.product_name || `Product #${item.product_id}`;
        const image = item.image_path || '/assets/images/placeholder.jpg';
        const itemTotal = Math.round(Number(item.price) * item.quantity * 100) / 100;

        itemsHtml += `
            <div class="flex align-center border-bottom pb-sm mb-sm">
                <img src="${image}" alt="${name}" style="width: 50px; height: 50px; object-fit: contain; margin-right: var(--space-md); border-radius: var(--radius-sm); border: 1px solid var(--color-border);">
                <div style="flex: 1;">
                    <div class="font-medium">${name}</div>
                    <div class="text-sm text-secondary">Qty: ${item.quantity} × ${formatPrice(item.price)}</div>
                </div>
                <div class="font-bold">
                    ${formatPrice(itemTotal)}
                </div>
            </div>
        `;
    });

    const itemsList = document.getElementById('conf-items-list');
    if (itemsList) {
        itemsList.innerHTML = itemsHtml || '<p class="text-secondary">No items found.</p>';
    }

    // Handle copy code button
    const copyBtn = document.getElementById('btn-copy-code');
    if (copyBtn && order_detail.promocode) {
        copyBtn.addEventListener('click', () => {
            copyToClipboard(order_detail.promocode);
            showToast('Redemption code copied to clipboard!', 'success');
        });
    }
}
