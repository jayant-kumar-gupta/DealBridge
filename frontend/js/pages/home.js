import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { renderProductGrid } from '../components/product-card.js';
import { api } from '../utils/api.js';
import { escapeHtml } from '../utils/helpers.js';

document.addEventListener('DOMContentLoaded', async () => {
    initHeader();
    initFooter();
    await renderCategories();
    await renderFeaturedDeals();
    await renderBestDeals();
    await renderPartners();
});

async function renderCategories() {
    const container = document.getElementById('home-categories');
    if (!container) return;

    const categories = await api.get("/categories/?limit=8");
    
    container.innerHTML = (categories || []).slice(0, 8).map(cat => `
        <a href="/category.html?id=${cat.id}" class="category-card">
            <div class="category-card__icon">${escapeHtml(cat.icon || '📁')}</div>
            <div class="category-card__name">${escapeHtml(cat.name)}</div>
        </a>`
    ).join('');
}

async function renderFeaturedDeals() {
    const products = await api.get("/products/?limit=8");
    renderProductGrid(Array.isArray(products) ? products : [], '#home-featured');
}

async function renderBestDeals() {
    try {
        const top8 = await api.get('/products/?deals_only=true&sort_by=discount&limit=8');
        renderProductGrid(Array.isArray(top8) ? top8 : [], '#home-best-deals');
    } catch (err) {
        console.error('Failed to load best deals:', err);
    }
}

async function renderPartners() {
    const container = document.getElementById('home-partners');
    if (!container) return;

    const partners = await api.get("/partners/");
    
    container.innerHTML = (partners || []).slice(0, 6).map(partner => {
        const name = partner.name || 'Partner';
        const color = partner.badge_color || '#4A90D9';
        return `
        <div class="partner-card">
            <div class="partner-card__logo" style="background-color: ${escapeHtml(color)}; color: #fff;">${escapeHtml(name.charAt(0))}</div>
            <div class="partner-card__info">
                <h3 style="margin-bottom: var(--space-xs); font-size: var(--font-size-base); font-weight: 600;">${escapeHtml(name)}</h3>
                <p style="margin: 0; font-size: var(--font-size-xs); color: var(--color-text-secondary); line-height: 1.4;">${escapeHtml(partner.description || '')}</p>
            </div>
        </div>
    `;
    }).join('');
}
