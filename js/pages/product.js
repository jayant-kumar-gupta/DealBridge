import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { getProductById, getProductsByCategory } from '../data/products.js';
import { categories } from '../data/categories.js';
import { partners } from '../data/partners.js';
import { formatPrice, generateStarRatingHTML } from '../utils/helpers.js';
import { renderPriceChart } from '../components/price-chart.js';
import { renderProductCard } from '../components/product-card.js';
import { addToCart } from '../state/cart.js';
import { toggleWishlist, isInWishlist } from '../state/wishlist.js';
import { showToast } from '../components/toast.js';

let currentProduct = null;

document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initFooter();
    
    const params = new URLSearchParams(window.location.search);
    const productId = Number(params.get('id'));
    
    currentProduct = getProductById(productId);
    
    if (!currentProduct) {
        document.getElementById('product-content').style.display = 'none';
        document.getElementById('product-error').style.display = 'block';
        return;
    }
    
    document.title = `${currentProduct.name} — DealBridge`;
    
    populateProductDetails();
    setupGallery();
    setupActions();
    populateComparisonTable();
    setupPriceChart();
    populateSimilarProducts();
});

function populateProductDetails() {
    const p = currentProduct;
    const cat = categories.find(c => c.id === p.categoryId);
    
    // Breadcrumb
    const bcCat = document.getElementById('breadcrumb-cat');
    bcCat.textContent = p.category;
    bcCat.href = `/category.html?id=${p.categoryId}`;
    document.getElementById('breadcrumb-name').textContent = p.name;
    
    // Info
    document.getElementById('prod-brand').textContent = p.brand;
    document.getElementById('prod-name').textContent = p.name;
    document.getElementById('prod-stars').innerHTML = generateStarRatingHTML(p.rating);
    document.getElementById('prod-rating-val').textContent = p.rating;
    document.getElementById('prod-reviews').textContent = p.reviewCount.toLocaleString();
    document.getElementById('prod-desc').textContent = p.description;
    
    // Availability
    const availEl = document.getElementById('prod-availability');
    if (p.availability === 'in_stock') {
        availEl.textContent = 'In Stock';
        availEl.className = 'availability';
    } else if (p.availability === 'low_stock') {
        availEl.textContent = 'Low Stock';
        availEl.className = 'availability low_stock';
    } else {
        availEl.textContent = 'Out of Stock';
        availEl.className = 'availability out-of-stock';
    }
    
    // Pricing
    document.getElementById('prod-price').textContent = formatPrice(p.ourPrice);
    document.getElementById('prod-original').textContent = formatPrice(p.originalPrice);
    document.getElementById('prod-discount').textContent = `${p.discount}% OFF`;
    
    // Find cheapest partner
    const cheapestPartner = p.partnerPrices.reduce((min, pp) => pp.price < min.price ? pp : min);
    const savings = cheapestPartner.price - p.ourPrice;
    document.getElementById('prod-savings').textContent = `You save ${formatPrice(savings)} by choosing DealBridge`;
    
    // Specs
    document.getElementById('prod-specs').innerHTML = p.specs.map(s => `
        <div class="specs-label">${s.label}</div>
        <div>${s.value}</div>
    `).join('');
    
    // Wishlist initial state
    const btnWishlist = document.getElementById('btn-wishlist');
    if (isInWishlist(p.id)) {
        btnWishlist.classList.add('active');
        btnWishlist.innerHTML = '❤️';
    }
}

function setupGallery() {
    const mainImg = document.getElementById('main-image');
    mainImg.src = currentProduct.images[0];
    
    const thumbContainer = document.getElementById('thumbnail-container');
    
    // Create multiple thumbs even if we only have one image, just for demo
    const images = currentProduct.images.length > 1 ? currentProduct.images : [currentProduct.images[0], currentProduct.images[0]];
    
    thumbContainer.innerHTML = images.map((src, i) => `
        <div class="thumbnail ${i === 0 ? 'active' : ''}" data-src="${src}">
            <img src="${src}" alt="Thumbnail ${i+1}">
        </div>
    `).join('');
    
    thumbContainer.querySelectorAll('.thumbnail').forEach(t => {
        t.addEventListener('click', () => {
            thumbContainer.querySelectorAll('.thumbnail').forEach(th => th.classList.remove('active'));
            t.classList.add('active');
            mainImg.src = t.dataset.src;
        });
    });
}

function setupActions() {
    const qtyInput = document.getElementById('qty-input');
    
    document.getElementById('qty-minus').addEventListener('click', () => {
        if (qtyInput.value > 1) qtyInput.value--;
    });
    
    document.getElementById('qty-plus').addEventListener('click', () => {
        if (qtyInput.value < 10) qtyInput.value++;
    });
    
    document.getElementById('btn-add-cart').addEventListener('click', () => {
        const qty = parseInt(qtyInput.value);
        addToCart(currentProduct.id, qty);
        showToast(`Added ${qty} ${currentProduct.name} to cart`, 'success');
    });
    
    document.getElementById('btn-buy-now').addEventListener('click', () => {
        const qty = parseInt(qtyInput.value);
        addToCart(currentProduct.id, qty);
        window.location.href = '/checkout.html';
    });
    
    document.getElementById('btn-wishlist').addEventListener('click', (e) => {
        toggleWishlist(currentProduct.id);
        const btn = e.currentTarget;
        const nowInWishlist = isInWishlist(currentProduct.id);
        btn.classList.toggle('active', nowInWishlist);
        btn.innerHTML = nowInWishlist ? '&#10084;' : '&#9825;';
        showToast(nowInWishlist ? 'Added to wishlist' : 'Removed from wishlist', nowInWishlist ? 'success' : 'info');
    });
}

function populateComparisonTable() {
    const tbody = document.getElementById('comparison-tbody');
    const sortedPrices = [...currentProduct.partnerPrices].sort((a, b) => a.price - b.price);
    
    tbody.innerHTML = sortedPrices.map((pp, i) => {
        const partner = partners.find(p => p.id === pp.partnerId);
        const savings = pp.price - currentProduct.ourPrice;
        const isBest = i === 0;
        
        return `
            <tr class="${isBest ? 'best-deal' : ''}">
                <td>
                    <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                        <div style="width:24px; height:24px; border-radius:50%; background:${partner.color}; color:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold;">
                            ${partner.name.charAt(0)}
                        </div>
                        <span style="font-weight:500;">${partner.name}</span>
                        ${isBest ? '<span style="background:var(--color-deal); color:#fff; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold; margin-left:8px;">BEST DEAL</span>' : ''}
                    </div>
                </td>
                <td style="font-weight:500;">${formatPrice(pp.price)}</td>
                <td style="font-weight:700; color:var(--color-primary);">${formatPrice(currentProduct.ourPrice)}</td>
                <td style="color:var(--color-deal); font-weight:600;">${formatPrice(savings)}</td>
                <td>
                    <button class="btn btn-outline btn-sm add-cart-partner" data-id="${currentProduct.id}" data-partner="${partner.name}">Buy via DealBridge</button>
                </td>
            </tr>
        `;
    }).join('');
    
    document.querySelectorAll('.add-cart-partner').forEach(btn => {
        btn.addEventListener('click', () => {
            addToCart(currentProduct.id, 1);
            showToast(`Added to cart`, 'success');
        });
    });
}

function setupPriceChart() {
    if (!currentProduct.priceHistory || currentProduct.priceHistory.length === 0) {
        document.querySelector('.price-chart-container').style.display = 'none';
        return;
    }
    
    renderPriceChart('priceChart', currentProduct.priceHistory);
    
    const prices = currentProduct.priceHistory.map(p => p.price);
    document.getElementById('stat-current').textContent = formatPrice(currentProduct.ourPrice);
    document.getElementById('stat-high').textContent = formatPrice(Math.max(...prices));
    document.getElementById('stat-low').textContent = formatPrice(Math.min(...prices));
}

function populateSimilarProducts() {
    const container = document.getElementById('similar-products-container');
    const similar = getProductsByCategory(currentProduct.categoryId)
                    .filter(p => p.id !== currentProduct.id)
                    .slice(0, 6);
                    
    if (similar.length === 0) {
        container.innerHTML = '<p>No similar products found.</p>';
        return;
    }
    
    similar.forEach(p => {
        const card = renderProductCard(p);
        container.appendChild(card);
    });
}
