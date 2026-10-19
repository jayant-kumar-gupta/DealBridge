import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { getCart, fetchCart, removeFromCart, updateQuantity, getCartTotal, getCartSavings } from '../state/cart.js?v=2.1';
import { isLoggedIn } from '../state/auth.js';
import { formatPrice } from '../utils/helpers.js';

document.addEventListener('DOMContentLoaded', async () => {
    initHeader();
    initFooter();

    // Render immediately from local cache for instant UI
    renderCart();

    // If authenticated, sync with live database cart
    if (isLoggedIn()) {
        try {
            await fetchCart();
            renderCart();
        } catch (e) {
            console.error('Failed to load server cart:', e);
        }
    }

    // React to auth changes (e.g. login/logout in another component/tab)
    document.addEventListener('auth-change', async () => {
        if (isLoggedIn()) {
            await fetchCart();
        }
        renderCart();
    });
});

function renderCart() {
    const container = document.getElementById('cart-container');
    if (!container) return;

    const cart = getCart();

    if (!cart || cart.length === 0) {
        container.innerHTML = `
            <div class="empty-state text-center py-3xl" style="padding: var(--space-3xl) 0;">
                <div class="empty-state-icon" style="font-size: 4.5rem; margin-bottom: var(--space-md);">🛒</div>
                <h2 class="h3 mb-sm">Your cart is empty</h2>
                <p class="text-secondary mb-xl" style="color: var(--color-text-secondary); margin-bottom: var(--space-xl);">Looks like you haven't added anything to your cart yet.</p>
                <a href="/search.html" class="btn btn-primary btn-lg">Start Shopping</a>
            </div>
        `;
        return;
    }

    let itemsHtml = '';
    cart.forEach(item => {
        const id = item.productId;
        const name = item.name || 'Product';
        const brand = item.brand || '';
        const price = Number(item.price ?? item.our_deal ?? item.ourPrice ?? 0);
        const quantity = Number(item.quantity) || 1;
        const markedPrice = item.marked_price != null ? Number(item.marked_price) : (item.original_price != null ? Number(item.original_price) : null);
        const originalPrice = markedPrice != null && markedPrice > price ? markedPrice : price;
        const unitSavings = item.savings != null ? Number(item.savings) : Math.max(0, originalPrice - price);
        const lineSavings = unitSavings * quantity;
        const lineTotal = price * quantity;

        let image = item.image_path || item.image || '/assets/images/placeholder.jpg';
        if (image && !image.startsWith('/') && !image.startsWith('http')) {
            image = '/' + image;
        }

        let partnerInfo = '';
        if (item.partner_name) {
            const pColor = item.partner_color || 'var(--color-primary)';
            partnerInfo = ` | Partner: <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; color: #fff; background-color: ${pColor}; vertical-align: middle;">${item.partner_name}</span>`;
        }

        itemsHtml += `
            <div class="cart-item card p-md mb-md flex align-center" data-id="${id}" style="display: flex; align-items: center; padding: var(--space-md); margin-bottom: var(--space-md); gap: var(--space-md); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md);">
                <a href="/product.html?id=${id}" style="flex-shrink: 0;">
                    <img src="${image}" alt="${name}" class="cart-item-image" style="width: 90px; height: 90px; object-fit: contain; border-radius: var(--radius-sm); background: #fff; padding: 4px;" onerror="this.src='/assets/images/placeholder.jpg'">
                </a>
                <div class="cart-item-details" style="flex: 1; min-width: 0;">
                    <h3 class="cart-item-title h5 mb-xs" style="margin: 0 0 var(--space-xs) 0; font-size: 1.05rem;">
                        <a href="/product.html?id=${id}" style="color: var(--color-text); text-decoration: none;">${name}</a>
                    </h3>
                    <p class="text-secondary text-sm mb-xs" style="margin: 0; color: var(--color-text-secondary); font-size: 0.85rem;">
                        ${brand ? `Brand: <strong>${brand}</strong>` : ''}${partnerInfo}
                    </p>
                    <div class="cart-item-price-row mt-sm" style="display: flex; align-items: baseline; gap: var(--space-sm); margin-top: var(--space-xs);">
                        <span class="price h4" style="color: var(--color-primary); font-weight: 700; font-size: 1.15rem;">${formatPrice(price)}</span>
                        ${lineSavings > 0 ? `<span class="text-sm" style="color: var(--color-deal); font-weight: 500; font-size: 0.85rem;">Save ${formatPrice(lineSavings)}</span>` : ''}
                    </div>
                </div>
                <div class="cart-item-actions flex align-center" style="display: flex; align-items: center; gap: var(--space-md);">
                    <div class="quantity-selector" style="display: flex; align-items: center; border: 1px solid var(--color-border); border-radius: var(--radius-sm); overflow: hidden; background: var(--color-bg);">
                        <button class="btn-qty btn-minus" data-id="${id}" style="padding: 6px 12px; background: transparent; border: none; cursor: pointer; color: var(--color-text); font-weight: bold; font-size: 1rem;" aria-label="Decrease quantity">-</button>
                        <span class="qty-value" style="padding: 0 10px; font-weight: 600; min-width: 24px; text-align: center; color: var(--color-text);">${quantity}</span>
                        <button class="btn-qty btn-plus" data-id="${id}" style="padding: 6px 12px; background: transparent; border: none; cursor: pointer; color: var(--color-text); font-weight: bold; font-size: 1rem;" aria-label="Increase quantity">+</button>
                    </div>
                    <div class="line-total" style="font-weight: 700; min-width: 90px; text-align: right; color: var(--color-text); font-size: 1.1rem;">
                        ${formatPrice(lineTotal)}
                    </div>
                    <button class="btn-remove" data-id="${id}" aria-label="Remove item" title="Remove item" style="background: none; border: none; cursor: pointer; font-size: 1.25rem; padding: 6px; border-radius: var(--radius-sm); transition: transform 0.15s ease;">🗑️</button>
                </div>
            </div>
        `;
    });

    const subtotal = getCartTotal();
    const savings = getCartSavings();
    const totalItems = cart.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);

    container.innerHTML = `
        <div class="two-column" style="display: grid; grid-template-columns: 1fr 340px; gap: var(--space-xl); align-items: start;">
            <div class="cart-items-list">
                ${itemsHtml}
            </div>
            <div class="cart-summary-sidebar">
                <div class="card" style="padding: var(--space-xl); position: sticky; top: calc(var(--header-height, 70px) + var(--space-lg)); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg);">
                    <h3 style="margin-top: 0; margin-bottom: var(--space-md); padding-bottom: var(--space-sm); border-bottom: 1px solid var(--color-border); font-size: 1.25rem;">Order Summary</h3>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-sm); color: var(--color-text-secondary); font-size: 0.95rem;">
                        <span>Items (${totalItems})</span>
                        <span style="font-weight: 500; color: var(--color-text);">${formatPrice(subtotal + savings)}</span>
                    </div>

                    ${savings > 0 ? `
                        <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-sm); color: var(--color-deal); font-size: 0.95rem;">
                            <span>Total Savings</span>
                            <span style="font-weight: 600;">-${formatPrice(savings)}</span>
                        </div>
                    ` : ''}

                    <div style="display: flex; justify-content: space-between; margin-top: var(--space-md); padding-top: var(--space-md); border-top: 1px solid var(--color-border); font-size: 1.2rem; font-weight: 700;">
                        <span>Total Amount</span>
                        <span style="color: var(--color-deal);">${formatPrice(subtotal)}</span>
                    </div>
                    
                    <button id="btn-checkout" class="btn btn-primary btn-full btn-lg" style="margin-top: var(--space-lg); width: 100%; padding: 14px; font-weight: 600; font-size: 1rem; cursor: pointer;">Proceed to Checkout →</button>
                    <a href="/search.html" class="btn btn-ghost btn-full" style="margin-top: var(--space-sm); text-align: center; display: block; padding: 10px; color: var(--color-text-secondary); text-decoration: none;">Continue Shopping</a>
                </div>
            </div>
        </div>
    `;

    attachCartEvents();
}

function attachCartEvents() {
    // Quantity Minus
    document.querySelectorAll('.btn-minus').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            const cartItem = getCart().find(i => Number(i.productId) === id);
            if (cartItem && cartItem.quantity > 1) {
                await updateQuantity(id, cartItem.quantity - 1);
                renderCart();
            } else if (cartItem && cartItem.quantity === 1) {
                await removeFromCart(id);
                showToast('Item removed from cart', 'info');
                renderCart();
            }
        });
    });

    // Quantity Plus
    document.querySelectorAll('.btn-plus').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            const cartItem = getCart().find(i => Number(i.productId) === id);
            if (cartItem) {
                await updateQuantity(id, cartItem.quantity + 1);
                renderCart();
            }
        });
    });

    // Remove Item
    document.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            await removeFromCart(id);
            showToast('Item removed from cart', 'info');
            renderCart();
        });
    });

    // Proceed to Checkout
    const checkoutBtn = document.getElementById('btn-checkout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (!isLoggedIn()) {
                showModal(`
                    <div class="text-center" style="text-align: center; padding: var(--space-sm);">
                        <div style="font-size: 3rem; margin-bottom: var(--space-sm);">🔐</div>
                        <h3 class="mb-sm" style="margin-bottom: var(--space-xs);">Login Required</h3>
                        <p class="mb-lg text-secondary" style="color: var(--color-text-secondary); margin-bottom: var(--space-lg);">Please log in or create an account to proceed to checkout and complete your order.</p>
                        <a href="/login.html?redirect=${encodeURIComponent('/checkout.html')}" class="btn btn-primary btn-block" style="display: block; width: 100%; padding: 12px; margin-bottom: var(--space-sm); text-decoration: none;">Log In</a>
                        <a href="/login.html?register=true&redirect=${encodeURIComponent('/checkout.html')}" class="btn btn-ghost btn-block" style="display: block; width: 100%; padding: 10px; text-decoration: none;">Create an Account</a>
                    </div>
                `, { title: 'Authentication Required' });
            } else {
                window.location.href = '/checkout.html';
            }
        });
    }
}
