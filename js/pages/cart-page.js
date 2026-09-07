import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { getCart, removeFromCart, updateQuantity, getCartTotal, getCartSavings } from '../state/cart.js';
import { isLoggedIn } from '../state/auth.js';
import { getProductById } from '../data/products.js';
import { getPartnerById } from '../data/partners.js';
import { formatPrice } from '../utils/helpers.js';

document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initFooter();
    renderCart();
});

function renderCart() {
    const container = document.getElementById('cart-container');
    const cart = getCart();

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon" style="font-size: 4rem;">🛒</div>
                <h2>Your cart is empty</h2>
                <p class="text-secondary mb-lg">Looks like you haven't added anything to your cart yet.</p>
                <a href="/" class="btn btn-primary">Start Shopping</a>
            </div>
        `;
        return;
    }

    let itemsHtml = '';
    cart.forEach(item => {
        const product = getProductById(item.productId);
        if (!product) return;

        const cheapestPartner = product.partnerPrices.reduce((min, pp) => pp.price < min.price ? pp : min, product.partnerPrices[0]);
        const partner = getPartnerById(cheapestPartner.partnerId);
        
        const lineTotal = product.ourPrice * item.quantity;
        const lineSavings = (cheapestPartner.price - product.ourPrice) * item.quantity;

        itemsHtml += `
            <div class="cart-item card p-md mb-md flex align-center" data-id="${product.id}">
                <img src="${product.images[0]}" alt="${product.name}" class="cart-item-image" style="width: 100px; height: 100px; object-fit: contain; border-radius: var(--radius-sm); margin-right: var(--space-md);">
                <div class="cart-item-details" style="flex: 1;">
                    <h3 class="cart-item-title h5 mb-xs">${product.name}</h3>
                    <p class="text-secondary text-sm mb-xs">Brand: ${product.brand} | Partner: <span style="color: ${partner.color}; font-weight: 500;">${partner.name}</span></p>
                    <div class="cart-item-price-row mt-sm">
                        <span class="price h4" style="color: var(--color-primary);">${formatPrice(product.ourPrice)}</span>
                        ${lineSavings > 0 ? `<span class="text-sm ml-sm" style="color: var(--color-deal);">Save ${formatPrice(lineSavings)}</span>` : ''}
                    </div>
                </div>
                <div class="cart-item-actions flex align-center">
                    <div class="quantity-selector mr-md" style="display: flex; align-items: center; border: 1px solid var(--color-border); border-radius: var(--radius-sm);">
                        <button class="btn-qty btn-minus" data-id="${product.id}" style="padding: 5px 10px; background: transparent; border: none; cursor: pointer;">-</button>
                        <span class="qty-value" style="padding: 0 10px; font-weight: 500;">${item.quantity}</span>
                        <button class="btn-qty btn-plus" data-id="${product.id}" style="padding: 5px 10px; background: transparent; border: none; cursor: pointer;">+</button>
                    </div>
                    <div class="line-total mr-md" style="font-weight: 600; min-width: 80px; text-align: right;">
                        ${formatPrice(lineTotal)}
                    </div>
                    <button class="btn btn-icon btn-remove text-error" data-id="${product.id}" aria-label="Remove item">🗑️</button>
                </div>
            </div>
        `;
    });

    const subtotal = getCartTotal();
    const savings = getCartSavings();

    container.innerHTML = `
        <div class="two-column">
            <div class="cart-items-list">
                ${itemsHtml}
            </div>
            <div class="cart-summary-sidebar">
                <div class="card" style="padding: var(--space-xl); position: sticky; top: calc(var(--header-height) + var(--space-lg));">
                    <h3 style="margin-bottom: var(--space-md); padding-bottom: var(--space-sm); border-bottom: 1px solid var(--color-border);">Order Summary</h3>
                    <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-sm);">
                        <span style="color: var(--color-text-secondary);">Items (${cart.reduce((sum, i) => sum + i.quantity, 0)})</span>
                        <span style="font-weight: 500;">${formatPrice(subtotal)}</span>
                    </div>
                    ${savings > 0 ? `
                        <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-sm); color: var(--color-deal);">
                            <span>Total Savings</span>
                            <span style="font-weight: 600;">-${formatPrice(savings)}</span>
                        </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; margin-top: var(--space-md); padding-top: var(--space-md); border-top: 1px solid var(--color-border); font-size: var(--font-size-lg); font-weight: bold;">
                        <span>Total Amount</span>
                        <span style="color: var(--color-deal);">${formatPrice(subtotal)}</span>
                    </div>
                    
                    <button id="btn-checkout" class="btn btn-primary btn-full btn-lg" style="margin-top: var(--space-lg);">Proceed to Checkout →</button>
                    <a href="/" class="btn btn-ghost btn-full" style="margin-top: var(--space-sm); text-align: center;">Continue Shopping</a>
                </div>
            </div>
        </div>
    `;

    attachCartEvents();
}

function attachCartEvents() {
    document.querySelectorAll('.btn-minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            const cartItem = getCart().find(i => i.productId === id);
            if (cartItem && cartItem.quantity > 1) {
                updateQuantity(id, cartItem.quantity - 1);
                renderCart();
            }
        });
    });

    document.querySelectorAll('.btn-plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            const cartItem = getCart().find(i => i.productId === id);
            if (cartItem) {
                updateQuantity(id, cartItem.quantity + 1);
                renderCart();
            }
        });
    });

    document.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            removeFromCart(id);
            showToast('Item removed from cart', 'success');
            renderCart();
        });
    });

    const checkoutBtn = document.getElementById('btn-checkout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (!isLoggedIn()) {
                showModal(`
                    <div class="text-center">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🔐</div>
                        <h3 class="mb-md">Login Required</h3>
                        <p class="mb-lg text-secondary">Please log in to proceed to checkout and complete your order.</p>
                        <a href="/login.html?redirect=/checkout.html" class="btn btn-primary btn-block">Log In</a>
                        <a href="/login.html?register=true&redirect=/checkout.html" class="btn btn-ghost btn-block mt-sm">Create an Account</a>
                    </div>
                `, { title: 'Authentication Required' });
            } else {
                window.location.href = '/checkout.html';
            }
        });
    }
}
