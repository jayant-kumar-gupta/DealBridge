import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { renderProductGrid } from '../components/product-card.js';
import { api } from '../utils/api.js';

let currentCategory = null;
let categoryProducts = [];

document.addEventListener('DOMContentLoaded', async () => {
    initHeader();
    initFooter();
    
    // Parse URL params
    const params = new URLSearchParams(window.location.search);
    const catId = Number(params.get('id'));
    
    if (!catId) {
        showCategoryNotFound();
        return;
    }
    
    try {
        currentCategory = await api.get(`/categories/${catId}`);
    } catch (err) {
        console.error('Failed to fetch category:', err);
        showCategoryNotFound();
        return;
    }

    if (!currentCategory || !currentCategory.id) {
        showCategoryNotFound();
        return;
    }
    
    // Update Header
    document.title = `${currentCategory.name} — DealBridge`;
    if (document.getElementById('category-icon')) {
        document.getElementById('category-icon').textContent = currentCategory.icon || '📁';
    }
    if (document.getElementById('category-title')) {
        document.getElementById('category-title').textContent = currentCategory.name;
    }
    if (document.getElementById('category-desc')) {
        document.getElementById('category-desc').textContent = currentCategory.description || '';
    }
    if (document.getElementById('breadcrumb-name')) {
        document.getElementById('breadcrumb-name').textContent = currentCategory.name;
    }
    
    // Get Products for this Category
    try {
        categoryProducts = await api.get(`/products/?category_id=${catId}&limit=100`);
        if (!Array.isArray(categoryProducts)) {
            categoryProducts = [];
        }
    } catch (err) {
        console.error('Failed to fetch products for category:', err);
        categoryProducts = [];
    }
    
    initFilters();
    setupEventListeners();
    applyFiltersAndSort();
});

function showCategoryNotFound() {
    const heroH1 = document.querySelector('.category-hero h1');
    if (heroH1) heroH1.textContent = 'Category Not Found';
    const heroP = document.querySelector('.category-hero p');
    if (heroP) heroP.textContent = 'The category you are looking for does not exist.';
    const results = document.getElementById('category-results');
    if (results) results.innerHTML = '<div class="empty-state"><h3>No products found.</h3></div>';
}

function initFilters() {
    // Populate Brands based on category products
    const brands = [...new Set(categoryProducts.map(p => p.brand).filter(Boolean))].sort();
    const brandContainer = document.getElementById('filter-brands');
    if (brandContainer) {
        if (brands.length === 0) {
            brandContainer.innerHTML = '<li style="color: var(--color-text-secondary); font-size: 0.85rem;">No brands available</li>';
        } else {
            brandContainer.innerHTML = brands.map(b => `
                <li><label><input type="checkbox" name="brand" value="${b}"> ${b}</label></li>
            `).join('');
        }
    }
}

function setupEventListeners() {
    const form = document.getElementById('filter-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            applyFiltersAndSort();
            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('filter-sidebar');
                if (sidebar) sidebar.classList.remove('active');
            }
        });
        form.addEventListener('change', applyFiltersAndSort);
        form.addEventListener('input', applyFiltersAndSort);
    }
    
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', applyFiltersAndSort);
    }
    
    // Mobile filter toggle
    const toggleBtn = document.getElementById('filter-toggle-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const sidebar = document.getElementById('filter-sidebar');
            if (sidebar) {
                sidebar.classList.add('active');
                const header = document.querySelector('.filter-sidebar-header');
                if (header) header.style.display = 'flex';
            }
        });
    }
    
    const closeBtn = document.getElementById('filter-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            const sidebar = document.getElementById('filter-sidebar');
            if (sidebar) sidebar.classList.remove('active');
        });
    }
}

function applyFiltersAndSort() {
    let filtered = [...categoryProducts];
    
    // Form values
    const form = document.getElementById('filter-form');
    const formData = form ? new FormData(form) : new FormData();
    
    const selectedBrands = formData.getAll('brand');
    const minPriceInput = document.getElementById('price-min');
    const maxPriceInput = document.getElementById('price-max');
    const minPrice = minPriceInput && minPriceInput.value ? Number(minPriceInput.value) : 0;
    const maxPrice = maxPriceInput && maxPriceInput.value ? Number(maxPriceInput.value) : Infinity;
    
    // Apply Brands Filter
    if (selectedBrands.length > 0) {
        filtered = filtered.filter(p => selectedBrands.includes(p.brand));
    }
    
    // Apply Price Filter (using p.our_deal)
    filtered = filtered.filter(p => {
        const price = p.our_deal !== null && p.our_deal !== undefined ? p.our_deal : 0;
        return price >= minPrice && price <= maxPrice;
    });
    
    // Apply Sort
    const sortSelect = document.getElementById('sort-select');
    const sort = sortSelect ? sortSelect.value : 'relevance';
    if (sort === 'price-low') {
        filtered.sort((a, b) => (a.our_deal ?? 0) - (b.our_deal ?? 0));
    } else if (sort === 'price-high') {
        filtered.sort((a, b) => (b.our_deal ?? 0) - (a.our_deal ?? 0));
    } else if (sort === 'rating') {
        filtered.sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
    }
    
    // Render
    const countLabel = document.getElementById('result-count-label');
    if (countLabel) {
        const catName = currentCategory ? currentCategory.name : 'Category';
        countLabel.textContent = `Showing ${filtered.length} products in ${catName}`;
    }
    renderProductGrid(filtered, '#category-results');
}
