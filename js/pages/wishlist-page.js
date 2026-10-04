import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { isLoggedIn, logout, requireAuth } from '../state/auth.js';
import { getWishlist, removeFromWishlist } from '../state/wishlist.js';
import { addToCart, isInCart } from '../state/cart.js?v=2.1';
import { api } from '../utils/api.js';
import { formatPrice, generateStarRatingHTML } from '../utils/helpers.js';
import { showToast } from '../components/toast.js';

const loadedProducts = new Map();

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;

    initHeader();
    initFooter();

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
            window.location.href = '/login.html';
        });
    }

    renderWishlist();

    // Listen for wishlist updates across components
    document.addEventListener('wishlist-change', renderWishlist);

    // Listen for cart changes to update "In Cart" button states
    document.addEventListener('cart-change', updateCartButtons);
});

async function fetchWishlistProducts(ids) {
    if (!ids || ids.length === 0) return [];

    // Check if we need to fetch the catalog from the backend
    const missingIds = ids.filter(id => !loadedProducts.has(id));
    if (missingIds.length > 0) {
        try {
            const allProducts = await api.get('/products/');
            if (Array.isArray(allProducts)) {
                allProducts.forEach(p => loadedProducts.set(Number(p.id), p));
            }
        } catch (err) {
            console.error('Failed to fetch products from backend:', err);
        }
    }

    // For any products not in the bulk list, fetch individually
    const stillMissing = ids.filter(id => !loadedProducts.has(id));
    if (stillMissing.length > 0) {
        await Promise.all(stillMissing.map(async (id) => {
            try {
                const detail = await api.get(`/products/${id}`);
                if (detail && detail.product_info) {
                    loadedProducts.set(Number(id), detail.product_info);
                }
            } catch (e) {
                console.warn(`Could not load product #${id}:`, e);
            }
        }));
    }

    return ids.map(id => loadedProducts.get(id)).filter(Boolean);
}

async function renderWishlist() {
    const wishlistIds = getWishlist();
    const container = document.getElementById('wishlist-grid');
    const emptyState = document.getElementById('empty-state');
    const countEl = document.getElementById('wishlist-count');

    if (!container || !emptyState || !countEl) return;

    countEl.textContent = wishlistIds.length;

    if (wishlistIds.length === 0) {
        container.style.display = 'none';
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    container.style.display = 'grid';
    emptyState.style.display = 'none';

    // Show loading state if we haven't loaded products yet
    if (!wishlistIds.some(id => loadedProducts.has(id))) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: var(--space-3xl) 0; color: var(--color-text-secondary);">
                <div style="font-size: 2rem; margin-bottom: var(--space-sm);">⏳</div>
                <p>Loading your saved items...</p>
            </div>
        `;
    }

    const wishlistProducts = await fetchWishlistProducts(wishlistIds);

    // If all saved items were deleted or could not be found
    if (wishlistProducts.length === 0) {
        container.style.display = 'none';
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    let cardsHtml = '';
    wishlistProducts.forEach(product => {
        const id = Number(product.id);
        const name = product.name || 'Product';
        const brand = product.brand || '';
        const price = Number(product.our_deal || 0);
        const originalPrice = price ? Math.round((price * 50 / 49) * 100) / 100 : 0;
        const savings = Math.max(0, originalPrice - price);
        const discountPercent = originalPrice ? Math.round((savings / originalPrice) * 100) : 0;

        let image = product.image_path || '/assets/images/placeholder.jpg';
        if (image && !image.startsWith('/') && !image.startsWith('http')) {
            image = '/' + image;
        }

        const avgRating = product.avg_rating ?? product.rating ?? 0;
        const formattedRating = avgRating ? Math.round(Number(avgRating) * 100) / 100 : 0;
        const ratingCount = product.rating_count ?? product.reviewCount ?? 0;

        const inCart = isInCart(id);

        cardsHtml += `
            <div class="wishlist-card card" data-product-id="${id}">
                <button class="remove-btn" aria-label="Remove from wishlist" data-id="${id}" title="Remove from wishlist">✖</button>
                ${discountPercent > 0 ? `<div class="badge badge-discount" style="position: absolute; top: 10px; left: 10px; z-index: 2;">↓ ${discountPercent}% OFF</div>` : ''}
                
                <a href="/product.html?id=${id}" style="display: block; height: 200px; overflow: hidden; background: #ffffff; text-align: center;">
                    <img src="${image}" alt="${name}" loading="lazy" style="width: 100%; height: 100%; object-fit: contain; padding: var(--space-sm);" onerror="this.src='/assets/images/placeholder.jpg'">
                </a>
                
                <div style="padding: var(--space-md); display: flex; flex-direction: column; flex: 1;">
                    <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); text-transform: uppercase; margin-bottom: 4px; font-weight: 500;">${brand}</div>
                    <a href="/product.html?id=${id}" style="color: var(--color-text); text-decoration: none; font-weight: 600; margin-bottom: var(--space-xs); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.35; font-size: 1rem;">${name}</a>
                    
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: var(--space-sm); font-size: var(--font-size-sm);">
                        <span class="stars" style="color: var(--color-accent, #f59e0b);">${generateStarRatingHTML(avgRating)}</span>
                        <span style="font-weight: 600;">${formattedRating}</span>
                        ${ratingCount > 0 ? `<span style="color: var(--color-text-secondary); font-size: var(--font-size-xs);">(${ratingCount.toLocaleString()})</span>` : ''}
                    </div>
                    
                    <div style="margin-top: auto; margin-bottom: var(--space-md);">
                        <div style="display: flex; align-items: baseline; gap: 8px;">
                            <span style="font-size: var(--font-size-xl); font-weight: 700; color: var(--color-deal);">${formatPrice(price)}</span>
                            ${originalPrice > price ? `<span style="font-size: var(--font-size-sm); color: var(--color-text-muted); text-decoration: line-through;">${formatPrice(originalPrice)}</span>` : ''}
                        </div>
                        ${savings > 0 ? `<div style="color: var(--color-deal); font-size: var(--font-size-xs); font-weight: 500; margin-top: 2px;">Save ${formatPrice(savings)}</div>` : ''}
                    </div>
                    
                    <button class="btn btn-primary btn-full add-cart-btn" data-id="${id}">
                        ${inCart ? '✓ In Cart' : '🛒 Add to Cart'}
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = cardsHtml;
    attachWishlistEvents(wishlistProducts);
}

function attachWishlistEvents(productsList) {
    const productMap = new Map((productsList || []).map(p => [Number(p.id), p]));

    // Remove from Wishlist
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = Number(e.currentTarget.dataset.id);
            removeFromWishlist(id);
            showToast('Removed from wishlist', 'info');
            renderWishlist();
        });
    });

    // Add to Cart
    document.querySelectorAll('.add-cart-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = Number(e.currentTarget.dataset.id);
            const product = productMap.get(id);
            if (!product) return;

            if (!isInCart(id)) {
                const unitPrice = Number(product.our_deal || 0);
                const origPrice = unitPrice ? Math.round((unitPrice * 50 / 49) * 100) / 100 : 0;
                let image = product.image_path || '/assets/images/placeholder.jpg';
                if (image && !image.startsWith('/') && !image.startsWith('http')) {
                    image = '/' + image;
                }

                await addToCart(id, 1, {
                    name: product.name,
                    brand: product.brand,
                    price: unitPrice,
                    ourPrice: unitPrice,
                    our_deal: unitPrice,
                    original_price: origPrice,
                    savings: Math.max(0, origPrice - unitPrice),
                    image: image,
                    image_path: image,
                });

                btn.innerHTML = '✓ In Cart';
                showToast(`Added ${product.name} to cart`, 'success');
            } else {
                window.location.href = '/cart.html';
            }
        });
    });
}

function updateCartButtons() {
    document.querySelectorAll('.add-cart-btn').forEach(btn => {
        const id = Number(btn.dataset.id);
        if (isInCart(id)) {
            btn.innerHTML = '✓ In Cart';
        } else {
            btn.innerHTML = '🛒 Add to Cart';
        }
    });
}
