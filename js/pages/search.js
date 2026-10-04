import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { renderProductGrid } from '../components/product-card.js';
import { api } from '../utils/api.js';

let currentQuery = '';
let searchResults = [];
let allCategories = [];

document.addEventListener('DOMContentLoaded', async () => {
    initHeader();
    initFooter();
    
    // Parse URL params
    const params = new URLSearchParams(window.location.search);
    currentQuery = (params.get('q') || '').trim();
    
    const breadcrumbQuery = document.getElementById('breadcrumb-query');
    if (breadcrumbQuery) {
        breadcrumbQuery.textContent = currentQuery ? `"${currentQuery}"` : 'All Products';
    }
    const pageTitleQuery = document.getElementById('page-title-query');
    if (pageTitleQuery) {
        pageTitleQuery.textContent = currentQuery ? currentQuery : 'All Products';
    }
    document.title = currentQuery ? `Search: "${currentQuery}" — DealBridge` : 'All Products — DealBridge';

    // Populate search bar in header with current query if available
    const headerSearchInputs = document.querySelectorAll('input[type="search"]');
    headerSearchInputs.forEach(input => {
        if (currentQuery) input.value = currentQuery;
    });
    
    // Fetch categories and search results in parallel
    try {
        const [categoriesData, productsData] = await Promise.all([
            api.get('/categories/'),
            api.get(currentQuery ? `/products/?q=${encodeURIComponent(currentQuery)}&limit=100` : '/products/?limit=100')
        ]);
        
        allCategories = Array.isArray(categoriesData) ? categoriesData : [];
        searchResults = Array.isArray(productsData) ? productsData : [];
    } catch (err) {
        console.error('Failed to load search data:', err);
        searchResults = [];
        allCategories = [];
    }
    
    initFilters();
    setupEventListeners();
    applyFiltersAndSort();
});

function initFilters() {
    // Populate Categories filter
    const catContainer = document.getElementById('filter-categories');
    if (catContainer) {
        if (allCategories.length === 0) {
            catContainer.innerHTML = '<li style="color: var(--color-text-secondary); font-size: 0.85rem;">No categories available</li>';
        } else {
            catContainer.innerHTML = allCategories.map(c => `
                <li><label><input type="checkbox" name="category" value="${c.id}"> ${c.icon ? c.icon + ' ' : ''}${c.name}</label></li>
            `).join('');
        }
    }
    
    // Populate Brands based on search results
    const brands = [...new Set(searchResults.map(p => p.brand).filter(Boolean))].sort();
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
    let filtered = [...searchResults];
    
    // Form values
    const form = document.getElementById('filter-form');
    const formData = form ? new FormData(form) : new FormData();
    
    const selectedCats = formData.getAll('category').map(Number);
    const selectedBrands = formData.getAll('brand');
    const minPriceInput = document.getElementById('price-min');
    const maxPriceInput = document.getElementById('price-max');
    const minPrice = minPriceInput && minPriceInput.value ? Number(minPriceInput.value) : 0;
    const maxPrice = maxPriceInput && maxPriceInput.value ? Number(maxPriceInput.value) : Infinity;
    
    // Apply Category Filter
    if (selectedCats.length > 0) {
        filtered = filtered.filter(p => selectedCats.includes(p.category_id));
    }
    
    // Apply Brand Filter
    if (selectedBrands.length > 0) {
        filtered = filtered.filter(p => selectedBrands.includes(p.brand));
    }
    
    // Apply Price Filter
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
    
    // Render Counts
    const searchCount = document.getElementById('search-count');
    if (searchCount) {
        searchCount.textContent = `${filtered.length} product${filtered.length === 1 ? '' : 's'} found`;
    }
    const resultCountLabel = document.getElementById('result-count-label');
    if (resultCountLabel) {
        resultCountLabel.textContent = `Showing ${filtered.length} results`;
    }
    
    // Render Grid
    renderProductGrid(filtered, '#search-results');
}
