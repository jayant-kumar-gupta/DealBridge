import { initAdminLayout } from '../../components/admin-layout.js';
import { products } from '../../data/products.js';
import { categories } from '../../data/categories.js';
import { formatPrice } from '../../utils/helpers.js';
import { showToast } from '../../components/toast.js';

let currentProducts = [...products];

document.addEventListener('DOMContentLoaded', () => {
    initAdminLayout();
    
    const tbody = document.getElementById('products-table-body');
    const searchInput = document.getElementById('product-search');
    const categoryFilter = document.getElementById('product-category-filter');
    const addBtn = document.getElementById('add-product-btn');

    // Populate category filter
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        categoryFilter.appendChild(option);
    });

    function renderTable() {
        if (!tbody) return;
        
        const searchTerm = searchInput.value.toLowerCase();
        const catId = categoryFilter.value;
        
        const filtered = currentProducts.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm) || p.brand.toLowerCase().includes(searchTerm);
            const matchesCat = catId ? p.categoryId == catId : true;
            return matchesSearch && matchesCat;
        });

        tbody.innerHTML = filtered.map(product => `
            <tr>
                <td>#${product.id}</td>
                <td><img src="${product.images[0]}" alt="${product.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;"></td>
                <td><strong>${product.name}</strong><br><small>${product.brand}</small></td>
                <td>${product.category}</td>
                <td>${formatPrice(product.ourPrice)}</td>
                <td>${product.discount}%</td>
                <td>
                    <span style="color: ${product.availability === 'in_stock' ? 'var(--color-success)' : 'var(--color-error)'}">
                        ${product.availability === 'in_stock' ? 'In Stock' : (product.availability === 'low_stock' ? 'Low Stock' : 'Out of Stock')}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-outline edit-btn" data-id="${product.id}">Edit</button>
                        <button class="btn btn-sm btn-outline delete-btn" data-id="${product.id}" style="color: var(--color-error); border-color: var(--color-error);">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Attach listeners
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                if (confirm('Are you sure you want to delete this product?')) {
                    currentProducts = currentProducts.filter(p => p.id !== id);
                    renderTable();
                    showToast('Product deleted successfully', 'success');
                }
            });
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                showToast('Edit product modal would open here.', 'info');
            });
        });
    }

    searchInput?.addEventListener('input', renderTable);
    categoryFilter?.addEventListener('change', renderTable);
    addBtn?.addEventListener('click', () => {
        showToast('Add product modal would open here.', 'info');
    });

    renderTable();
});
