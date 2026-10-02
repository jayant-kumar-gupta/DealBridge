import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { api } from '../utils/api.js';
import { formatPrice, generateStarRatingHTML } from '../utils/helpers.js';
import { renderPriceChart } from '../components/price-chart.js';
import { renderProductCard } from '../components/product-card.js';
import { addToCart } from '../state/cart.js';
import { toggleWishlist, isInWishlist } from '../state/wishlist.js';
import { showToast } from '../components/toast.js';

let currentProduct = null;
let currentProductDetail = null;

document.addEventListener('DOMContentLoaded', async () => {
    initHeader();
    initFooter();
    
    const params = new URLSearchParams(window.location.search);
    const productId = Number(params.get('id'));
    
    if (!productId) {
        showProductError();
        return;
    }
    
    try {
        const [productDetail, partners, categories] = await Promise.all([
            api.get(`/products/${productId}`),
            api.get('/partners/').catch(() => []),
            api.get('/categories/').catch(() => []),
        ]);

        if (!productDetail || !productDetail.product_info) {
            showProductError();
            return;
        }

        currentProduct = productDetail.product_info;
        currentProductDetail = productDetail;

        const partnerMap = new Map((partners || []).map(p => [p.id, p]));
        const currentCategory = (categories || []).find(c => c.id === currentProduct.category_id);
        const categoryName = currentCategory ? currentCategory.name : 'Category';

        document.title = `${currentProduct.name} — DealBridge`;
        
        populateProductDetails(productDetail, categoryName);
        setupGallery(productDetail);
        setupActions();
        populateComparisonTable(productDetail, partnerMap);
        setupPriceChart(productDetail);
        populateSimilarProducts(currentProduct.category_id);
    } catch (error) {
        console.error('Failed to load product details:', error);
        showProductError();
    }
});

function showProductError() {
    const content = document.getElementById('product-content');
    const errorEl = document.getElementById('product-error');
    if (content) content.style.display = 'none';
    if (errorEl) errorEl.style.display = 'block';
}

function populateProductDetails(productDetail, categoryName) {
    const p = productDetail.product_info;
    
    // Breadcrumb
    const bcCat = document.getElementById('breadcrumb-cat');
    if (bcCat) {
        bcCat.textContent = categoryName;
        bcCat.href = p.category_id ? `/category.html?id=${p.category_id}` : '#';
    }
    const bcName = document.getElementById('breadcrumb-name');
    if (bcName) {
        bcName.textContent = p.name;
    }
    
    // Info
    const brandEl = document.getElementById('prod-brand');
    if (brandEl) brandEl.textContent = p.brand || '';
    
    const nameEl = document.getElementById('prod-name');
    if (nameEl) nameEl.textContent = p.name || '';
    
    const starsEl = document.getElementById('prod-stars');
    if (starsEl) starsEl.innerHTML = generateStarRatingHTML(p.avg_rating || 0);
    
    const ratingValEl = document.getElementById('prod-rating-val');
    if (ratingValEl) ratingValEl.textContent = (p.avg_rating || 0).toFixed(1);
    
    const reviewsEl = document.getElementById('prod-reviews');
    if (reviewsEl) reviewsEl.textContent = (p.rating_count || 0).toLocaleString();
    
    const descEl = document.getElementById('prod-desc');
    if (descEl) descEl.textContent = p.description || p.short_describe || '';
    
    // Availability based on partner stock
    const availEl = document.getElementById('prod-availability');
    if (availEl) {
        const partnerPrices = productDetail.partner_prices || [];
        const totalStock = partnerPrices.reduce((sum, pp) => sum + (pp.stock_count || 0), 0);
        if (partnerPrices.length > 0 && totalStock === 0) {
            availEl.textContent = 'Out of Stock';
            availEl.className = 'availability out-of-stock';
        } else if (totalStock > 0 && totalStock <= 5) {
            availEl.textContent = 'Low Stock';
            availEl.className = 'availability low_stock';
        } else {
            availEl.textContent = 'In Stock';
            availEl.className = 'availability';
        }
    }
    
    // Pricing
    const ourPrice = p.our_deal || 0;
    const partnerPrices = (productDetail.partner_prices || []).map(pp => pp.partner_price);
    const minPartnerPrice = partnerPrices.length > 0 ? Math.min(...partnerPrices) : null;
    const maxPartnerPrice = partnerPrices.length > 0 ? Math.max(...partnerPrices) : null;
    
    const originalPrice = maxPartnerPrice && maxPartnerPrice > ourPrice 
        ? maxPartnerPrice 
        : (minPartnerPrice && minPartnerPrice > ourPrice ? minPartnerPrice : (ourPrice ? ourPrice * 1.1 : ourPrice));
    
    const discountPercent = originalPrice > ourPrice 
        ? Math.round(((originalPrice - ourPrice) / originalPrice) * 100) 
        : 0;
    
    const prodPriceEl = document.getElementById('prod-price');
    if (prodPriceEl) prodPriceEl.textContent = formatPrice(ourPrice);
    
    const prodOrigEl = document.getElementById('prod-original');
    const prodDiscEl = document.getElementById('prod-discount');
    if (prodOrigEl && prodDiscEl) {
        if (originalPrice > ourPrice) {
            prodOrigEl.textContent = formatPrice(originalPrice);
            prodOrigEl.style.display = 'inline';
            prodDiscEl.textContent = `${discountPercent}% OFF`;
            prodDiscEl.style.display = 'inline-block';
        } else {
            prodOrigEl.style.display = 'none';
            prodDiscEl.style.display = 'none';
        }
    }
    
    const prodSavingsEl = document.getElementById('prod-savings');
    if (prodSavingsEl) {
        if (minPartnerPrice && minPartnerPrice > ourPrice) {
            const savings = minPartnerPrice - ourPrice;
            prodSavingsEl.textContent = `You save ${formatPrice(savings)} by choosing DealBridge`;
            prodSavingsEl.style.display = 'block';
        } else {
            prodSavingsEl.style.display = 'none';
        }
    }
    
    // Specs
    const specsEl = document.getElementById('prod-specs');
    if (specsEl) {
        const specs = productDetail.specs || [];
        if (specs.length > 0) {
            specsEl.innerHTML = specs.map(s => `
                <div class="specs-label">${s.label}</div>
                <div>${s.value}</div>
            `).join('');
        } else {
            specsEl.innerHTML = '<div style="grid-column: 1 / -1; color: var(--color-text-secondary);">No specifications available.</div>';
        }
    }
    
    // Wishlist initial state
    const btnWishlist = document.getElementById('btn-wishlist');
    if (btnWishlist && isInWishlist(p.id)) {
        btnWishlist.classList.add('active');
        btnWishlist.innerHTML = '&#10084;';
    }
}

function setupGallery(productDetail) {
    const p = productDetail.product_info;
    const mainImg = document.getElementById('main-image');
    const imgSrc = p.image_path || '/assets/images/logo.jpg';
    if (mainImg) {
        mainImg.src = imgSrc;
        mainImg.alt = p.name || 'Product Image';
    }
    
    const thumbContainer = document.getElementById('thumbnail-container');
    if (!thumbContainer) return;
    
    const images = Array.isArray(p.images) && p.images.length > 0 ? p.images : [imgSrc];
    
    if (images.length <= 1) {
        thumbContainer.style.display = 'none';
    } else {
        thumbContainer.style.display = 'flex';
        thumbContainer.innerHTML = images.map((src, i) => `
            <div class="thumbnail ${i === 0 ? 'active' : ''}" data-src="${src}">
                <img src="${src}" alt="Thumbnail ${i + 1}">
            </div>
        `).join('');
        
        thumbContainer.querySelectorAll('.thumbnail').forEach(t => {
            t.addEventListener('click', () => {
                thumbContainer.querySelectorAll('.thumbnail').forEach(th => th.classList.remove('active'));
                t.classList.add('active');
                if (mainImg) mainImg.src = t.dataset.src;
            });
        });
    }
}

function setupActions() {
    const qtyInput = document.getElementById('qty-input');
    
    const minusBtn = document.getElementById('qty-minus');
    if (minusBtn) {
        minusBtn.addEventListener('click', () => {
            if (qtyInput && qtyInput.value > 1) qtyInput.value--;
        });
    }
    
    const plusBtn = document.getElementById('qty-plus');
    if (plusBtn) {
        plusBtn.addEventListener('click', () => {
            if (qtyInput && qtyInput.value < 10) qtyInput.value++;
        });
    }
    
    const addCartBtn = document.getElementById('btn-add-cart');
    if (addCartBtn) {
        addCartBtn.addEventListener('click', () => {
            if (!currentProduct) return;
            const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
            addToCart(currentProduct.id, qty);
            showToast(`Added ${qty} ${currentProduct.name} to cart`, 'success');
        });
    }
    
    const buyNowBtn = document.getElementById('btn-buy-now');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', () => {
            if (!currentProduct) return;
            const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
            addToCart(currentProduct.id, qty);
            window.location.href = '/checkout.html';
        });
    }
    
    const wishlistBtn = document.getElementById('btn-wishlist');
    if (wishlistBtn) {
        wishlistBtn.addEventListener('click', (e) => {
            if (!currentProduct) return;
            toggleWishlist(currentProduct.id);
            const nowInWishlist = isInWishlist(currentProduct.id);
            wishlistBtn.classList.toggle('active', nowInWishlist);
            wishlistBtn.innerHTML = nowInWishlist ? '&#10084;' : '&#9825;';
            showToast(nowInWishlist ? 'Added to wishlist' : 'Removed from wishlist', nowInWishlist ? 'success' : 'info');
        });
    }
}

function populateComparisonTable(productDetail, partnerMap) {
    const tbody = document.getElementById('comparison-tbody');
    if (!tbody) return;
    
    const p = productDetail.product_info;
    const partnerPrices = productDetail.partner_prices || [];
    
    if (partnerPrices.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--color-text-secondary); padding: var(--spacing-lg);">No partner comparisons available for this product.</td></tr>`;
        return;
    }
    
    const sortedPrices = [...partnerPrices].sort((a, b) => a.partner_price - b.partner_price);
    
    tbody.innerHTML = sortedPrices.map((pp, i) => {
        const partner = partnerMap.get(pp.partner_id) || { name: 'Partner', badge_color: '#1d8ba0' };
        const name = partner.name || 'Partner';
        const color = partner.badge_color || '#1d8ba0';
        const price = pp.partner_price;
        const savings = price - (p.our_deal || 0);
        const isBest = i === 0;
        
        return `
            <tr class="${isBest ? 'best-deal' : ''}">
                <td>
                    <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                        <div style="width:24px; height:24px; border-radius:50%; background:${color}; color:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; flex-shrink:0;">
                            ${name.charAt(0)}
                        </div>
                        <span style="font-weight:500;">${name}</span>
                        ${isBest ? '<span style="background:var(--color-deal); color:#fff; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold; margin-left:8px;">BEST DEAL</span>' : ''}
                    </div>
                </td>
                <td style="font-weight:500;">${formatPrice(price)}</td>
                <td style="font-weight:700; color:var(--color-primary);">${formatPrice(p.our_deal || 0)}</td>
                <td style="color:var(--color-deal); font-weight:600;">${savings > 0 ? formatPrice(savings) : '₹0'}</td>
                <td>
                    <button class="btn btn-outline btn-sm add-cart-partner" data-id="${p.id}" data-partner="${name}">Buy via DealBridge</button>
                </td>
            </tr>
        `;
    }).join('');
    
    tbody.querySelectorAll('.add-cart-partner').forEach(btn => {
        btn.addEventListener('click', () => {
            addToCart(p.id, 1);
            showToast(`Added to cart`, 'success');
        });
    });
}

function setupPriceChart(productDetail) {
    const chartContainer = document.querySelector('.price-chart-container');
    const priceHistory = productDetail.price_history || [];
    
    if (priceHistory.length === 0) {
        if (chartContainer) chartContainer.style.display = 'none';
        const prevHeader = chartContainer ? chartContainer.previousElementSibling : null;
        if (prevHeader && prevHeader.tagName === 'H2' && prevHeader.textContent.includes('Price History')) {
            prevHeader.style.display = 'none';
        }
        return;
    }
    
    if (chartContainer) chartContainer.style.display = 'block';
    
    const sortedHistory = [...priceHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    renderPriceChart('priceChart', sortedHistory);
    
    const prices = sortedHistory.map(item => item.price);
    const p = productDetail.product_info;
    const statCurrent = document.getElementById('stat-current');
    const statHigh = document.getElementById('stat-high');
    const statLow = document.getElementById('stat-low');
    
    if (statCurrent) statCurrent.textContent = formatPrice(p.our_deal || prices[prices.length - 1]);
    if (statHigh) statHigh.textContent = formatPrice(Math.max(...prices));
    if (statLow) statLow.textContent = formatPrice(Math.min(...prices));
}

async function populateSimilarProducts(categoryId) {
    const container = document.getElementById('similar-products-container');
    if (!container) return;
    
    if (!categoryId) {
        container.innerHTML = '<p style="color: var(--color-text-secondary);">No similar products found.</p>';
        return;
    }
    
    try {
        const products = await api.get(`/products/?category_id=${categoryId}&limit=8`);
        const similar = (products || []).filter(p => p.id !== currentProduct.id).slice(0, 6);
        
        container.innerHTML = '';
        if (similar.length === 0) {
            container.innerHTML = '<p style="color: var(--color-text-secondary);">No similar products found.</p>';
            return;
        }
        
        similar.forEach(p => {
            const card = renderProductCard(p);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Failed to load similar products:', error);
        container.innerHTML = '<p style="color: var(--color-text-secondary);">Could not load similar products.</p>';
    }
}
