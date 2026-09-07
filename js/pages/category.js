import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { getProductsByCategory, products } from '../data/products.js';
import { categories } from '../data/categories.js';
import { partners } from '../data/partners.js';
import { renderProductGrid } from '../components/product-card.js';

let currentCategory = null;
let categoryProducts = [];

document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initFooter();
    
    // Parse URL params
    const params = new URLSearchParams(window.location.search);
    const catId = Number(params.get('id'));
    
    currentCategory = categories.find(c => c.id === catId);
    if (!currentCategory) {
        document.querySelector('.category-hero h1').textContent = 'Category Not Found';
        document.querySelector('.category-hero p').textContent = 'The category you are looking for does not exist.';
        document.getElementById('category-results').innerHTML = '<div class="empty-state"><h3>No products found.</h3></div>';
        return;
    }
    
    // Update Header
    document.title = `${currentCategory.name} — DealBridge`;
    document.getElementById('category-icon').textContent = currentCategory.icon;
    document.getElementById('category-title').textContent = currentCategory.name;
    document.getElementById('category-desc').textContent = currentCategory.description;
    document.getElementById('breadcrumb-name').textContent = currentCategory.name;
    
    // Get Products
    categoryProducts = getProductsByCategory(catId);
    
    initFilters();
    setupEventListeners();
    applyFiltersAndSort();
});

function initFilters() {
    // Populate Brands based on category products
    const brands = [...new Set(categoryProducts.map(p => p.brand))].sort();
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
    const form = document.getElementById('filter-form');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
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
    let filtered = [...categoryProducts];
    
    // Form values
    const form = document.getElementById('filter-form');
    const formData = new FormData(form);
    
    const selectedBrands = formData.getAll('brand');
    const selectedPartners = formData.getAll('partner').map(Number);
    const minPrice = Number(document.getElementById('price-min').value) || 0;
    const maxPrice = Number(document.getElementById('price-max').value) || Infinity;
    const discount = Number(formData.get('discount')) || 0;
    
    // Apply Filters
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
    document.getElementById('result-count-label').textContent = `Showing ${filtered.length} products in ${currentCategory.name}`;
    renderProductGrid(filtered, '#category-results');
}
