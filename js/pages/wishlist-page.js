import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { isLoggedIn, logout } from '../state/auth.js';
import { getWishlist, removeFromWishlist } from '../state/wishlist.js';
import { addToCart } from '../state/cart.js';
import { products } from '../data/products.js';
import { formatPrice } from '../utils/helpers.js';
import { showToast } from '../components/toast.js';

document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initFooter();

    if (!isLoggedIn()) {
        window.location.href = '/login.html?redirect=/wishlist.html';
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

    function renderWishlist() {
        const wishlistIds = getWishlist();
        const container = document.getElementById('wishlist-grid');
        const emptyState = document.getElementById('empty-state');
        const countEl = document.getElementById('wishlist-count');
        
        countEl.textContent = wishlistIds.length;
        container.innerHTML = '';

        if (wishlistIds.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        container.style.display = 'grid';
        emptyState.style.display = 'none';

        const wishlistProducts = products.filter(p => wishlistIds.includes(p.id));

        wishlistProducts.forEach(product => {
            const savings = product.originalPrice ? product.originalPrice - product.ourPrice : 0;
            const savingsPercent = product.originalPrice ? Math.round((savings / product.originalPrice) * 100) : 0;
            
            const card = document.createElement('div');
            card.className = 'wishlist-card card';
            card.style.position = 'relative';
            card.style.overflow = 'hidden';
            
            card.innerHTML = `
                <button class="remove-btn btn btn-ghost btn-icon" aria-label="Remove from wishlist" data-id="${product.id}" style="position: absolute; top: 8px; right: 8px; z-index: 2; border-radius: var(--radius-full); background: var(--color-surface); width: 32px; height: 32px;">✖</button>
                ${savings > 0 ? `<div class="badge badge-discount" style="position: absolute; top: 10px; left: 10px; z-index: 2;">↓ ${savingsPercent}% OFF</div>` : ''}
                <a href="/product.html?id=${product.id}" style="display: block; height: 200px; overflow: hidden; background: var(--color-skeleton);">
                    <img src="${product.images ? product.images[0] : '/assets/images/products/product-1.jpg'}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: contain; padding: var(--space-sm);">
                </a>
                <div style="padding: var(--space-md); display: flex; flex-direction: column; flex: 1;">
                    <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); text-transform: uppercase; margin-bottom: 4px;">${product.brand}</div>
                    <a href="/product.html?id=${product.id}" style="color: inherit; text-decoration: none; font-weight: 600; margin-bottom: var(--space-xs); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${product.name}</a>
                    <div style="display: flex; align-items: center; gap: 4px; margin-bottom: var(--space-sm); font-size: var(--font-size-sm);">
                        <span style="color: var(--color-warning);">★</span> ${product.rating}
                    </div>
                    <div style="margin-top: auto; margin-bottom: var(--space-md);">
                        <span style="font-size: var(--font-size-xl); font-weight: 700; color: var(--color-deal);">${formatPrice(product.ourPrice)}</span>
                        ${product.originalPrice ? `<span style="font-size: var(--font-size-sm); color: var(--color-text-muted); text-decoration: line-through; margin-left: var(--space-xs);">${formatPrice(product.originalPrice)}</span>` : ''}
                        ${savingsPercent > 0 ? `<div style="color: var(--color-deal); font-size: var(--font-size-xs); font-weight: 500; margin-top: 2px;">Save ${formatPrice(savings)}</div>` : ''}
                    </div>
                    <button class="btn btn-primary btn-full add-cart-btn" data-id="${product.id}">🛒 Add to Cart</button>
                </div>
            `;
            container.appendChild(card);
        });

        // Add event listeners
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                removeFromWishlist(id);
                showToast('Removed from wishlist');
                renderWishlist(); // Re-render
            });
        });

        document.querySelectorAll('.add-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                const product = products.find(p => p.id === id);
                addToCart(product);
                showToast(`${product.name} added to cart!`, 'success');
                // Could optionally remove from wishlist here
            });
        });
    }

    renderWishlist();

    // Listen for cross-tab or component wishlist changes
    document.addEventListener('wishlist-change', renderWishlist);
});
