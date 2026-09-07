import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { searchProducts, products } from '../data/products.js';
import { categories } from '../data/categories.js';
import { partners } from '../data/partners.js';
import { renderProductGrid } from '../components/product-card.js';

let currentQuery = '';
let searchResults = [];

document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initFooter();
    
    // Parse URL params
    const params = new URLSearchParams(window.location.search);
    currentQuery = params.get('q') || '';
    
    document.getElementById('breadcrumb-query').textContent = currentQuery;
    document.getElementById('page-title-query').textContent = currentQuery;
    
    // Initial Search
    searchResults = searchProducts(currentQuery);
    
    initFilters();
    setupEventListeners();
    applyFiltersAndSort();
});

function initFilters() {
    // Populate Categories
    const catContainer = document.getElementById('filter-categories');
    catContainer.innerHTML = categories.map(c => `
        <li><label><input type="checkbox" name="category" value="${c.id}"> ${c.name}</label></li>
    `).join('');
    
    // Populate Brands based on all products
    const brands = [...new Set(products.map(p => p.brand))].sort();
    const brandContainer = document.getElementById('filter-brands');
    brandContainer.innerHTML = brands.map(b => `
        <li><label><input type="checkbox" name="brand" value="${b}"> ${b}</label></li>
    `).join('');
    
    // Populate Partners
    const partnerContainer = document.getElementById('filter-partners');
    partnerContainer.innerHTML = partners.map(p => `
        <li><label><input type="checkbox" name="partner" value="${p.id}"> ${p.name}</label></li>
    `).join('');
}

function setupEventListeners() {
    document.getElementById('filter-form').addEventListener('submit', (e) => {
        e.preventDefault();
        applyFiltersAndSort();
        if (window.innerWidth <= 768) {
            document.getElementById('filter-sidebar').classList.remove('active');
        }
    });
    
    document.getElementById('sort-select').addEventListener('change', applyFiltersAndSort);
    
    // Mobile filter toggle
    document.getElementById('filter-toggle-btn').addEventListener('click', () => {
        document.getElementById('filter-sidebar').classList.add('active');
        document.querySelector('.filter-sidebar-header').style.display = 'flex';
    });
    
    document.getElementById('filter-close-btn').addEventListener('click', () => {
        document.getElementById('filter-sidebar').classList.remove('active');
    });
}

function applyFiltersAndSort() {
    let filtered = [...searchResults];
    
    // Form values
    const form = document.getElementById('filter-form');
    const formData = new FormData(form);
    
    const selectedCats = formData.getAll('category').map(Number);
    const selectedBrands = formData.getAll('brand');
    const selectedPartners = formData.getAll('partner').map(Number);
    const minPrice = Number(document.getElementById('price-min').value) || 0;
    const maxPrice = Number(document.getElementById('price-max').value) || Infinity;
    const discount = Number(formData.get('discount')) || 0;
    
    // Apply Filters
    if (selectedCats.length > 0) {
        filtered = filtered.filter(p => selectedCats.includes(p.categoryId));
    }
    if (selectedBrands.length > 0) {
        filtered = filtered.filter(p => selectedBrands.includes(p.brand));
    }
    if (selectedPartners.length > 0) {
        filtered = filtered.filter(p => p.partnerPrices.some(pp => selectedPartners.includes(pp.partnerId)));
    }
    filtered = filtered.filter(p => p.ourPrice >= minPrice && p.ourPrice <= maxPrice);
    if (discount > 0) {
        filtered = filtered.filter(p => p.discount >= discount);
    }
    
    // Apply Sort
    const sort = document.getElementById('sort-select').value;
    if (sort === 'price-low') {
        filtered.sort((a, b) => a.ourPrice - b.ourPrice);
    } else if (sort === 'price-high') {
        filtered.sort((a, b) => b.ourPrice - a.ourPrice);
    } else if (sort === 'discount') {
        filtered.sort((a, b) => b.discount - a.discount);
    } else if (sort === 'rating') {
        filtered.sort((a, b) => b.rating - a.rating);
    }
    
    // Render
    document.getElementById('search-count').textContent = `${filtered.length} results found`;
    document.getElementById('result-count-label').textContent = `Showing ${filtered.length} results`;
    renderProductGrid(filtered, '#search-results');
}
