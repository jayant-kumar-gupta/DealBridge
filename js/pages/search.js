import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { renderProductGrid } from '../components/product-card.js';
import { api } from '../utils/api.js';
import { debounce } from '../utils/helpers.js';

const LIMIT = 48; // Products per page (divisible by 2, 3, and 4 columns)

let currentQuery = '';
let selectedCategoryId = null;
let selectedBrand = '';
let minPrice = 0;
let maxPrice = Infinity;
let sortOrder = 'relevance';

let currentPage = 1;
let totalProducts = null; // null if unknown, number if provided by count endpoint
let totalPages = 1;
let currentProducts = [];
let allCategories = [];
let availableBrands = [];
let isLoading = false;

document.addEventListener('DOMContentLoaded', async () => {
    initHeader();
    initFooter();

    // Parse URL query parameters
    const params = new URLSearchParams(window.location.search);
    currentQuery = (params.get('q') || '').trim();

    const catParam = params.get('category_id') || params.get('category');
    if (catParam) {
        const parsedCat = parseInt(catParam, 10);
        if (!isNaN(parsedCat)) selectedCategoryId = parsedCat;
    }

    const pageParam = parseInt(params.get('page'), 10);
    if (!isNaN(pageParam) && pageParam > 0) {
        currentPage = pageParam;
    }

    const sortParam = params.get('sort');
    if (sortParam) {
        sortOrder = sortParam;
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) sortSelect.value = sortOrder;
    }

    updateHeaderSearchInputs();
    setupEventListeners();

    // Load all categories for the filter sidebar
    await loadAllCategories();

    // Load initial products page
    await loadProducts();
});

function updateHeaderSearchInputs() {
    const headerSearchInputs = document.querySelectorAll('input[type="search"]');
    headerSearchInputs.forEach(input => {
        if (currentQuery) input.value = currentQuery;
    });
}

function updatePageTitles() {
    let titleContext = 'All Products';
    if (currentQuery && selectedCategoryId) {
        const cat = allCategories.find(c => c.id === selectedCategoryId);
        titleContext = `"${currentQuery}" in ${cat ? cat.name : 'Category'}`;
    } else if (currentQuery) {
        titleContext = `"${currentQuery}"`;
    } else if (selectedCategoryId) {
        const cat = allCategories.find(c => c.id === selectedCategoryId);
        titleContext = cat ? cat.name : 'Selected Category';
    }

    const breadcrumbQuery = document.getElementById('breadcrumb-query');
    if (breadcrumbQuery) breadcrumbQuery.textContent = titleContext;

    const pageTitleQuery = document.getElementById('page-title-query');
    if (pageTitleQuery) pageTitleQuery.textContent = titleContext;

    document.title = `${titleContext} — DealBridge`;
}

function updateUrlParams() {
    const url = new URL(window.location);
    if (currentQuery) {
        url.searchParams.set('q', currentQuery);
    } else {
        url.searchParams.delete('q');
    }

    if (selectedCategoryId) {
        url.searchParams.set('category_id', selectedCategoryId);
    } else {
        url.searchParams.delete('category_id');
        url.searchParams.delete('category');
    }

    if (currentPage > 1) {
        url.searchParams.set('page', currentPage);
    } else {
        url.searchParams.delete('page');
    }

    if (sortOrder && sortOrder !== 'relevance') {
        url.searchParams.set('sort', sortOrder);
    } else {
        url.searchParams.delete('sort');
    }

    window.history.replaceState({}, '', url);
}

/**
 * Loads all categories in batches of 50 to populate the 200+ categories sidebar
 */
async function loadAllCategories() {
    const catContainer = document.getElementById('filter-categories');
    if (catContainer) {
        catContainer.innerHTML = '<li style="color: var(--color-text-secondary); font-size: 0.82rem; padding: 6px;">Loading categories...</li>';
    }

    try {
        const results = await Promise.all([
            api.get('/categories/?offset=0&limit=50').catch(() => []),
            api.get('/categories/?offset=50&limit=50').catch(() => []),
            api.get('/categories/?offset=100&limit=50').catch(() => []),
            api.get('/categories/?offset=150&limit=50').catch(() => []),
            api.get('/categories/?offset=200&limit=50').catch(() => [])
        ]);

        const combined = results.flat().filter(Boolean);
        // Deduplicate by ID
        const seen = new Set();
        allCategories = [];
        for (const cat of combined) {
            if (cat && cat.id && !seen.has(cat.id)) {
                seen.add(cat.id);
                allCategories.push(cat);
            }
        }

        // Sort alphabetically for clean navigation
        allCategories.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        renderCategoriesFilter(allCategories);
    } catch (err) {
        console.error('Failed to load categories for sidebar:', err);
        allCategories = [];
        if (catContainer) {
            catContainer.innerHTML = '<li style="color: var(--color-text-secondary); font-size: 0.82rem; padding: 6px;">No categories available</li>';
        }
    }
}

function renderCategoriesFilter(categoriesList) {
    const catContainer = document.getElementById('filter-categories');
    const clearBtn = document.getElementById('clear-category-filter-btn');
    if (!catContainer) return;

    if (clearBtn) {
        clearBtn.style.display = selectedCategoryId ? 'inline-block' : 'none';
    }

    if (categoriesList.length === 0) {
        catContainer.innerHTML = '<li style="color: var(--color-text-secondary); font-size: 0.82rem; padding: 6px;">No categories match</li>';
        return;
    }

    let html = `
        <li>
            <label class="category-filter-item" title="Show products from all categories">
                <input type="radio" name="category" value="" ${selectedCategoryId === null ? 'checked' : ''}>
                <span style="font-size: 1rem;">🌐</span>
                <span class="category-filter-name" style="font-weight: ${selectedCategoryId === null ? '600' : '400'};">All Categories</span>
            </label>
        </li>
    `;

    html += categoriesList.map(c => {
        const isChecked = selectedCategoryId === c.id;
        const icon = c.icon || '📁';
        const escapedName = escapeHtml(c.name);
        return `
            <li>
                <label class="category-filter-item" title="${escapedName}">
                    <input type="radio" name="category" value="${c.id}" ${isChecked ? 'checked' : ''}>
                    <span style="font-size: 1rem;">${icon}</span>
                    <span class="category-filter-name" title="${escapedName}" style="font-weight: ${isChecked ? '600' : '400'}; color: ${isChecked ? 'var(--color-primary)' : 'inherit'};">${escapedName}</span>
                </label>
            </li>
        `;
    }).join('');

    catContainer.innerHTML = html;

    // Attach change events to radio buttons
    catContainer.querySelectorAll('input[name="category"]').forEach(radio => {
        radio.addEventListener('change', async (e) => {
            const val = e.target.value;
            selectedCategoryId = val ? parseInt(val, 10) : null;
            currentPage = 1;
            totalProducts = null;
            updatePageTitles();
            updateUrlParams();
            if (clearBtn) clearBtn.style.display = selectedCategoryId ? 'inline-block' : 'none';
            await loadProducts();
        });
    });
}

function setupEventListeners() {
    // Quick search filter inside categories list
    const catSearchFilter = document.getElementById('category-search-filter');
    if (catSearchFilter) {
        catSearchFilter.addEventListener('input', debounce((e) => {
            const term = e.target.value.toLowerCase().trim();
            if (!term) {
                renderCategoriesFilter(allCategories);
            } else {
                const filtered = allCategories.filter(c => (c.name || '').toLowerCase().includes(term));
                renderCategoriesFilter(filtered);
            }
        }, 200));
    }

    // Clear category filter button
    const clearCatBtn = document.getElementById('clear-category-filter-btn');
    if (clearCatBtn) {
        clearCatBtn.addEventListener('click', async () => {
            selectedCategoryId = null;
            currentPage = 1;
            totalProducts = null;
            updatePageTitles();
            updateUrlParams();
            renderCategoriesFilter(allCategories);
            await loadProducts();
        });
    }

    // Filter Form submit (Price Range and Brands)
    const filterForm = document.getElementById('filter-form');
    if (filterForm) {
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const minInput = document.getElementById('price-min');
            const maxInput = document.getElementById('price-max');
            minPrice = minInput && minInput.value ? Number(minInput.value) : 0;
            maxPrice = maxInput && maxInput.value ? Number(maxInput.value) : Infinity;

            const selectedBrandRadio = filterForm.querySelector('input[name="brand"]:checked');
            selectedBrand = selectedBrandRadio ? selectedBrandRadio.value : '';

            applySortingAndRender();

            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('filter-sidebar');
                if (sidebar) sidebar.classList.remove('active');
            }
        });
    }

    // Sort Dropdown
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            sortOrder = e.target.value;
            updateUrlParams();
            applySortingAndRender();
        });
    }

    // Mobile filter sidebar toggle
    const toggleBtn = document.getElementById('filter-toggle-btn');
    const closeBtn = document.getElementById('filter-close-btn');
    const sidebar = document.getElementById('filter-sidebar');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.add('active');
            const header = document.querySelector('.filter-sidebar-header');
            if (header) header.style.display = 'flex';
        });
    }

    if (closeBtn && sidebar) {
        closeBtn.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
    }
}

// Progressive pagination is used since products count endpoint is not present in backend
async function loadProducts() {
    if (isLoading) return;
    isLoading = true;

    const resultsContainer = document.getElementById('search-results');
    const countLabel = document.getElementById('result-count-label');
    const searchCount = document.getElementById('search-count');
    const paginationContainer = document.getElementById('pagination-container');

    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--color-text-secondary);">
                <div style="font-size: 2.2rem; margin-bottom: 0.5rem; animation: pulse 1.2s infinite ease-in-out;">📦</div>
                <div>Loading products from catalog...</div>
            </div>
        `;
    }

    const offset = (currentPage - 1) * LIMIT;
    let url = `/products/?offset=${offset}&limit=${LIMIT}`;
    if (currentQuery) {
        url += `&q=${encodeURIComponent(currentQuery)}`;
    }
    if (selectedCategoryId) {
        url += `&category_id=${selectedCategoryId}`;
    }

    try {
        const data = await api.get(url);
        currentProducts = Array.isArray(data) ? data : [];

        // If totalProducts not returned from count endpoint, infer dynamically
        if (totalProducts === null) {
            if (currentProducts.length < LIMIT) {
                totalProducts = offset + currentProducts.length;
                totalPages = Math.max(1, Math.ceil(totalProducts / LIMIT));
            } else {
                totalPages = Math.max(currentPage + 1, totalPages);
            }
        } else {
            totalPages = Math.max(1, Math.ceil(totalProducts / LIMIT));
        }

        updateBrandFilter(currentProducts);
        updatePageTitles();
        applySortingAndRender();
        renderPagination();
        updateCountBadges(offset);
    } catch (err) {
        console.error('Failed to load products:', err);
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; background: var(--color-surface); border: 1px dashed var(--color-border); border-radius: var(--radius-lg);">
                    <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">⚠️</div>
                    <h3>Unable to load products</h3>
                    <p style="color: var(--color-text-secondary); margin-bottom: 1rem;">${escapeHtml(err.message || 'Server error occurred')}</p>
                    <button class="btn btn-primary btn-sm" id="retry-search-btn">Retry</button>
                </div>
            `;
            const retryBtn = document.getElementById('retry-search-btn');
            if (retryBtn) retryBtn.addEventListener('click', () => loadProducts());
        }
        if (countLabel) countLabel.textContent = 'Error loading results';
        if (searchCount) searchCount.textContent = '0 results found';
        if (paginationContainer) paginationContainer.innerHTML = '';
    } finally {
        isLoading = false;
    }
}

function updateBrandFilter(productsList) {
    const brandContainer = document.getElementById('filter-brands');
    if (!brandContainer) return;

    const brands = [...new Set(productsList.map(p => p.brand).filter(b => b && b !== 'None'))].sort();
    availableBrands = brands;

    if (brands.length === 0) {
        brandContainer.innerHTML = '<li style="color: var(--color-text-secondary); font-size: 0.85rem; padding: 4px;">No brands in this page</li>';
        return;
    }

    let html = `
        <li>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px 6px;">
                <input type="radio" name="brand" value="" ${!selectedBrand ? 'checked' : ''}> All Brands
            </label>
        </li>
    `;

    html += brands.map(b => `
        <li>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px 6px;">
                <input type="radio" name="brand" value="${escapeHtml(b)}" ${selectedBrand === b ? 'checked' : ''}>
                <span>${escapeHtml(b)}</span>
            </label>
        </li>
    `).join('');

    brandContainer.innerHTML = html;
}

function updateCountBadges(offset) {
    const searchCount = document.getElementById('search-count');
    const resultCountLabel = document.getElementById('result-count-label');

    const start = offset + 1;
    const end = offset + currentProducts.length;

    if (currentProducts.length === 0) {
        if (searchCount) searchCount.textContent = '0 products found';
        if (resultCountLabel) resultCountLabel.textContent = 'Showing 0 results';
        return;
    }

    if (totalProducts !== null) {
        if (searchCount) searchCount.textContent = `${totalProducts} products found`;
        if (resultCountLabel) resultCountLabel.textContent = `Showing ${start}–${end} of ${totalProducts} products (Page ${currentPage} of ${totalPages})`;
    } else {
        if (searchCount) searchCount.textContent = `${end}+ products found`;
        if (resultCountLabel) resultCountLabel.textContent = `Showing ${start}–${end} products (Page ${currentPage})`;
    }
}

function applySortingAndRender() {
    let items = [...currentProducts];

    // Filter by Brand if selected
    if (selectedBrand) {
        items = items.filter(p => p.brand === selectedBrand);
    }

    // Filter by Price range if specified
    if (minPrice > 0 || maxPrice < Infinity) {
        items = items.filter(p => {
            const price = p.our_deal ?? 0;
            return price >= minPrice && price <= maxPrice;
        });
    }

    // Apply Sorting
    if (sortOrder === 'price-low') {
        items.sort((a, b) => (a.our_deal ?? 0) - (b.our_deal ?? 0));
    } else if (sortOrder === 'price-high') {
        items.sort((a, b) => (b.our_deal ?? 0) - (a.our_deal ?? 0));
    } else if (sortOrder === 'rating') {
        items.sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
    } else if (sortOrder === 'name-asc') {
        items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortOrder === 'name-desc') {
        items.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    }

    const container = document.getElementById('search-results');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: var(--color-surface); border: 1px dashed var(--color-border); border-radius: var(--radius-lg);">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
                <h3>No matching products found</h3>
                <p style="color: var(--color-text-secondary); margin-bottom: 1rem;">
                    Try adjusting your filters, clearing the search query, or selecting a different category.
                </p>
                ${(currentQuery || selectedCategoryId || selectedBrand) ? `
                    <button class="btn btn-secondary btn-sm" id="reset-all-filters-btn">Reset All Filters</button>
                ` : ''}
            </div>
        `;
        const resetBtn = document.getElementById('reset-all-filters-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                currentQuery = '';
                selectedCategoryId = null;
                selectedBrand = '';
                minPrice = 0;
                maxPrice = Infinity;
                currentPage = 1;
                totalProducts = null;
                updatePageTitles();
                updateUrlParams();
                renderCategoriesFilter(allCategories);
                loadProducts();
            });
        }
        return;
    }

    renderProductGrid(items, '#search-results');
}

/**
 * Dynamic pagination component with ellipsis windowing
 */
function renderPagination() {
    const container = document.getElementById('pagination-container');
    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let buttonsHTML = '';

    const prevDisabled = currentPage === 1;
    buttonsHTML += `
        <button class="pagination-btn" id="pagination-prev" ${prevDisabled ? 'disabled' : ''} aria-label="Previous Page">
            ← Prev
        </button>
    `;

    const pagesToShow = getPageWindow(currentPage, totalPages);
    for (let i = 0; i < pagesToShow.length; i++) {
        const p = pagesToShow[i];
        if (p === '...') {
            buttonsHTML += `<span class="pagination-ellipsis">…</span>`;
        } else {
            const isActive = p === currentPage;
            buttonsHTML += `
                <button class="pagination-btn ${isActive ? 'active' : ''}" data-page="${p}" ${isActive ? 'aria-current="page"' : ''}>
                    ${p}
                </button>
            `;
        }
    }

    const nextDisabled = currentPage >= totalPages;
    buttonsHTML += `
        <button class="pagination-btn" id="pagination-next" ${nextDisabled ? 'disabled' : ''} aria-label="Next Page">
            Next →
        </button>
    `;

    container.innerHTML = buttonsHTML;

    const prevBtn = document.getElementById('pagination-prev');
    if (prevBtn && !prevDisabled) {
        prevBtn.addEventListener('click', () => changePage(currentPage - 1));
    }

    const nextBtn = document.getElementById('pagination-next');
    if (nextBtn && !nextDisabled) {
        nextBtn.addEventListener('click', () => changePage(currentPage + 1));
    }

    container.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            const pageNum = parseInt(btn.getAttribute('data-page'), 10);
            if (!isNaN(pageNum) && pageNum !== currentPage) {
                changePage(pageNum);
            }
        });
    });
}

function getPageWindow(current, total) {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = [];
    if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
    } else if (current >= total - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = total - 4; i <= total; i++) pages.push(i);
    } else {
        pages.push(1);
        pages.push('...');
        pages.push(current - 1);
        pages.push(current);
        pages.push(current + 1);
        pages.push('...');
        pages.push(total);
    }
    return pages;
}

function changePage(newPage) {
    if (newPage < 1 || (totalProducts !== null && newPage > totalPages)) return;
    currentPage = newPage;
    updateUrlParams();

    // Scroll smoothly to top of products section
    const target = document.querySelector('.main-content');
    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    loadProducts();
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
