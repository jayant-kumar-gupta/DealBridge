import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { renderProductGrid } from '../components/product-card.js';
import { api } from '../utils/api.js';
import { debounce, escapeHtml } from '../utils/helpers.js';

const LIMIT = 100; // Products per page (up to backend max limit)

let currentQuery = '';
let selectedCategoryId = null;
let selectedBrand = '';
let minPrice = 0;
let maxPrice = Infinity;
let sortOrder = 'relevance';
let dealsOnly = false;

let currentPage = 1;
let totalProducts = null; // From X-Total-Count header
let totalPages = 1;
let currentProducts = [];
let allCategories = [];
let accumulatedBrands = new Set();
let isLoading = false;

document.addEventListener('DOMContentLoaded', async () => {
    initHeader();
    initFooter();

    // Parse URL query parameters
    const params = new URLSearchParams(window.location.search);
    currentQuery = (params.get('q') || '').trim();

    const dealsParam = params.get('deals') || params.get('deals_only') || params.get('discount_only');
    if (dealsParam === 'true' || dealsParam === '1') {
        dealsOnly = true;
        const dealsCheckbox = document.getElementById('filter-deals-only');
        if (dealsCheckbox) dealsCheckbox.checked = true;
    }

    const catParam = params.get('category_id') || params.get('category');
    if (catParam) {
        const parsedCat = parseInt(catParam, 10);
        if (!isNaN(parsedCat)) selectedCategoryId = parsedCat;
    }

    const brandParam = params.get('brand');
    if (brandParam) {
        selectedBrand = brandParam.trim();
    }

    const minParam = parseFloat(params.get('min_price'));
    if (!isNaN(minParam) && minParam > 0) {
        minPrice = minParam;
        const minInput = document.getElementById('price-min');
        if (minInput) minInput.value = minPrice;
    }

    const maxParam = parseFloat(params.get('max_price'));
    if (!isNaN(maxParam) && maxParam > 0) {
        maxPrice = maxParam;
        const maxInput = document.getElementById('price-max');
        if (maxInput) maxInput.value = maxPrice;
    }

    const pageParam = parseInt(params.get('page'), 10);
    if (!isNaN(pageParam) && pageParam > 0) {
        currentPage = pageParam;
    }

    const sortParam = params.get('sort');
    if (sortParam) {
        sortOrder = sortParam;
    } else if (dealsOnly) {
        sortOrder = 'discount';
    }

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = sortOrder;

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
        if (input.id !== 'category-search-filter') {
            input.value = currentQuery;
        }
    });

    const inpageClearBtn = document.getElementById('inpage-clear-search-btn');
    if (inpageClearBtn) {
        inpageClearBtn.style.display = currentQuery ? 'inline-block' : 'none';
    }
}

function updatePageTitles() {
    let titleContext = dealsOnly ? '🔥 Biggest Price Drops' : 'All Products';
    const cat = selectedCategoryId ? allCategories.find(c => c.id === selectedCategoryId) : null;
    const catName = cat ? cat.name : 'Category';

    const searchPageTitle = document.getElementById('search-page-title');

    if (currentQuery && selectedCategoryId) {
        titleContext = dealsOnly ? `"${currentQuery}" Deals in ${catName}` : `"${currentQuery}" in ${catName}`;
        if (searchPageTitle) searchPageTitle.innerHTML = `Search Results for "<span id="page-title-query">${escapeHtml(currentQuery)}</span>" ${dealsOnly ? 'Deals ' : ''}in ${escapeHtml(catName)}`;
    } else if (currentQuery) {
        titleContext = dealsOnly ? `"${currentQuery}" Deals` : `"${currentQuery}"`;
        if (searchPageTitle) searchPageTitle.innerHTML = `Search Results for "<span id="page-title-query">${escapeHtml(currentQuery)}</span>"${dealsOnly ? ' (Deals Only)' : ''}`;
    } else if (selectedCategoryId) {
        titleContext = dealsOnly ? `🔥 Biggest Price Drops in ${catName}` : catName;
        if (searchPageTitle) searchPageTitle.innerHTML = dealsOnly ? `🔥 Biggest Price Drops in ${escapeHtml(catName)}` : `Products in ${escapeHtml(catName)}`;
    } else {
        titleContext = dealsOnly ? '🔥 Biggest Price Drops' : 'Explore All Products';
        if (searchPageTitle) searchPageTitle.innerHTML = dealsOnly ? '🔥 Biggest Price Drops' : 'Explore All Products';
    }

    const breadcrumbQuery = document.getElementById('breadcrumb-query');
    if (breadcrumbQuery) breadcrumbQuery.textContent = titleContext;

    document.title = `${titleContext} — DealBridge`;
}

function updateUrlParams() {
    const url = new URL(window.location);
    if (currentQuery) {
        url.searchParams.set('q', currentQuery);
    } else {
        url.searchParams.delete('q');
    }

    if (dealsOnly) {
        url.searchParams.set('deals', 'true');
    } else {
        url.searchParams.delete('deals');
        url.searchParams.delete('deals_only');
        url.searchParams.delete('discount_only');
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

    if (selectedBrand) {
        url.searchParams.set('brand', selectedBrand);
    } else {
        url.searchParams.delete('brand');
    }

    if (minPrice > 0) {
        url.searchParams.set('min_price', minPrice);
    } else {
        url.searchParams.delete('min_price');
    }

    if (maxPrice < Infinity) {
        url.searchParams.set('max_price', maxPrice);
    } else {
        url.searchParams.delete('max_price');
    }

    window.history.replaceState({}, '', url);
}

/**
 * Loads all categories in a single request to populate the categories sidebar
 */
async function loadAllCategories() {
    const catContainer = document.getElementById('filter-categories');
    if (catContainer) {
        catContainer.innerHTML = '<li style="color: var(--color-text-secondary); font-size: 0.82rem; padding: 6px;">Loading categories...</li>';
    }

    try {
        const combined = await api.get('/categories/?limit=500');
        const list = Array.isArray(combined) ? combined : [];
        // Deduplicate by ID
        const seen = new Set();
        allCategories = [];
        for (const cat of list) {
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
            selectedBrand = '';
            accumulatedBrands.clear();
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
            selectedBrand = '';
            accumulatedBrands.clear();
            currentPage = 1;
            totalProducts = null;
            updatePageTitles();
            updateUrlParams();
            renderCategoriesFilter(allCategories);
            await loadProducts();
        });
    }

    // Deals Only checkbox toggle
    const dealsCheckbox = document.getElementById('filter-deals-only');
    if (dealsCheckbox) {
        dealsCheckbox.addEventListener('change', async (e) => {
            dealsOnly = e.target.checked;
            accumulatedBrands.clear();
            currentPage = 1;
            totalProducts = null;
            if (dealsOnly && sortOrder === 'relevance') {
                sortOrder = 'discount';
                const sortSelect = document.getElementById('sort-select');
                if (sortSelect) sortSelect.value = sortOrder;
            }
            updatePageTitles();
            updateUrlParams();
            await loadProducts();
        });
    }

    // Filter Form submit (Price Range and Brands)
    const filterForm = document.getElementById('filter-form');
    if (filterForm) {
        filterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const minInput = document.getElementById('price-min');
            const maxInput = document.getElementById('price-max');
            minPrice = minInput && minInput.value ? Number(minInput.value) : 0;
            maxPrice = maxInput && maxInput.value ? Number(maxInput.value) : Infinity;

            const selectedBrandRadio = filterForm.querySelector('input[name="brand"]:checked');
            selectedBrand = selectedBrandRadio ? selectedBrandRadio.value : '';

            currentPage = 1;
            totalProducts = null;
            updateUrlParams();

            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('filter-sidebar');
                if (sidebar) sidebar.classList.remove('active');
            }

            await loadProducts();
        });
    }

    // Reset Filters Button
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', async () => {
            selectedCategoryId = null;
            selectedBrand = '';
            accumulatedBrands.clear();
            minPrice = 0;
            maxPrice = Infinity;
            dealsOnly = false;
            sortOrder = 'relevance';
            currentPage = 1;
            totalProducts = null;

            const minInput = document.getElementById('price-min');
            if (minInput) minInput.value = '';
            const maxInput = document.getElementById('price-max');
            if (maxInput) maxInput.value = '';

            const brandRadios = document.querySelectorAll('input[name="brand"]');
            brandRadios.forEach(r => { r.checked = r.value === ''; });

            if (dealsCheckbox) dealsCheckbox.checked = false;

            const sortSelect = document.getElementById('sort-select');
            if (sortSelect) sortSelect.value = 'relevance';

            renderCategoriesFilter(allCategories);
            updatePageTitles();
            updateUrlParams();
            await loadProducts();
        });
    }

    // Sort Dropdown
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', async (e) => {
            sortOrder = e.target.value;
            currentPage = 1;
            updateUrlParams();
            await loadProducts();
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

    // In-Page Product Search
    const inpageSearch = document.getElementById('inpage-product-search');
    const inpageSubmit = document.getElementById('inpage-search-submit');
    const inpageClearBtn = document.getElementById('inpage-clear-search-btn');

    const executeInpageSearch = (newQuery) => {
        const query = (newQuery !== undefined ? newQuery : (inpageSearch?.value || '')).trim();
        currentQuery = query;
        selectedBrand = '';
        accumulatedBrands.clear();
        currentPage = 1;
        totalProducts = null;
        if (inpageSearch) inpageSearch.value = currentQuery;
        updateHeaderSearchInputs();
        updatePageTitles();
        updateUrlParams();
        loadProducts();
    };

    // Intercept header search form on search page to update query smoothly
    const headerForm = document.querySelector('.header-search');
    if (headerForm) {
        headerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const headerInput = headerForm.querySelector('input[type="search"]');
            const query = (headerInput?.value || '').trim();
            executeInpageSearch(query);
        });
    }

    if (inpageSubmit) {
        inpageSubmit.addEventListener('click', () => executeInpageSearch());
    }

    if (inpageSearch) {
        inpageSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                executeInpageSearch();
            }
        });
        inpageSearch.addEventListener('input', () => {
            if (inpageClearBtn) {
                inpageClearBtn.style.display = inpageSearch.value.trim() ? 'inline-block' : 'none';
            }
        });
    }

    if (inpageClearBtn) {
        inpageClearBtn.addEventListener('click', () => {
            if (inpageSearch) inpageSearch.value = '';
            inpageClearBtn.style.display = 'none';
            currentQuery = '';
            selectedBrand = '';
            accumulatedBrands.clear();
            currentPage = 1;
            totalProducts = null;
            updateHeaderSearchInputs();
            updatePageTitles();
            updateUrlParams();
            loadProducts();
        });
    }
}

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
                <div>${dealsOnly ? 'Loading best discounted deals...' : 'Loading products from catalog...'}</div>
            </div>
        `;
    }

    try {
        const offset = (currentPage - 1) * LIMIT;
        let url = `/products/?offset=${offset}&limit=${LIMIT}`;
        if (currentQuery) {
            url += `&q=${encodeURIComponent(currentQuery)}`;
        }
        if (selectedCategoryId) {
            url += `&category_id=${selectedCategoryId}`;
        }
        if (dealsOnly) {
            url += `&deals_only=true`;
        }
        if (selectedBrand) {
            url += `&brand=${encodeURIComponent(selectedBrand)}`;
        }
        if (minPrice > 0) {
            url += `&min_price=${minPrice}`;
        }
        if (maxPrice < Infinity) {
            url += `&max_price=${maxPrice}`;
        }
        if (sortOrder && sortOrder !== 'relevance') {
            url += `&sort_by=${encodeURIComponent(sortOrder)}`;
        }

        const { data, totalCount } = await api.getWithMeta(url);
        const fetchedProducts = Array.isArray(data) ? data : [];

        if (totalCount !== null) {
            totalProducts = totalCount;
            totalPages = Math.max(1, Math.ceil(totalProducts / LIMIT));
        } else if (fetchedProducts.length < LIMIT) {
            totalProducts = offset + fetchedProducts.length;
            totalPages = Math.max(1, Math.ceil(totalProducts / LIMIT));
        } else {
            totalProducts = null;
            totalPages = Math.max(currentPage + 1, totalPages);
        }

        currentProducts = fetchedProducts;
        updateBrandFilter(currentProducts);
        updatePageTitles();
        renderSearchResults();
        renderPagination();
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

    productsList.forEach(p => {
        if (p.brand && p.brand !== 'None' && p.brand.trim() !== '') {
            accumulatedBrands.add(p.brand.trim());
        }
    });
    if (selectedBrand) {
        accumulatedBrands.add(selectedBrand);
    }

    const brands = Array.from(accumulatedBrands).sort((a, b) => a.localeCompare(b));

    if (brands.length === 0) {
        brandContainer.innerHTML = '<li style="color: var(--color-text-secondary); font-size: 0.85rem; padding: 4px;">No brands available</li>';
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

function updateCountBadges(offset, itemsLength) {
    const searchCount = document.getElementById('search-count');
    const resultCountLabel = document.getElementById('result-count-label');

    const isPriceFiltered = minPrice > 0 || maxPrice < Infinity;
    const isBrandFiltered = selectedBrand !== '';
    const isFilterActive = isPriceFiltered || isBrandFiltered;

    const actualCount = (itemsLength !== undefined) ? itemsLength : currentProducts.length;
    const start = actualCount > 0 ? offset + 1 : 0;
    const end = offset + actualCount;

    const itemLabel = dealsOnly ? 'discounted deal' : 'product';
    const itemsLabel = dealsOnly ? 'discounted deals' : 'products';

    if (actualCount === 0) {
        if (isFilterActive) {
            if (searchCount) searchCount.textContent = `0 matching ${itemsLabel}`;
            if (resultCountLabel) resultCountLabel.textContent = `No ${itemsLabel} match your filters`;
        } else if (currentQuery) {
            if (searchCount) searchCount.textContent = `0 ${itemsLabel} found`;
            if (resultCountLabel) resultCountLabel.textContent = `No ${itemsLabel} found for "${currentQuery}"`;
        } else {
            if (searchCount) searchCount.textContent = `0 ${itemsLabel} found`;
            if (resultCountLabel) resultCountLabel.textContent = 'Showing 0 results';
        }
        return;
    }

    if (totalProducts !== null) {
        const displayLabel = totalProducts === 1 ? itemLabel : itemsLabel;
        if (searchCount) searchCount.textContent = `${totalProducts} ${displayLabel} found`;
        if (resultCountLabel) resultCountLabel.textContent = `Showing ${start}–${end} of ${totalProducts} ${displayLabel} (Page ${currentPage} of ${totalPages})`;
    } else {
        const hasMore = currentProducts.length === LIMIT;
        if (searchCount) searchCount.textContent = `${end}${hasMore ? '+' : ''} ${itemsLabel} found`;
        if (resultCountLabel) resultCountLabel.textContent = `Showing ${start}–${end}${hasMore ? '+' : ''} ${itemsLabel} (Page ${currentPage})`;
    }
}

function renderSearchResults() {
    const items = currentProducts;

    // Update count badges with exact count from server
    const offset = (currentPage - 1) * LIMIT;
    updateCountBadges(offset, items.length);

    const container = document.getElementById('search-results');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: var(--color-surface); border: 1px dashed var(--color-border); border-radius: var(--radius-lg);">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
                <h3>No matching ${dealsOnly ? 'discounted deals' : 'products'} found</h3>
                <p style="color: var(--color-text-secondary); margin-bottom: 1rem;">
                    ${dealsOnly 
                        ? 'No discounted deals matched your current filters or query. Try adjusting filters or viewing all products.' 
                        : 'Try adjusting your filters, clearing the search query, or selecting a different category.'}
                </p>
                ${(currentQuery || selectedCategoryId || selectedBrand || minPrice > 0 || maxPrice < Infinity || dealsOnly) ? `
                    <button class="btn btn-secondary btn-sm" id="reset-all-filters-btn">Reset All Filters</button>
                ` : ''}
            </div>
        `;
        const resetBtn = document.getElementById('reset-all-filters-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                const sidebarReset = document.getElementById('reset-filters-btn');
                if (sidebarReset) {
                    sidebarReset.click();
                } else {
                    currentQuery = '';
                    selectedCategoryId = null;
                    selectedBrand = '';
                    accumulatedBrands.clear();
                    minPrice = 0;
                    maxPrice = Infinity;
                    dealsOnly = false;
                    sortOrder = 'relevance';
                    currentPage = 1;
                    totalProducts = null;
                    updateHeaderSearchInputs();
                    updatePageTitles();
                    updateUrlParams();
                    renderCategoriesFilter(allCategories);
                    loadProducts();
                }
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
