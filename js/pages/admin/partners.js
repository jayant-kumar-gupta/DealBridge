import { initAdminLayout } from '../../components/admin-layout.js';
import { api } from '../../utils/api.js';
import { showModal, closeModal } from '../../components/modal.js';
import { showToast } from '../../components/toast.js';

let partners = [];
let searchQuery = '';

document.addEventListener('DOMContentLoaded', async () => {
    initAdminLayout();
    setupEvents();
    await loadData();
});

function setupEvents() {
    const addBtn = document.getElementById('add-partner-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => openPartnerModal(null));
    }

    const searchInput = document.getElementById('partner-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderTable();
        });
    }
}

async function loadData() {
    const tbody = document.getElementById('partners-table-body');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;" class="text-secondary">Loading partners...</td></tr>';
    }

    try {
        const data = await api.get('/partners/');
        partners = Array.isArray(data) ? data : [];
        renderTable();
    } catch (err) {
        console.error('Failed to load partners:', err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem;" class="text-error">Failed to load partners: ${err.message || 'Error'}</td></tr>`;
        }
        showToast(err.message || 'Failed to load partners', 'error');
    }
}

function renderTable() {
    const tbody = document.getElementById('partners-table-body');
    if (!tbody) return;

    const filtered = partners.filter(p => {
        if (!searchQuery) return true;
        return (
            (p.name && p.name.toLowerCase().includes(searchQuery)) ||
            (p.website_url && p.website_url.toLowerCase().includes(searchQuery)) ||
            (p.description && p.description.toLowerCase().includes(searchQuery)) ||
            String(p.id).includes(searchQuery)
        );
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="admin-empty">
                    ${partners.length === 0 ? 'No partners found. Click "+ Add Partner" to create one.' : 'No partners match your search.'}
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(partner => {
        const color = partner.badge_color || '#4A90D9';
        const websiteHref = partner.website_url 
            ? (partner.website_url.startsWith('http') ? partner.website_url : `https://${partner.website_url}`)
            : null;
        const websiteDisplay = websiteHref
            ? `<a href="${websiteHref}" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary); text-decoration: underline;">${partner.website_url} ↗</a>`
            : '<span style="color: var(--color-text-secondary); font-style: italic;">None</span>';
        const descDisplay = partner.description
            ? partner.description
            : '<span style="color: var(--color-text-secondary); font-style: italic;">No description</span>';

        return `
            <tr>
                <td><strong>#${partner.id}</strong></td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="width: 14px; height: 14px; border-radius: 50%; background-color: ${color}; display: inline-block; flex-shrink: 0; box-shadow: 0 0 0 1px var(--color-border);"></span>
                        <strong style="color: var(--color-text);">${partner.name}</strong>
                    </div>
                </td>
                <td style="max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${websiteDisplay}
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="display: inline-block; width: 18px; height: 18px; border-radius: 4px; background: ${color}; border: 1px solid var(--color-border);"></span>
                        <code style="font-size: var(--font-size-xs); background: var(--color-bg); padding: 2px 6px; border-radius: 4px;">${color}</code>
                    </div>
                </td>
                <td style="max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--color-text-secondary);">
                    ${descDisplay}
                </td>
                <td style="text-align: right;">
                    <div class="table-actions" style="justify-content: flex-end;">
                        <button class="btn btn-sm btn-outline edit-btn" data-id="${partner.id}">Edit</button>
                        <button class="btn btn-sm btn-outline delete-btn" data-id="${partner.id}" style="color: var(--color-error); border-color: var(--color-border);">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Attach row button events
    tbody.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id, 10);
            const partner = partners.find(p => p.id === id);
            if (partner) openPartnerModal(partner);
        });
    });

    tbody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt(e.currentTarget.dataset.id, 10);
            const partner = partners.find(p => p.id === id);
            if (!partner) return;

            if (!confirm(`Are you sure you want to delete retail partner "${partner.name}"?`)) {
                return;
            }

            try {
                await api.delete(`/partners/${id}`);
                partners = partners.filter(p => p.id !== id);
                renderTable();
                showToast(`Partner "${partner.name}" deleted successfully`, 'success');
            } catch (err) {
                console.error('Failed to delete partner:', err);
                showToast(err.message || 'Failed to delete partner', 'error');
            }
        });
    });
}

function openPartnerModal(partner = null) {
    const isEdit = Boolean(partner);
    const title = isEdit ? `Edit Partner: ${partner.name}` : 'Add New Partner';
    const currentColor = partner?.badge_color || '#4A90D9';

    const presetColors = ['#FF9900', '#4A90D9', '#E85D3A', '#2ECC71', '#7B61FF', '#F39C12', '#E74C3C', '#00A86B'];

    const modalHtml = `
        <form id="partner-form" style="display: flex; flex-direction: column; gap: var(--space-md);">
            <div class="form-group">
                <label for="partner-name" class="form-label">Partner Name *</label>
                <input type="text" id="partner-name" class="form-input" placeholder="e.g. Flipkart, Croma, TataCliq" required value="${partner?.name || ''}">
            </div>

            <div class="form-group">
                <label for="partner-website" class="form-label">Website URL</label>
                <input type="text" id="partner-website" class="form-input" placeholder="e.g. flipkart.com or https://flipkart.com" value="${partner?.website_url || ''}">
            </div>

            <div class="form-group">
                <label for="partner-color" class="form-label">Brand / Badge Color</label>
                <div style="display: flex; gap: var(--space-sm); align-items: center; margin-bottom: 6px;">
                    <input type="color" id="partner-color-picker" value="${currentColor}" style="width: 44px; height: 38px; padding: 2px; border: 1px solid var(--color-border); border-radius: 4px; cursor: pointer; background: var(--color-surface);">
                    <input type="text" id="partner-color-text" class="form-input" placeholder="#4A90D9" value="${currentColor}" style="width: 120px; font-family: monospace;">
                    <span class="text-secondary" style="font-size: var(--font-size-xs);">Presets:</span>
                    <div style="display: flex; gap: 4px;">
                        ${presetColors.map(c => `
                            <button type="button" class="preset-color-btn" data-color="${c}" style="width: 22px; height: 22px; border-radius: 50%; background: ${c}; border: 1px solid var(--color-border); cursor: pointer;" title="${c}"></button>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="form-group">
                <label for="partner-desc" class="form-label">Description</label>
                <textarea id="partner-desc" class="form-input" rows="3" placeholder="Brief info about this retail partner...">${partner?.description || ''}</textarea>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: var(--space-sm); margin-top: var(--space-md);">
                <button type="button" class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
                <button type="submit" class="btn btn-primary" id="modal-submit-btn">${isEdit ? 'Save Changes' : 'Create Partner'}</button>
            </div>
        </form>
    `;

    showModal(modalHtml, { title, maxWidth: '520px' });

    const form = document.getElementById('partner-form');
    if (!form) return;

    const colorPicker = document.getElementById('partner-color-picker');
    const colorText = document.getElementById('partner-color-text');

    if (colorPicker && colorText) {
        colorPicker.addEventListener('input', () => {
            colorText.value = colorPicker.value.toUpperCase();
        });
        colorText.addEventListener('input', () => {
            if (/^#[0-9A-Fa-f]{6}$/.test(colorText.value)) {
                colorPicker.value = colorText.value;
            }
        });
    }

    form.querySelectorAll('.preset-color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const c = btn.dataset.color;
            if (colorPicker) colorPicker.value = c;
            if (colorText) colorText.value = c;
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

        const name = document.getElementById('partner-name').value.trim();
        const website_url = document.getElementById('partner-website').value.trim() || null;
        const badge_color = colorText?.value.trim() || currentColor;
        const description = document.getElementById('partner-desc').value.trim() || null;

        const payload = { name, website_url, badge_color, description };

        try {
            if (isEdit) {
                const updated = await api.put(`/partners/${partner.id}`, payload);
                const idx = partners.findIndex(p => p.id === partner.id);
                if (idx > -1) partners[idx] = updated;
                showToast(`Partner "${name}" updated successfully`, 'success');
            } else {
                const created = await api.post('/partners/', payload);
                partners.push(created);
                showToast(`Partner "${name}" created successfully`, 'success');
            }

            closeModal();
            renderTable();
        } catch (err) {
            console.error('Failed to save partner:', err);
            showToast(err.message || 'Failed to save partner', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = isEdit ? 'Save Changes' : 'Create Partner';
        }
    });
}
