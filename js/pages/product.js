import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { api } from '../utils/api.js';
import { formatPrice, generateStarRatingHTML } from '../utils/helpers.js';
import { renderPriceChart, filterPriceHistory } from '../components/price-chart.js?v=2.2';
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
        setupPriceChart(productDetail, partnerMap);
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
    
    // Availability
    const availEl = document.getElementById('prod-availability');
    if (availEl) {
        availEl.textContent = p.our_deal ? 'In Stock' : 'Out of Stock';
        availEl.className = p.our_deal ? 'availability' : 'availability out-of-stock';
    }
    
    // Pricing
    const ourPrice = p.our_deal || 0;
    const originalPrice = ourPrice ? Math.round(ourPrice * 50 / 49) : 0;
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
        if (originalPrice > ourPrice) {
            const savings = originalPrice - ourPrice;
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



function setupPriceChart(productDetail, partnerMap) {
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

    const partnerIds = Array.from(new Set(priceHistory.map(p => p.partner_id)));
    const visiblePartnerIds = new Set(partnerIds);
    let currentRange = '1m';

    // Render interactive legend below graph
    const legendContainer = document.getElementById('chart-legend');
    if (legendContainer) {
        legendContainer.innerHTML = '';
        partnerIds.forEach(partnerId => {
            const partner = partnerMap ? partnerMap.get(partnerId) : null;
            const name = partner ? partner.name : `Partner #${partnerId}`;
            const color = partner && partner.badge_color ? partner.badge_color : '#1d8ba0';

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'chart-legend-btn';
            btn.dataset.partnerId = partnerId;
            btn.setAttribute('aria-label', `Toggle ${name}`);
            btn.innerHTML = `
                <span class="chart-legend-dot" style="background-color: ${color};"></span>
                <span class="chart-legend-label">${name}</span>
            `;

            btn.addEventListener('click', () => {
                if (visiblePartnerIds.has(partnerId)) {
                    if (visiblePartnerIds.size > 1) {
                        visiblePartnerIds.delete(partnerId);
                        btn.classList.add('disabled');
                    } else {
                        showToast('At least one partner must remain visible', 'info');
                        return;
                    }
                } else {
                    visiblePartnerIds.add(partnerId);
                    btn.classList.remove('disabled');
                }
                renderCurrentChart();
            });

            legendContainer.appendChild(btn);
        });
    }

    // Wire range buttons (1M, 6M, 1Y)
    const toggleBtns = document.querySelectorAll('.chart-toggle-btn');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRange = btn.dataset.range || '1m';
            renderCurrentChart();
        });
    });

    function renderCurrentChart() {
        const filteredHistory = filterPriceHistory(priceHistory, currentRange);

        renderPriceChart('priceChart', filteredHistory, {
            partnerMap,
            visiblePartnerIds,
            range: currentRange,
        });

        // Update summary stats based on active points
        const activePoints = filteredHistory.filter(p => visiblePartnerIds.has(p.partner_id));
        const statCurrent = document.getElementById('stat-current');
        const statHigh = document.getElementById('stat-high');
        const statLow = document.getElementById('stat-low');

        if (activePoints.length > 0) {
            const prices = activePoints.map(p => p.price);
            const sorted = [...activePoints].sort((a, b) => new Date(b.date) - new Date(a.date));
            const latestDate = sorted[0].date;
            const latestPrices = sorted.filter(p => p.date === latestDate).map(p => p.price);
            const currentVal = Math.min(...latestPrices);

            if (statCurrent) statCurrent.textContent = formatPrice(currentVal);
            if (statHigh) statHigh.textContent = formatPrice(Math.max(...prices));
            if (statLow) statLow.textContent = formatPrice(Math.min(...prices));
        } else {
            if (statCurrent) statCurrent.textContent = '₹0';
            if (statHigh) statHigh.textContent = '₹0';
            if (statLow) statLow.textContent = '₹0';
        }
    }

    renderCurrentChart();

    window.addEventListener('resize', () => {
        renderCurrentChart();
    });
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
