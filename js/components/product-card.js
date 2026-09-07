import { formatPrice, calculateDiscount, generateStarRatingHTML } from '../utils/helpers.js';
import { addToCart, isInCart } from '../state/cart.js';
import { toggleWishlist, isInWishlist } from '../state/wishlist.js';
import { getPartnerById } from '../data/partners.js';
import { showToast } from './toast.js';

export function renderProductCard(product) {
  // Find cheapest partner for display
  const cheapestPartner = product.partnerPrices.reduce((min, pp) => pp.price < min.price ? pp : min, product.partnerPrices[0]);
  const partner = getPartnerById(cheapestPartner.partnerId) || { id: cheapestPartner.partnerId, name: 'Partner' };
  const savings = cheapestPartner.price - product.ourPrice;
  const inWishlist = isInWishlist(product.id);
  const inCart = isInCart(product.id);
  
  const card = document.createElement('article');
  card.className = 'product-card';
  card.innerHTML = `
    <button class="product-card__wishlist ${inWishlist ? 'active' : ''}" data-product-id="${product.id}" aria-label="${inWishlist ? 'Remove from' : 'Add to'} wishlist">
      ${inWishlist ? '&#10084;' : '&#9825;'}
    </button>
    ${product.discount >= 10 ? `<span class="product-card__badge">${product.discount}% OFF</span>` : ''}
    <a href="/product.html?id=${product.id}" class="product-card__image">
      <img src="${product.images[0]}" alt="${product.name}" loading="lazy" width="300" height="300">
    </a>
    <div class="product-card__body">
      <a href="/product.html?id=${product.id}" class="product-card__name">${product.name}</a>
      <span class="product-card__brand">${product.brand}</span>
      <div class="product-card__rating">
        <span class="stars">${generateStarRatingHTML(product.rating)}</span>
        <span>${product.rating}</span>
        <span class="product-card__review-count">(${product.reviewCount.toLocaleString()})</span>
      </div>
      <div class="product-card__pricing">
        <span class="product-card__original-price">${formatPrice(product.originalPrice)}</span>
        <span class="product-card__price">${formatPrice(product.ourPrice)}</span>
        <span class="product-card__savings">Save ${formatPrice(savings)}</span>
      </div>
      <span class="product-card__partner">via ${partner.name}</span>
    </div>
    <div class="product-card__actions">
      <button class="btn btn-primary btn-sm btn-full add-to-cart-btn" data-product-id="${product.id}">
        ${inCart ? '&#10003; In Cart' : '&#128722; Add to Cart'}
      </button>
    </div>
  `;
  
  // Event listeners
  const wishlistBtn = card.querySelector('.product-card__wishlist');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleWishlist(product.id);
      const nowInWishlist = isInWishlist(product.id);
      wishlistBtn.classList.toggle('active', nowInWishlist);
      wishlistBtn.innerHTML = nowInWishlist ? '&#10084;' : '&#9825;';
      wishlistBtn.setAttribute('aria-label', `${nowInWishlist ? 'Remove from' : 'Add to'} wishlist`);
      showToast(nowInWishlist ? 'Added to wishlist' : 'Removed from wishlist', nowInWishlist ? 'success' : 'info');
    });
  }
  
  const addCartBtn = card.querySelector('.add-to-cart-btn');
  if (addCartBtn) {
    addCartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!isInCart(product.id)) {
        addToCart(product.id);
        addCartBtn.innerHTML = '&#10003; In Cart';
        showToast(`${product.name} added to cart`, 'success');
      } else {
        window.location.href = '/cart.html';
      }
    });
  }
  
  return card;
}

export function renderProductGrid(products, containerSelector) {
  const container = typeof containerSelector === 'string' 
    ? document.querySelector(containerSelector) 
    : containerSelector;
  if (!container) return;
  container.innerHTML = '';
  if (products.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: var(--space-3xl) var(--space-md); text-align: center;">
        <div class="empty-state__icon" style="font-size: 3rem; margin-bottom: var(--space-md);">&#128269;</div>
        <h3 class="empty-state__title" style="margin-bottom: var(--space-xs);">No products found</h3>
        <p class="empty-state__text" style="color: var(--color-text-secondary);">Try adjusting your filters or search terms</p>
      </div>
    `;
    return;
  }
  products.forEach(product => container.appendChild(renderProductCard(product)));
}
