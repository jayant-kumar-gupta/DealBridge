import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { renderProductGrid } from '../components/product-card.js';
import { api } from '../utils/api.js';

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

    const categories = await api.get("/categories/");
    
    container.innerHTML = categories.slice(0, 8).map(cat => `
        <a href="/category.html?id=${cat.id}" class="category-card">
            <div class="category-card__icon">${cat.icon}</div>
            <div class="category-card__name">${cat.name}</div>
        </a>`
    ).join('');
}

async function renderFeaturedDeals() {
    const products = await api.get("/products/?limit=8");
    renderProductGrid(products, '#home-featured');
}

async function renderBestDeals() {
    try {
        let allDiscounted = [];
        let offset = 0;
        const batchSize = 100;

        while (allDiscounted.length < 8 && offset < 500) {
            const batch = await api.get(`/products/?limit=${batchSize}&offset=${offset}`);
            if (!Array.isArray(batch) || batch.length === 0) break;

            const withDiscount = batch.filter(p => {
                const deal = p.our_deal != null ? Number(p.our_deal) : null;
                const marked = p.marked_price != null ? Number(p.marked_price) : null;
                return deal != null && marked != null && marked > deal;
            });

            allDiscounted.push(...withDiscount);
            if (batch.length < batchSize) break;
            offset += batchSize;
        }

        // Sort descending by discount percentage (massive discount first)
        allDiscounted.sort((a, b) => {
            const discA = (Number(a.marked_price) - Number(a.our_deal)) / Number(a.marked_price);
            const discB = (Number(b.marked_price) - Number(b.our_deal)) / Number(b.marked_price);
            return discB - discA;
        });

        const top8 = allDiscounted.slice(0, 8);
        renderProductGrid(top8, '#home-best-deals');
    } catch (err) {
        console.error('Failed to load best deals:', err);
    }
}

async function renderPartners() {
    const container = document.getElementById('home-partners');
    if (!container) return;

    const partners = await api.get("/partners/")
    
    container.innerHTML = partners.slice(0, 6).map(partner => `
        <div class="partner-card">
            <div class="partner-card__logo" style="background-color: ${partner.badge_color}; color: #fff;">${partner.name.charAt(0)}</div>
            <div class="partner-card__info">
                <h3 style="margin-bottom: var(--space-xs); font-size: var(--font-size-base); font-weight: 600;">${partner.name}</h3>
                <p style="margin: 0; font-size: var(--font-size-xs); color: var(--color-text-secondary); line-height: 1.4;">${partner.description}</p>
            </div>
        </div>
    `).join('');
}
