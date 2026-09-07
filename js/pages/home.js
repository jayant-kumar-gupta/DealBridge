import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { categories } from '../data/categories.js';
import { partners } from '../data/partners.js';
import { getFeaturedProducts, getBestDeals } from '../data/products.js';
import { renderProductGrid } from '../components/product-card.js';

document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initFooter();
    renderCategories();
    renderFeaturedDeals();
    renderBestDeals();
    renderPartners();
});

function renderCategories() {
    const container = document.getElementById('home-categories');
    if (!container) return;
    
    container.innerHTML = categories.slice(0, 8).map(cat => `
        <a href="/category.html?id=${cat.id}" class="category-card">
            <div class="category-card__icon">${cat.icon}</div>
            <div class="category-card__name">${cat.name}</div>
        </a>
    `).join('');
}

function renderFeaturedDeals() {
    const featured = getFeaturedProducts().slice(0, 8);
    renderProductGrid(featured, '#home-featured');
}

function renderBestDeals() {
    const bestDeals = getBestDeals().slice(0, 6);
    renderProductGrid(bestDeals, '#home-best-deals');
}

function renderPartners() {
    const container = document.getElementById('home-partners');
    if (!container) return;
    
    container.innerHTML = partners.slice(0, 6).map(partner => `
        <div class="partner-card">
            <div class="partner-card__logo" style="background-color: ${partner.color}; color: #fff;">${partner.name.charAt(0)}</div>
            <div class="partner-card__info">
                <h3 style="margin-bottom: var(--space-xs); font-size: var(--font-size-base); font-weight: 600;">${partner.name}</h3>
                <p style="margin: 0; font-size: var(--font-size-xs); color: var(--color-text-secondary); line-height: 1.4;">${partner.description}</p>
            </div>
        </div>
    `).join('');
}
