import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { showToast } from '../components/toast.js';
import { getCart, getCartTotal, clearCart } from '../state/cart.js';
import { getProductById } from '../data/products.js';
import { requireAuth } from '../state/auth.js';
import { generateOrderId, generatePromoCode, formatPrice, formatDate, copyToClipboard } from '../utils/helpers.js';

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth('/')) return;
    
    // We expect items in the cart to render the confirmation page
    const cart = getCart();
    if (cart.length === 0) {
        // If cart is already empty, they probably refreshed the confirmation page.
        // In a real app we'd load the order from the DB using a query param.
        // For this demo, we'll just redirect to home if no cart.
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has('demo')) {
            window.location.href = '/';
            return;
        }
    }

    initHeader();
    initFooter();
    renderConfirmationData(cart);
});

function renderConfirmationData(cart) {
    const orderId = generateOrderId();
    const date = new Date().toISOString();
    const amount = getCartTotal();
    const promoCode = generatePromoCode();

    document.getElementById('conf-order-id').textContent = orderId;
    document.getElementById('conf-date').textContent = formatDate(date);
    document.getElementById('conf-amount').textContent = formatPrice(amount);
    document.getElementById('conf-promo-code').textContent = promoCode;

    let itemsHtml = '';
    cart.forEach(item => {
        const product = getProductById(item.productId);
        if (!product) return;
        
        itemsHtml += `
            <div class="flex align-center border-bottom pb-sm mb-sm">
                <img src="${product.images[0]}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: contain; margin-right: var(--space-md); border-radius: var(--radius-sm);">
                <div style="flex: 1;">
                    <div class="font-medium">${product.name}</div>
                    <div class="text-sm text-secondary">Qty: ${item.quantity} | Brand: ${product.brand}</div>
                </div>
            </div>
        `;
    });
    
    const itemsList = document.getElementById('conf-items-list');
    if (itemsList) {
        itemsList.innerHTML = itemsHtml;
    }

    // Handle copy code button
    document.getElementById('btn-copy-code').addEventListener('click', () => {
        copyToClipboard(promoCode);
        showToast('Promo code copied to clipboard!', 'success');
    });

    // Save order to localStorage (mock backend)
    const currentUser = JSON.parse(localStorage.getItem('dealbridge_auth'));
    const orders = JSON.parse(localStorage.getItem('dealbridge_orders') || '[]');
    orders.push({
        id: orderId,
        userId: currentUser ? currentUser.id : 1,
        date: date,
        total: amount,
        status: 'processing',
        promoCode: promoCode,
        items: [...cart]
    });
    localStorage.setItem('dealbridge_orders', JSON.stringify(orders));

    // Clear the cart now that order is placed
    clearCart();
}
