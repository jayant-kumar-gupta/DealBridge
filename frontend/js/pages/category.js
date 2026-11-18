import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { renderProductGrid } from '../components/product-card.js';
import { api } from '../utils/api.js';
import { escapeHtml } from '../utils/helpers.js';

const LIMIT = 100; // Products per page (up to backend max limit)

let catId = null;
let currentCategory = null;
let currentPage = 1;
let totalProducts = null; // null if unknown, number if computed at end of pagination
let totalPages = 1;

let currentProducts = [];
let accumulatedBrands = new Set();
let selectedBrands = [];
let minPrice = 0;
let maxPrice = Infinity;
let sortOrder = 'relevance';
let dealsOnly = false;
let currentSearchQuery = '';
let isLoading = false;

document.addEventListener('DOMContentLoaded', async () => {
    initHeader();
    initFooter();
    
    // Parse URL params
    const params = new URLSearchParams(window.location.search);
    catId = Number(params.get('id'));
    
    if (!catId) {
        showCategoryNotFound();
        return;
    }

    const pageParam = parseInt(params.get('page'), 10);
    if (!isNaN(pageParam) && pageParam > 0) {
        currentPage = pageParam;
    }

    const dealsParam = params.get('deals') || params.get('deals_only') || params.get('discount_only');
    if (dealsParam === 'true' || dealsParam === '1') {
        dealsOnly = true;
        const dealsCheckbox = document.getElementById('category-deals-only');
        if (dealsCheckbox) dealsCheckbox.checked = true;
    }

    const queryParam = params.get('q');
    if (queryParam) {
        currentSearchQuery = queryParam.trim();
        const searchInput = document.getElementById('category-product-search');
        if (searchInput) searchInput.value = currentSearchQuery;
        const clearSearchBtn = document.getElementById('clear-category-search-btn');
        if (clearSearchBtn) clearSearchBtn.style.display = 'inline-block';
    }

    const sortParam = params.get('sort');
    if (sortParam) {
        sortOrder = sortParam;
    } else if (dealsOnly) {
        sortOrder = 'discount';
    }
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = sortOrder;

    const brandParam = params.get('brand');
    if (brandParam) {
        selectedBrands = brandParam.split(',').map(b => decodeURIComponent(b.trim())).filter(Boolean);
    }

    const minParam = parseFloat(params.get('min_price'));
    if (!isNaN(minParam) && minParam >= 0) {
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
    
    updateCategoryHeader();
    setupEventListeners();
    await loadProducts();
});

function updateCategoryHeader() {
    if (!currentCategory) return;

    const catName = currentCategory.name;
    const pageTitle = currentSearchQuery 
        ? `"${currentSearchQuery}" in ${catName} — DealBridge`
        : (dealsOnly ? `🔥 ${catName} Deals — DealBridge` : `${catName} — DealBridge`);
    document.title = pageTitle;

    if (document.getElementById('category-icon')) {
        document.getElementById('category-icon').textContent = currentCategory.icon || '📁';
    }
    if (document.getElementById('category-title')) {
        document.getElementById('category-title').textContent = dealsOnly ? `🔥 ${currentCategory.name} Deals` : currentCategory.name;
    }
    if (document.getElementById('category-desc')) {
        if (currentSearchQuery) {
            document.getElementById('category-desc').textContent = `Showing search results for "${currentSearchQuery}" in ${catName}`;
        } else if (dealsOnly) {
            document.getElementById('category-desc').textContent = `Exclusive discounted offers and maximum savings in ${catName}`;
        } else {
            document.getElementById('category-desc').textContent = currentCategory.description || `Browse great deals in ${catName}`;
        }
    }
    if (document.getElementById('breadcrumb-name')) {
        if (currentSearchQuery) {
            document.getElementById('breadcrumb-name').innerHTML = `
                <a href="/category.html?id=${catId}" class="text-link">${escapeHtml(catName)}</a> &gt; Search: "${escapeHtml(currentSearchQuery)}"
            `;
        } else if (dealsOnly) {
            document.getElementById('breadcrumb-name').innerHTML = `
                <a href="/category.html?id=${catId}" class="text-link">${escapeHtml(catName)}</a> &gt; Deals
            `;
        } else {
            document.getElementById('breadcrumb-name').textContent = catName;
        }
    }

    const headerSearchInput = document.querySelector('.header-search input[type="search"]');
    if (headerSearchInput) {
        headerSearchInput.placeholder = `Search within ${catName}...`;
        headerSearchInput.value = currentSearchQuery || '';
    }

    const inCategoryInput = document.getElementById('category-product-search');
    if (inCategoryInput && inCategoryInput.value !== currentSearchQuery) {
        inCategoryInput.value = currentSearchQuery || '';
    }
}

function showCategoryNotFound() {
    const heroH1 = document.querySelector('.category-hero h1');
    if (heroH1) heroH1.textContent = 'Category Not Found';
    const heroP = document.querySelector('.category-hero p');
    if (heroP) heroP.textContent = 'The category you are looking for does not exist.';
    const results = document.getElementById('category-results');
    if (results) {
        results.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: var(--color-surface); border: 1px dashed var(--color-border); border-radius: var(--radius-lg);">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📂</div>
                <h3>Category Not Found</h3>
                <p style="color: var(--color-text-secondary); margin-bottom: 1.5rem;">We couldn't find the requested category in the catalog.</p>
                <a href="/categories.html" class="btn btn-primary">Explore All Categories</a>
            </div>
        `;
    }
    const countLabel = document.getElementById('result-count-label');
    if (countLabel) countLabel.textContent = 'Category not found';
    const pagContainer = document.getElementById('pagination-container');
    if (pagContainer) pagContainer.innerHTML = '';
}

function updateUrlParams() {
    const url = new URL(window.location);
    url.searchParams.set('id', catId);

    if (currentSearchQuery) {
        url.searchParams.set('q', currentSearchQuery);
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

    if (selectedBrands.length > 0) {
        url.searchParams.set('brand', selectedBrands.map(b => encodeURIComponent(b)).join(','));
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

async function loadProducts() {
    if (isLoading) return;
    isLoading = true;

    const resultsContainer = document.getElementById('category-results');
    const countLabel = document.getElementById('result-count-label');
    const paginationContainer = document.getElementById('pagination-container');

    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--color-text-secondary);">
                <div style="font-size: 2.2rem; margin-bottom: 0.5rem; animation: pulse 1.2s infinite ease-in-out;">📦</div>
                <div>${currentSearchQuery ? `Searching products for "${escapeHtml(currentSearchQuery)}"...` : 'Loading products...'}</div>
            </div>
        `;
    }

    const offset = (currentPage - 1) * LIMIT;
    let url = `/products/?category_id=${catId}&offset=${offset}&limit=${LIMIT}`;
    if (currentSearchQuery) {
        url += `&q=${encodeURIComponent(currentSearchQuery)}`;
    }
    if (dealsOnly) {
        url += `&deals_only=true`;
    }
    if (selectedBrands.length > 0) {
        url += `&brand=${encodeURIComponent(selectedBrands.join(','))}`;
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

    try {
        const { data, totalCount } = await api.getWithMeta(url);
        currentProducts = Array.isArray(data) ? data : [];

        if (totalCount !== null) {
            totalProducts = totalCount;
            totalPages = Math.max(1, Math.ceil(totalProducts / LIMIT));
        } else if (currentProducts.length < LIMIT) {
            totalProducts = offset + currentProducts.length;
            totalPages = Math.max(1, Math.ceil(totalProducts / LIMIT));
        } else {
            totalProducts = null;
            totalPages = Math.max(currentPage + 1, totalPages);
        }

        // Add newly encountered brands to accumulated list
        currentProducts.forEach(p => {
            if (p.brand && p.brand !== 'None' && p.brand.trim() !== '') {
                accumulatedBrands.add(p.brand.trim());
            }
        });
        selectedBrands.forEach(b => accumulatedBrands.add(b));

        updateBrandFilter();
        renderCategoryResults();
        renderPagination();
        updateUrlParams();
    } catch (err) {
        console.error('Failed to load products for category:', err);
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; background: var(--color-surface); border: 1px dashed var(--color-border); border-radius: var(--radius-lg);">
                    <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">⚠️</div>
                    <h3>Unable to load products</h3>
                    <p style="color: var(--color-text-secondary); margin-bottom: 1rem;">${escapeHtml(err.message || 'Server error occurred')}</p>
                    <button class="btn btn-primary btn-sm" id="retry-category-btn">Retry</button>
                </div>
            `;
            const retryBtn = document.getElementById('retry-category-btn');
            if (retryBtn) retryBtn.addEventListener('click', () => loadProducts());
        }
        if (countLabel) countLabel.textContent = 'Error loading results';
        if (paginationContainer) paginationContainer.innerHTML = '';
    } finally {
        isLoading = false;
    }
}

function updateBrandFilter() {
    const brandContainer = document.getElementById('filter-brands');
    const clearBtn = document.getElementById('clear-brands-btn');
    if (!brandContainer) return;

    if (clearBtn) {
        clearBtn.style.display = selectedBrands.length > 0 ? 'inline-block' : 'none';
    }

    const sortedBrands = Array.from(accumulatedBrands).sort((a, b) => a.localeCompare(b));

    if (sortedBrands.length === 0) {
        brandContainer.innerHTML = '<li style="color: var(--color-text-secondary); font-size: 0.85rem; padding: 4px;">No brand filters available</li>';
        return;
    }

    brandContainer.innerHTML = sortedBrands.map(b => {
        const isChecked = selectedBrands.includes(b);
        const escapedBrand = escapeHtml(b);
        return `
            <li>
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px 6px; font-size: 0.88rem;">
                    <input type="checkbox" name="brand" value="${escapedBrand}" ${isChecked ? 'checked' : ''}>
                    <span>${escapedBrand}</span>
                </label>
            </li>
        `;
    }).join('');

    // Attach change handlers to brand checkboxes
    brandContainer.querySelectorAll('input[name="brand"]').forEach(checkbox => {
        checkbox.addEventListener('change', async () => {
            const checkedBoxes = Array.from(brandContainer.querySelectorAll('input[name="brand"]:checked'));
            selectedBrands = checkedBoxes.map(cb => cb.value);
            currentPage = 1;
            totalProducts = null;
            if (clearBtn) clearBtn.style.display = selectedBrands.length > 0 ? 'inline-block' : 'none';
            updateUrlParams();
            await loadProducts();
        });
    });
}

function setupEventListeners() {
    // In-Category Product Search
    const searchInput = document.getElementById('category-product-search');
    const searchBtn = document.getElementById('btn-category-search');
    const clearSearchBtn = document.getElementById('clear-category-search-btn');

    const executeCategorySearch = (newQuery) => {
        const query = (newQuery !== undefined ? newQuery : (searchInput?.value || '')).trim();
        currentSearchQuery = query;
        currentPage = 1;
        totalProducts = null;
        accumulatedBrands.clear();
        selectedBrands = [];

        if (searchInput) searchInput.value = currentSearchQuery;
        const headerSearchInput = document.querySelector('.header-search input[type="search"]');
        if (headerSearchInput) headerSearchInput.value = currentSearchQuery;

        if (clearSearchBtn) {
            clearSearchBtn.style.display = currentSearchQuery ? 'inline-block' : 'none';
        }
        updateCategoryHeader();
        updateUrlParams();
        loadProducts();
    };

    // Intercept header search form on category page to search within current category
    const headerSearchForm = document.querySelector('.header-search');
    if (headerSearchForm) {
        headerSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const headerInput = headerSearchForm.querySelector('input[type="search"]');
            const query = (headerInput?.value || '').trim();
            executeCategorySearch(query);
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', () => executeCategorySearch());
    }

    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                executeCategorySearch();
            }
        });
        searchInput.addEventListener('input', () => {
            if (clearSearchBtn) {
                clearSearchBtn.style.display = searchInput.value.trim() ? 'inline-block' : 'none';
            }
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            const headerSearchInput = document.querySelector('.header-search input[type="search"]');
            if (headerSearchInput) headerSearchInput.value = '';
            clearSearchBtn.style.display = 'none';
            currentSearchQuery = '';
            currentPage = 1;
            totalProducts = null;
            accumulatedBrands.clear();
            selectedBrands = [];
            updateCategoryHeader();
            updateUrlParams();
            loadProducts();
        });
    }

    // Filter Form submit (Price Range and Brands)
    const form = document.getElementById('filter-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const minInput = document.getElementById('price-min');
            const maxInput = document.getElementById('price-max');
            minPrice = minInput && minInput.value ? Number(minInput.value) : 0;
            maxPrice = maxInput && maxInput.value ? Number(maxInput.value) : Infinity;

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

    const clearBrandsBtn = document.getElementById('clear-brands-btn');
    if (clearBrandsBtn) {
        clearBrandsBtn.addEventListener('click', async () => {
            selectedBrands = [];
            currentPage = 1;
            totalProducts = null;
            const brandContainer = document.getElementById('filter-brands');
            if (brandContainer) {
                brandContainer.querySelectorAll('input[name="brand"]').forEach(cb => { cb.checked = false; });
            }
            clearBrandsBtn.style.display = 'none';
            updateUrlParams();
            await loadProducts();
        });
    }

    // Deals Only checkbox toggle
    const dealsCheckbox = document.getElementById('category-deals-only');
    if (dealsCheckbox) {
        dealsCheckbox.addEventListener('change', async () => {
            dealsOnly = dealsCheckbox.checked;
            currentPage = 1;
            totalProducts = null;
            if (dealsOnly && sortOrder === 'relevance') {
                sortOrder = 'discount';
                const sortSelect = document.getElementById('sort-select');
                if (sortSelect) sortSelect.value = sortOrder;
            }
            updateCategoryHeader();
            updateUrlParams();
            await loadProducts();
        });
    }

    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', async () => {
            selectedBrands = [];
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

            const brandContainer = document.getElementById('filter-brands');
            if (brandContainer) {
                brandContainer.querySelectorAll('input[name="brand"]').forEach(cb => { cb.checked = false; });
            }

            const clearBrandsBtn = document.getElementById('clear-brands-btn');
            if (clearBrandsBtn) clearBrandsBtn.style.display = 'none';

            if (dealsCheckbox) dealsCheckbox.checked = false;

            const sortSelect = document.getElementById('sort-select');
            if (sortSelect) sortSelect.value = 'relevance';

            updateCategoryHeader();
            updateUrlParams();
            await loadProducts();
        });
    }
    
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', async (e) => {
            sortOrder = e.target.value;
            currentPage = 1;
            updateUrlParams();
            await loadProducts();
        });
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

function renderCategoryResults() {
    const items = currentProducts;

    // Accurate Result Count Label
    const countLabel = document.getElementById('result-count-label');
    const catName = currentCategory ? currentCategory.name : 'Category';
    const offset = (currentPage - 1) * LIMIT;
    const start = items.length > 0 ? offset + 1 : 0;
    const end = offset + items.length;

    const isPriceFiltered = minPrice > 0 || maxPrice < Infinity;
    const isBrandFiltered = selectedBrands.length > 0;
    const isFilterActive = isPriceFiltered || isBrandFiltered || dealsOnly;

    if (countLabel) {
        if (items.length === 0) {
            if (isFilterActive) {
                countLabel.textContent = `No ${dealsOnly ? 'discounted deals' : 'products'} matching your filters in ${catName}`;
            } else if (currentSearchQuery) {
                countLabel.textContent = `No products found matching "${currentSearchQuery}" in ${catName}`;
            } else {
                countLabel.textContent = `No products found in ${catName}`;
            }
        } else if (totalProducts !== null) {
            const noun = dealsOnly ? (totalProducts === 1 ? 'discounted deal' : 'discounted deals') : (totalProducts === 1 ? 'product' : 'products');
            if (currentSearchQuery) {
                countLabel.textContent = `Showing ${start}–${end} of ${totalProducts} ${noun} for "${currentSearchQuery}" in ${catName} (Page ${currentPage} of ${totalPages})`;
            } else {
                countLabel.textContent = `Showing ${start}–${end} of ${totalProducts} ${noun} in ${catName} (Page ${currentPage} of ${totalPages})`;
            }
        } else {
            const hasMore = currentProducts.length === LIMIT;
            const noun = dealsOnly ? 'discounted deals' : 'products';
            if (currentSearchQuery) {
                countLabel.textContent = `Showing ${start}–${end}${hasMore ? '+' : ''} ${noun} for "${currentSearchQuery}" in ${catName} (Page ${currentPage})`;
            } else {
                countLabel.textContent = `Showing ${start}–${end}${hasMore ? '+' : ''} ${noun} in ${catName} (Page ${currentPage})`;
            }
        }
    }

    const container = document.getElementById('category-results');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: var(--color-surface); border: 1px dashed var(--color-border); border-radius: var(--radius-lg);">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
                <h3>No matching products</h3>
                <p style="color: var(--color-text-secondary); margin-bottom: 1.5rem;">
                    ${isFilterActive 
                        ? 'No products matched your selected brand, deal, or price filters.' 
                        : (currentSearchQuery ? `No products found matching "${escapeHtml(currentSearchQuery)}" in this category.` : 'No products found.')}
                </p>
                <div style="display: flex; gap: var(--spacing-sm); justify-content: center; flex-wrap: wrap;">
                    ${isFilterActive ? '<button type="button" class="btn btn-primary btn-sm" id="reset-page-filters-btn">Reset Filters</button>' : ''}
                    ${currentSearchQuery ? '<button type="button" class="btn btn-outline btn-sm" id="clear-page-search-btn">Clear Search</button>' : ''}
                    ${currentPage > 1 ? '<button type="button" class="btn btn-ghost btn-sm" id="goto-page-1-btn">&larr; Back to Page 1</button>' : ''}
                </div>
            </div>
        `;

        const resetBtn = document.getElementById('reset-page-filters-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                const resetAllBtn = document.getElementById('reset-filters-btn');
                if (resetAllBtn) resetAllBtn.click();
            });
        }

        const clearSearchInEmpty = document.getElementById('clear-page-search-btn');
        if (clearSearchInEmpty) {
            clearSearchInEmpty.addEventListener('click', () => {
                const clearSearchBtn = document.getElementById('clear-category-search-btn');
                if (clearSearchBtn) clearSearchBtn.click();
            });
        }

        const page1Btn = document.getElementById('goto-page-1-btn');
        if (page1Btn) {
            page1Btn.addEventListener('click', () => {
                currentPage = 1;
                loadProducts();
            });
        }
        return;
    }

    renderProductGrid(items, '#category-results');
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

    // Previous Button
    const prevDisabled = currentPage <= 1;
    buttonsHTML += `
        <button class="pagination-btn pagination-prev" data-page="${currentPage - 1}" ${prevDisabled ? 'disabled' : ''} aria-label="Previous Page">
            &larr; Prev
        </button>
    `;

    // Windowed Page Numbers
    const pageWindow = getPaginationPages(currentPage, totalPages);
    for (const p of pageWindow) {
        if (p === '...') {
            buttonsHTML += `<span class="pagination-ellipsis">&hellip;</span>`;
        } else {
            const isActive = p === currentPage;
            buttonsHTML += `
                <button class="pagination-btn ${isActive ? 'active' : ''}" data-page="${p}" ${isActive ? 'disabled aria-current="page"' : ''}>
                    ${p}
                </button>
            `;
        }
    }

    // Next Button
    const nextDisabled = (totalProducts !== null && currentPage >= totalPages) || (currentProducts.length < LIMIT);
    buttonsHTML += `
        <button class="pagination-btn pagination-next" data-page="${currentPage + 1}" ${nextDisabled ? 'disabled' : ''} aria-label="Next Page">
            Next &rarr;
        </button>
    `;

    container.innerHTML = buttonsHTML;

    // Attach click events
    container.querySelectorAll('.pagination-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const targetPage = parseInt(e.currentTarget.dataset.page, 10);
            if (!isNaN(targetPage) && targetPage > 0 && targetPage !== currentPage) {
                currentPage = targetPage;
                await loadProducts();
                const mainContent = document.querySelector('.main-content');
                if (mainContent) {
                    mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });
}

/**
 * Computes the page numbers array to display with ellipsis windowing
 */
function getPaginationPages(current, total) {
    if (total <= 7) {
        const pages = [];
        for (let i = 1; i <= total; i++) pages.push(i);
        return pages;
    }

    if (current <= 4) {
        return [1, 2, 3, 4, 5, '...', total];
    }

    if (current >= total - 3) {
        return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }

    return [1, '...', current - 1, current, current + 1, '...', total];
}
