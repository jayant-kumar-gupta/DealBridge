import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { api } from '../utils/api.js';
import { debounce } from '../utils/helpers.js';

const LIMIT = 50;

let currentPage = 1;
let totalCategories = null; // null if unknown, number if known
let totalPages = 1;
let searchQuery = '';
let sortOrder = 'name-asc';
let currentCategories = [];
let isLoading = false;

document.addEventListener('DOMContentLoaded', async () => {
    initHeader();
    initFooter();
    setupEventListeners();

    // Check URL parameters (e.g. ?page=2&q=electronics)
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = parseInt(urlParams.get('page'), 10);
    if (!isNaN(pageParam) && pageParam > 0) {
        currentPage = pageParam;
    }
    const qParam = urlParams.get('q');
    if (qParam) {
        searchQuery = qParam.trim();
        const searchInput = document.getElementById('category-search');
        if (searchInput) searchInput.value = searchQuery;
    }

    await loadCategories();
});

function setupEventListeners() {
    const searchInput = document.getElementById('category-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(async (e) => {
            searchQuery = e.target.value.trim();
            currentPage = 1;
            totalCategories = null; // Reset total count on new search
            updateUrlParams();
            await loadCategories();
        }, 300));
    }

    const sortSelect = document.getElementById('category-sort');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            sortOrder = e.target.value;
            applyClientSortAndRender();
        });
    }
}

function updateUrlParams() {
    const url = new URL(window.location);
    if (currentPage > 1) {
        url.searchParams.set('page', currentPage);
    } else {
        url.searchParams.delete('page');
    }
    if (searchQuery) {
        url.searchParams.set('q', searchQuery);
    } else {
        url.searchParams.delete('q');
    }
    window.history.replaceState({}, '', url);
}

/**
 * Attempts to retrieve the total count of categories from backend
 * If GET /categories/count exists, uses it; otherwise infers total from pagination boundaries.
 */
async function fetchTotalCategoriesCount() {
    try {
        let countUrl = '/categories/count';
        if (searchQuery) {
            countUrl += `?name=${encodeURIComponent(searchQuery)}`;
        }
        const res = await api.get(countUrl);
        if (res && typeof (res.count ?? res.total) === 'number') {
            totalCategories = res.count ?? res.total;
            totalPages = Math.max(1, Math.ceil(totalCategories / LIMIT));
            return;
        }
    } catch {
        // Backend count endpoint not yet defined, infer dynamically below
    }
}

async function loadCategories() {
    if (isLoading) return;
    isLoading = true;

    const grid = document.getElementById('categories-grid');
    const indicator = document.getElementById('categories-count-indicator');
    const paginationContainer = document.getElementById('pagination-container');

    if (grid) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--color-text-secondary);">
                <div style="font-size: 2rem; margin-bottom: 0.5rem; animation: pulse 1.2s infinite ease-in-out;">📁</div>
                <div>Loading categories from database...</div>
            </div>
        `;
    }

    if (indicator) {
        indicator.textContent = 'Loading categories...';
    }

    // Try fetching total count if unknown
    if (totalCategories === null) {
        await fetchTotalCategoriesCount();
    }

    const offset = (currentPage - 1) * LIMIT;
    let url = `/categories/?offset=${offset}&limit=${LIMIT}`;
    if (searchQuery) {
        url += `&name=${encodeURIComponent(searchQuery)}`;
    }

    try {
        const data = await api.get(url);
        currentCategories = Array.isArray(data) ? data : [];

        // If totalCategories was not provided by count endpoint, infer dynamically
        if (totalCategories === null) {
            if (currentCategories.length < LIMIT) {
                // We reached the last page!
                totalCategories = offset + currentCategories.length;
                totalPages = Math.max(1, Math.ceil(totalCategories / LIMIT));
            } else {
                // There are at least (offset + 51) items
                // Give a conservative dynamic page estimate that updates as user browses
                totalPages = Math.max(currentPage + 1, totalPages);
            }
        } else {
            totalPages = Math.max(1, Math.ceil(totalCategories / LIMIT));
        }

        applyClientSortAndRender();
        renderPagination();
        updateCountIndicator();
    } catch (err) {
        console.error('Failed to load categories:', err);
        if (grid) {
            grid.innerHTML = `
                <div class="categories-empty-state">
                    <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">⚠️</div>
                    <h3>Unable to load categories</h3>
                    <p style="color: var(--color-text-secondary); margin-bottom: 1rem;">${err.message || 'Server error occurred'}</p>
                    <button class="btn btn-primary btn-sm" id="retry-btn">Retry</button>
                </div>
            `;
            const retryBtn = document.getElementById('retry-btn');
            if (retryBtn) retryBtn.addEventListener('click', () => loadCategories());
        }
        if (indicator) indicator.textContent = 'Error loading categories';
        if (paginationContainer) paginationContainer.innerHTML = '';
    } finally {
        isLoading = false;
    }
}

function updateCountIndicator() {
    const indicator = document.getElementById('categories-count-indicator');
    if (!indicator) return;

    if (currentCategories.length === 0) {
        indicator.textContent = '0 categories found';
        return;
    }

    const start = (currentPage - 1) * LIMIT + 1;
    const end = (currentPage - 1) * LIMIT + currentCategories.length;

    if (totalCategories !== null) {
        indicator.textContent = `Showing ${start}–${end} of ${totalCategories} categories (Page ${currentPage} of ${totalPages})`;
    } else {
        indicator.textContent = `Showing ${start}–${end} categories (Page ${currentPage})`;
    }
}

function applyClientSortAndRender() {
    const grid = document.getElementById('categories-grid');
    if (!grid) return;

    if (currentCategories.length === 0) {
        grid.innerHTML = `
            <div class="categories-empty-state">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
                <h3>No categories found</h3>
                <p style="color: var(--color-text-secondary); margin-bottom: 1rem;">
                    ${searchQuery ? `No categories match "${searchQuery}". Try a different keyword.` : 'No categories available in the database.'}
                </p>
                ${searchQuery ? '<button class="btn btn-secondary btn-sm" id="clear-search-btn">Clear Search</button>' : ''}
            </div>
        `;
        const clearBtn = document.getElementById('clear-search-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const searchInput = document.getElementById('category-search');
                if (searchInput) searchInput.value = '';
                searchQuery = '';
                currentPage = 1;
                totalCategories = null;
                updateUrlParams();
                loadCategories();
            });
        }
        return;
    }

    // Sort current page items
    const sorted = [...currentCategories].sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        if (sortOrder === 'name-asc') return nameA.localeCompare(nameB);
        if (sortOrder === 'name-desc') return nameB.localeCompare(nameA);
        if (sortOrder === 'id-asc') return (a.id || 0) - (b.id || 0);
        if (sortOrder === 'id-desc') return (b.id || 0) - (a.id || 0);
        return 0;
    });

    grid.innerHTML = sorted.map(cat => {
        const icon = cat.icon || '📁';
        const name = cat.name || 'Category';
        const desc = cat.description ? `<p class="category-item-desc">${escapeHtml(cat.description)}</p>` : '';

        return `
            <a href="/category.html?id=${cat.id}" class="category-item-card">
                <div class="category-item-icon">${icon}</div>
                <h3 class="category-item-name">${escapeHtml(name)}</h3>
                ${desc}
            </a>
        `;
    }).join('');
}

/**
 * Renders pagination buttons dynamically based on totalPages and currentPage
 */
function renderPagination() {
    const container = document.getElementById('pagination-container');
    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let buttonsHTML = '';

    // "Previous" button
    const prevDisabled = currentPage === 1;
    buttonsHTML += `
        <button class="pagination-btn" id="pagination-prev" ${prevDisabled ? 'disabled' : ''} aria-label="Previous Page">
            ← Prev
        </button>
    `;

    // Calculate visible page range (e.g. 1, 2, 3 ... 5)
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

    // "Next" button
    const nextDisabled = currentPage >= totalPages;
    buttonsHTML += `
        <button class="pagination-btn" id="pagination-next" ${nextDisabled ? 'disabled' : ''} aria-label="Next Page">
            Next →
        </button>
    `;

    container.innerHTML = buttonsHTML;

    // Attach click events
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

/**
 * Computes window of page numbers with ellipsis (e.g. [1, 2, 3, 4, '...', 10])
 */
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
    if (newPage < 1 || (totalCategories !== null && newPage > totalPages)) return;
    currentPage = newPage;
    updateUrlParams();

    // Scroll smoothly to top of grid
    const target = document.querySelector('.categories-controls-bar');
    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    loadCategories();
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
