import { initAdminLayout } from '../../components/admin-layout.js';
import { api } from '../../utils/api.js';
import { showModal, closeModal } from '../../components/modal.js';
import { showToast } from '../../components/toast.js';
import { formatPrice } from '../../utils/helpers.js';

let products = [];
let categories = [];
let partnerPrices = [];
let searchQuery = '';
let selectedCategory = '';

document.addEventListener('DOMContentLoaded', async () => {
    initAdminLayout();
    setupEvents();
    await loadData();
});

function setupEvents() {
    const addBtn = document.getElementById('add-product-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => openProductModal(null));
    }

    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderTable();
        });
    }

    const categoryFilter = document.getElementById('product-category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            selectedCategory = e.target.value;
            renderTable();
        });
    }
}

async function loadData() {
    const tbody = document.getElementById('products-table-body');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;" class="text-secondary">Loading products...</td></tr>';
    }

    try {
        const [prodsData, catsData, pricesData] = await Promise.all([
            api.get('/products/?limit=100'),
            api.get('/categories/'),
            api.get('/partner-prices/').catch(() => [])
        ]);

        products = Array.isArray(prodsData) ? prodsData : [];
        categories = Array.isArray(catsData) ? catsData : [];
        partnerPrices = Array.isArray(pricesData) ? pricesData : [];

        populateCategoryFilter();
        renderTable();
    } catch (err) {
        console.error('Failed to load products data:', err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem;" class="text-error">Failed to load products: ${err.message || 'Error'}</td></tr>`;
        }
        showToast(err.message || 'Failed to load products', 'error');
    }
}

function populateCategoryFilter() {
    const select = document.getElementById('product-category-filter');
    if (!select) return;

    const currentVal = select.value;
    select.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = String(cat.id);
        opt.textContent = `${cat.icon ? cat.icon + ' ' : ''}${cat.name}`;
        select.appendChild(opt);
    });
    select.value = currentVal;
}

function renderTable() {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;

    const filtered = products.filter(p => {
        // Search filter
        if (searchQuery) {
            const matchesName = p.name && p.name.toLowerCase().includes(searchQuery);
            const matchesBrand = p.brand && p.brand.toLowerCase().includes(searchQuery);
            const matchesDesc = p.description && p.description.toLowerCase().includes(searchQuery);
            const matchesId = String(p.id).includes(searchQuery);
            if (!matchesName && !matchesBrand && !matchesDesc && !matchesId) return false;
        }

        // Category filter
        if (selectedCategory) {
            if (String(p.category_id) !== selectedCategory) return false;
        }

        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="admin-empty" style="text-align: center; padding: 2.5rem; color: var(--color-text-secondary);">
                    ${products.length === 0 ? 'No products found. Click "+ Add Product" to create one.' : 'No products match your filters.'}
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(product => {
        const cat = categories.find(c => c.id === product.category_id);
        const catDisplay = cat ? `${cat.icon ? cat.icon + ' ' : ''}${cat.name}` : `Category #${product.category_id}`;

        const prodPrices = partnerPrices.filter(pp => pp.product_id === product.id);
        const totalStock = prodPrices.reduce((sum, pp) => sum + (pp.stock_count || 0), 0);
        
        let stockBadge = '';
        if (prodPrices.length === 0) {
            stockBadge = '<span class="badge" style="background: var(--color-bg); color: var(--color-text-secondary); font-size: 0.8rem;">No Partners</span>';
        } else if (totalStock > 0) {
            stockBadge = `<span style="color: var(--color-success); font-weight: 600; font-size: 0.85rem;">In Stock (${totalStock})</span>`;
        } else {
            stockBadge = '<span style="color: var(--color-error); font-weight: 600; font-size: 0.85rem;">Out of Stock</span>';
        }

        const dealDisplay = product.our_deal != null
            ? `<strong style="color: var(--color-deal); font-size: 1.05rem;">${formatPrice(product.our_deal)}</strong>`
            : '<span style="color: var(--color-text-secondary); font-style: italic; font-size: 0.85rem;">No deal yet</span>';

        let imageSrc = product.image_path || '/assets/images/placeholder.jpg';
        if (imageSrc && !imageSrc.startsWith('/') && !imageSrc.startsWith('http')) {
            imageSrc = '/' + imageSrc;
        }

        return `
            <tr>
                <td><strong>#${product.id}</strong></td>
                <td>
                    <img src="${imageSrc}" alt="${product.name}" style="width: 44px; height: 44px; object-fit: contain; border-radius: 4px; border: 1px solid var(--color-border); background: var(--color-surface);" onerror="this.src='/assets/images/placeholder.jpg'">
                </td>
                <td style="max-width: 260px;">
                    <div style="font-weight: 600; color: var(--color-text); line-height: 1.3;">${product.name}</div>
                    ${product.brand ? `<small style="color: var(--color-text-secondary); font-size: 0.8rem;">Brand: <strong>${product.brand}</strong></small>` : ''}
                </td>
                <td>
                    <span class="badge" style="background: var(--color-bg); font-weight: 500;">${catDisplay}</span>
                </td>
                <td>${dealDisplay}</td>
                <td>${stockBadge}</td>
                <td style="text-align: right;">
                    <div class="table-actions" style="justify-content: flex-end;">
                        <button class="btn btn-sm btn-outline edit-btn" data-id="${product.id}">Edit</button>
                        <button class="btn btn-sm btn-outline delete-btn" data-id="${product.id}" style="color: var(--color-error); border-color: var(--color-border);">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Attach row events
    tbody.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id, 10);
            const product = products.find(p => p.id === id);
            if (product) openProductModal(product);
        });
    });

    tbody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt(e.currentTarget.dataset.id, 10);
            const product = products.find(p => p.id === id);
            if (!product) return;

            const linkedPrices = partnerPrices.filter(pp => pp.product_id === id).length;
            const extraWarning = linkedPrices > 0 ? `\nWarning: This product has ${linkedPrices} partner price record(s) linked to it.` : '';

            if (!confirm(`Are you sure you want to delete product "${product.name}"?${extraWarning}\nThis action cannot be undone.`)) {
                return;
            }

            try {
                await api.delete(`/products/${id}`);
                products = products.filter(p => p.id !== id);
                partnerPrices = partnerPrices.filter(pp => pp.product_id !== id);
                renderTable();
                showToast(`Product "${product.name}" deleted successfully`, 'success');
            } catch (err) {
                console.error('Failed to delete product:', err);
                showToast(err.message || 'Failed to delete product', 'error');
            }
        });
    });
}

function openProductModal(product = null) {
    const isEdit = Boolean(product);
    const title = isEdit ? `Edit Product: ${product.name}` : 'Add New Product';

    const categoryOptions = categories.map(cat => `
        <option value="${cat.id}" ${product && product.category_id === cat.id ? 'selected' : ''}>
            ${cat.icon ? cat.icon + ' ' : ''}${cat.name}
        </option>
    `).join('');

    const modalHtml = `
        <form id="product-form" style="display: flex; flex-direction: column; gap: var(--space-md); max-height: 80vh; overflow-y: auto; padding-right: 4px;">
            <div class="form-group">
                <label for="prod-name" class="form-label">Product Name *</label>
                <input type="text" id="prod-name" class="form-input" placeholder="e.g. Sony WH-1000XM5 Headphones" required value="${product?.name || ''}">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
                <div class="form-group">
                    <label for="prod-brand" class="form-label">Brand</label>
                    <input type="text" id="prod-brand" class="form-input" placeholder="e.g. Sony, Apple, Samsung" value="${product?.brand || ''}">
                </div>

                <div class="form-group">
                    <label for="prod-category" class="form-label">Category *</label>
                    <select id="prod-category" class="form-select" required>
                        <option value="" disabled ${!product ? 'selected' : ''}>Select Category</option>
                        ${categoryOptions}
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label for="prod-image" class="form-label">Image Path / URL</label>
                <input type="text" id="prod-image" class="form-input" placeholder="e.g. /assets/images/products/product-1.jpg" value="${product?.image_path || ''}">
            </div>

            <div class="form-group">
                <label for="prod-short-desc" class="form-label">Short Tagline</label>
                <input type="text" id="prod-short-desc" class="form-input" placeholder="e.g. Premium noise cancelling wireless headphones" value="${product?.short_describe || ''}">
            </div>

            <div class="form-group">
                <label for="prod-desc" class="form-label">Full Description</label>
                <textarea id="prod-desc" class="form-input" rows="3" placeholder="Detailed product specifications and highlights...">${product?.description || ''}</textarea>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: var(--space-sm); margin-top: var(--space-md); padding-top: var(--space-sm); border-top: 1px solid var(--color-border);">
                <button type="button" class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
                <button type="submit" class="btn btn-primary" id="modal-submit-btn">${isEdit ? 'Save Changes' : 'Create Product'}</button>
            </div>
        </form>
    `;

    showModal(modalHtml, { title, maxWidth: '580px' });

    const form = document.getElementById('product-form');
    if (!form) return;

    const cancelBtn = document.getElementById('modal-cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('modal-submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = isEdit ? 'Saving...' : 'Creating...';

        const name = document.getElementById('prod-name').value.trim();
        const brand = document.getElementById('prod-brand').value.trim() || null;
        const category_id = parseInt(document.getElementById('prod-category').value, 10);
        const image_path = document.getElementById('prod-image').value.trim() || null;
        const short_describe = document.getElementById('prod-short-desc').value.trim() || null;
        const description = document.getElementById('prod-desc').value.trim() || null;

        if (!name) {
            showToast('Product name is required', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = isEdit ? 'Save Changes' : 'Create Product';
            return;
        }

        if (!category_id || isNaN(category_id)) {
            showToast('Please select a valid category', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = isEdit ? 'Save Changes' : 'Create Product';
            return;
        }

        const payload = {
            name,
            brand,
            category_id,
            image_path,
            short_describe,
            description
        };

        try {
            if (isEdit) {
                const updated = await api.put(`/products/${product.id}`, payload);
                const idx = products.findIndex(p => p.id === product.id);
                if (idx > -1) {
                    products[idx] = { ...products[idx], ...updated };
                }
                showToast(`Product "${name}" updated successfully`, 'success');
            } else {
                const created = await api.post('/products/', payload);
                products.unshift(created);
                showToast(`Product "${name}" created successfully`, 'success');
            }

            closeModal();
            renderTable();
        } catch (err) {
            console.error('Failed to save product:', err);
            showToast(err.message || 'Failed to save product', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = isEdit ? 'Save Changes' : 'Create Product';
        }
    });
}
