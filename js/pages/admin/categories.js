import { initAdminLayout } from '../../components/admin-layout.js';
import { api } from '../../utils/api.js';
import { showModal, closeModal } from '../../components/modal.js';
import { showToast } from '../../components/toast.js';

let categories = [];
let products = [];
let searchQuery = '';

document.addEventListener('DOMContentLoaded', async () => {
    initAdminLayout();
    setupEvents();
    await loadData();
});

function setupEvents() {
    const addBtn = document.getElementById('add-category-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => openCategoryModal(null));
    }

    const searchInput = document.getElementById('category-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderTable();
        });
    }
}

async function loadData() {
    const tbody = document.getElementById('categories-table-body');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;" class="text-secondary">Loading categories...</td></tr>';
    }

    try {
        const [catsData, prodsData] = await Promise.all([
            api.get('/categories/'),
            api.get('/products/?limit=100').catch(() => [])
        ]);

        categories = Array.isArray(catsData) ? catsData : [];
        products = Array.isArray(prodsData) ? prodsData : [];
        renderTable();
    } catch (err) {
        console.error('Failed to load categories:', err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem;" class="text-error">Failed to load categories: ${err.message || 'Error'}</td></tr>`;
        }
        showToast(err.message || 'Failed to load categories', 'error');
    }
}

function renderTable() {
    const tbody = document.getElementById('categories-table-body');
    if (!tbody) return;

    const filtered = categories.filter(c => {
        if (!searchQuery) return true;
        return (
            (c.name && c.name.toLowerCase().includes(searchQuery)) ||
            (c.description && c.description.toLowerCase().includes(searchQuery)) ||
            String(c.id).includes(searchQuery)
        );
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="admin-empty">
                    ${categories.length === 0 ? 'No categories found. Click "+ Add Category" to create one.' : 'No categories match your search.'}
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(cat => {
        const prodCount = products.filter(p => p.category_id === cat.id).length;
        const iconDisplay = cat.icon ? cat.icon : '📁';
        const descDisplay = cat.description ? cat.description : '<span style="color: var(--color-text-secondary); font-style: italic;">No description</span>';

        return `
            <tr>
                <td><strong>#${cat.id}</strong></td>
                <td style="font-size: 1.5rem; line-height: 1;">${iconDisplay}</td>
                <td>
                    <div style="font-weight: 600; color: var(--color-text);">${cat.name}</div>
                </td>
                <td style="max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--color-text-secondary);">
                    ${descDisplay}
                </td>
                <td>
                    <span class="badge" style="background: var(--color-bg); font-weight: 500;">
                        ${prodCount} ${prodCount === 1 ? 'product' : 'products'}
                    </span>
                </td>
                <td style="text-align: right;">
                    <div class="table-actions" style="justify-content: flex-end;">
                        <button class="btn btn-sm btn-outline edit-btn" data-id="${cat.id}">Edit</button>
                        <button class="btn btn-sm btn-outline delete-btn" data-id="${cat.id}" style="color: var(--color-error); border-color: var(--color-border);">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Attach row button events
    tbody.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id, 10);
            const cat = categories.find(c => c.id === id);
            if (cat) openCategoryModal(cat);
        });
    });

    tbody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt(e.currentTarget.dataset.id, 10);
            const cat = categories.find(c => c.id === id);
            if (!cat) return;

            const prodCount = products.filter(p => p.category_id === id).length;
            const warningExtra = prodCount > 0 ? `\nWarning: This category has ${prodCount} products assigned to it.` : '';
            if (!confirm(`Are you sure you want to delete category "${cat.name}"?${warningExtra}`)) {
                return;
            }

            try {
                await api.delete(`/categories/${id}`);
                categories = categories.filter(c => c.id !== id);
                renderTable();
                showToast(`Category "${cat.name}" deleted successfully`, 'success');
            } catch (err) {
                console.error('Failed to delete category:', err);
                showToast(err.message || 'Failed to delete category', 'error');
            }
        });
    });
}

function openCategoryModal(category = null) {
    const isEdit = Boolean(category);
    const title = isEdit ? `Edit Category: ${category.name}` : 'Add New Category';

    const sampleEmojis = ['🔌', '💻', '📱', '👗', '🏠', '🎮', '🎧', '✨', '👟', '📚', '⚽', '🚗'];

    const modalHtml = `
        <form id="category-form" style="display: flex; flex-direction: column; gap: var(--space-md);">
            <div class="form-group">
                <label for="cat-name" class="form-label">Category Name *</label>
                <input type="text" id="cat-name" class="form-input" placeholder="e.g. Smart Watches" required value="${category?.name || ''}">
            </div>

            <div class="form-group">
                <label for="cat-icon" class="form-label">Icon / Emoji</label>
                <div style="display: flex; gap: var(--space-xs); align-items: center; margin-bottom: 6px;">
                    <input type="text" id="cat-icon" class="form-input" placeholder="e.g. ⌚ or icon class" value="${category?.icon || ''}" style="width: 140px;">
                    <span class="text-secondary" style="font-size: var(--font-size-xs);">Quick select:</span>
                    <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                        ${sampleEmojis.map(emoji => `
                            <button type="button" class="btn btn-ghost btn-sm emoji-picker-btn" style="padding: 2px 6px; font-size: 1.1rem;">${emoji}</button>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="form-group">
                <label for="cat-desc" class="form-label">Description</label>
                <textarea id="cat-desc" class="form-input" rows="3" placeholder="Brief description of products in this category...">${category?.description || ''}</textarea>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: var(--space-sm); margin-top: var(--space-md);">
                <button type="button" class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
                <button type="submit" class="btn btn-primary" id="modal-submit-btn">${isEdit ? 'Save Changes' : 'Create Category'}</button>
            </div>
        </form>
    `;

    showModal(modalHtml, { title, maxWidth: '520px' });

    // Emoji picker click
    const form = document.getElementById('category-form');
    if (!form) return;

    form.querySelectorAll('.emoji-picker-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const iconInput = document.getElementById('cat-icon');
            if (iconInput) iconInput.value = btn.textContent.trim();
        });
    });

    const cancelBtn = document.getElementById('modal-cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('modal-submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = isEdit ? 'Saving...' : 'Creating...';

        const name = document.getElementById('cat-name').value.trim();
        const icon = document.getElementById('cat-icon').value.trim() || null;
        const description = document.getElementById('cat-desc').value.trim() || null;

        const payload = { name, icon, description };

        try {
            if (isEdit) {
                const updated = await api.put(`/categories/${category.id}`, payload);
                const idx = categories.findIndex(c => c.id === category.id);
                if (idx > -1) categories[idx] = updated;
                showToast(`Category "${name}" updated successfully`, 'success');
            } else {
                const created = await api.post('/categories/', payload);
                categories.push(created);
                showToast(`Category "${name}" created successfully`, 'success');
            }

            closeModal();
            renderTable();
        } catch (err) {
            console.error('Failed to save category:', err);
            showToast(err.message || 'Failed to save category', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = isEdit ? 'Save Changes' : 'Create Category';
        }
    });
}
