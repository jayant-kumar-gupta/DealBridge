import { initAdminLayout } from '../../components/admin-layout.js';
import { api } from '../../utils/api.js';
import { showModal, closeModal } from '../../components/modal.js';
import { showToast } from '../../components/toast.js';
import { formatPrice } from '../../utils/helpers.js';

let partnerPrices = [];
let products = [];
let partners = [];
let categories = [];

let searchQuery = '';
let selectedPartner = '';
let selectedCategory = '';

document.addEventListener('DOMContentLoaded', async () => {
    initAdminLayout();
    setupEvents();
    await loadData();
});

function setupEvents() {
    const addBtn = document.getElementById('add-price-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => openPriceModal(null));
    }

    const searchInput = document.getElementById('price-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderTable();
        });
    }

    const partnerFilter = document.getElementById('price-partner-filter');
    if (partnerFilter) {
        partnerFilter.addEventListener('change', (e) => {
            selectedPartner = e.target.value;
            renderTable();
        });
    }

    const categoryFilter = document.getElementById('price-category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            selectedCategory = e.target.value;
            renderTable();
        });
    }
}

async function loadData() {
    const tbody = document.getElementById('prices-table-body');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;" class="text-secondary">Loading prices...</td></tr>';
    }

    try {
        const [pricesData, prodsData, partnersData, catsData] = await Promise.all([
            api.get('/partner-prices/'),
            api.get('/products/?limit=100'),
            api.get('/partners/'),
            api.get('/categories/')
        ]);

        partnerPrices = Array.isArray(pricesData) ? pricesData : [];
        products = Array.isArray(prodsData) ? prodsData : [];
        partners = Array.isArray(partnersData) ? partnersData : [];
        categories = Array.isArray(catsData) ? catsData : [];

        populateFilters();
        renderTable();
    } catch (err) {
        console.error('Failed to load prices data:', err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem;" class="text-error">Failed to load prices: ${err.message || 'Error'}</td></tr>`;
        }
        showToast(err.message || 'Failed to load prices', 'error');
    }
}

function populateFilters() {
    const partnerSelect = document.getElementById('price-partner-filter');
    if (partnerSelect) {
        const cur = partnerSelect.value;
        partnerSelect.innerHTML = '<option value="">All Partners</option>';
        partners.forEach(p => {
            const opt = document.createElement('option');
            opt.value = String(p.id);
            opt.textContent = p.name;
            partnerSelect.appendChild(opt);
        });
        partnerSelect.value = cur;
    }

    const catSelect = document.getElementById('price-category-filter');
    if (catSelect) {
        const cur = catSelect.value;
        catSelect.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(c => {
            const opt = document.createElement('option');
            opt.value = String(c.id);
            opt.textContent = `${c.icon ? c.icon + ' ' : ''}${c.name}`;
            catSelect.appendChild(opt);
        });
        catSelect.value = cur;
    }
}

function renderTable() {
    const tbody = document.getElementById('prices-table-body');
    if (!tbody) return;

    const filtered = partnerPrices.filter(pp => {
        const prod = products.find(p => p.id === pp.product_id);
        const partner = partners.find(p => p.id === pp.partner_id);

        // Partner filter
        if (selectedPartner && String(pp.partner_id) !== selectedPartner) {
            return false;
        }

        // Category filter
        if (selectedCategory) {
            if (!prod || String(prod.category_id) !== selectedCategory) {
                return false;
            }
        }

        // Search query
        if (searchQuery) {
            const prodName = prod ? prod.name.toLowerCase() : '';
            const partnerName = partner ? partner.name.toLowerCase() : '';
            const prodBrand = (prod && prod.brand) ? prod.brand.toLowerCase() : '';
            const idMatch = String(pp.product_id).includes(searchQuery) || String(pp.partner_id).includes(searchQuery);

            if (!prodName.includes(searchQuery) && !partnerName.includes(searchQuery) && !prodBrand.includes(searchQuery) && !idMatch) {
                return false;
            }
        }

        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="admin-empty" style="text-align: center; padding: 2.5rem; color: var(--color-text-secondary);">
                    ${partnerPrices.length === 0 ? 'No partner prices found. Click "+ Add Partner Price" to create one.' : 'No partner prices match your filters.'}
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(pp => {
        const prod = products.find(p => p.id === pp.product_id);
        const partner = partners.find(p => p.id === pp.partner_id);

        const prodName = prod ? prod.name : `Product #${pp.product_id}`;
        let prodImage = prod?.image_path || '/assets/images/placeholder.jpg';
        if (prodImage && !prodImage.startsWith('/') && !prodImage.startsWith('http')) {
            prodImage = '/' + prodImage;
        }

        const partnerName = partner ? partner.name : `Partner #${pp.partner_id}`;
        const partnerColor = partner?.badge_color || '#4A90D9';

        const ourDealDisplay = (prod && prod.our_deal != null)
            ? `<strong style="color: var(--color-deal); font-size: 1.05rem;">${formatPrice(prod.our_deal)}</strong>`
            : '<span style="color: var(--color-text-secondary); font-style: italic;">No deal yet</span>';

        const markedPrice = pp.marked_price != null ? Number(pp.marked_price) : null;
        const markedDisplay = markedPrice
            ? `<div>
                <span style="color: var(--color-text-secondary); text-decoration: line-through; font-size: 0.92rem;">${formatPrice(markedPrice)}</span>
                ${markedPrice > pp.partner_price ? `<br><small style="color: var(--color-deal); font-weight: 600; font-size: 0.76rem;">${Math.round(((markedPrice - pp.partner_price) / markedPrice) * 100)}% off</small>` : ''}
               </div>`
            : '<span style="color: var(--color-text-secondary); font-style: italic; font-size: 0.85rem;">None</span>';

        const urlDisplay = pp.partner_product_url
            ? `<a href="${pp.partner_product_url.startsWith('http') ? pp.partner_product_url : 'https://' + pp.partner_product_url}" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary); text-decoration: underline; font-size: 0.85rem;">Visit ↗</a>`
            : '<span style="color: var(--color-text-secondary); font-style: italic; font-size: 0.85rem;">None</span>';

        const stockDisplay = pp.stock_count > 0
            ? `<span style="color: var(--color-success); font-weight: 600;">${pp.stock_count} units</span>`
            : '<span style="color: var(--color-error); font-weight: 500;">Out of Stock (0)</span>';

        return `
            <tr>
                <td style="max-width: 260px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${prodImage}" alt="${prodName}" style="width: 38px; height: 38px; object-fit: contain; border-radius: 4px; border: 1px solid var(--color-border); background: var(--color-surface); flex-shrink: 0;" onerror="this.src='/assets/images/placeholder.jpg'">
                        <div>
                            <div style="font-weight: 600; color: var(--color-text); font-size: 0.95rem; line-height: 1.2;">${prodName}</div>
                            <small style="color: var(--color-text-secondary); font-size: 0.78rem;">ID: #${pp.product_id}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="width: 12px; height: 12px; border-radius: 50%; background-color: ${partnerColor}; display: inline-block; flex-shrink: 0;"></span>
                        <strong style="color: var(--color-text); font-size: 0.95rem;">${partnerName}</strong>
                    </div>
                </td>
                <td>
                    <span style="font-weight: 600; font-size: 1rem; color: var(--color-text);">${formatPrice(pp.partner_price)}</span>
                </td>
                <td>${markedDisplay}</td>
                <td>${ourDealDisplay}</td>
                <td>${stockDisplay}</td>
                <td>${urlDisplay}</td>
                <td style="text-align: right;">
                    <div class="table-actions" style="justify-content: flex-end;">
                        <button class="btn btn-sm btn-outline edit-btn" data-prod="${pp.product_id}" data-partner="${pp.partner_id}">Edit</button>
                        <button class="btn btn-sm btn-outline delete-btn" data-prod="${pp.product_id}" data-partner="${pp.partner_id}" style="color: var(--color-error); border-color: var(--color-border);">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Attach row events
    tbody.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const prodId = parseInt(e.currentTarget.dataset.prod, 10);
            const partnerId = parseInt(e.currentTarget.dataset.partner, 10);
            const pp = partnerPrices.find(p => p.product_id === prodId && p.partner_id === partnerId);
            if (pp) openPriceModal(pp);
        });
    });

    tbody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const prodId = parseInt(e.currentTarget.dataset.prod, 10);
            const partnerId = parseInt(e.currentTarget.dataset.partner, 10);
            const pp = partnerPrices.find(p => p.product_id === prodId && p.partner_id === partnerId);
            if (!pp) return;

            const prod = products.find(p => p.id === prodId);
            const partner = partners.find(p => p.id === partnerId);
            const prodName = prod ? prod.name : `#${prodId}`;
            const partnerName = partner ? partner.name : `#${partnerId}`;

            if (!confirm(`Are you sure you want to remove the price from "${partnerName}" for "${prodName}"?`)) {
                return;
            }

            try {
                await api.delete(`/partner-prices/${prodId}-${partnerId}`);
                partnerPrices = partnerPrices.filter(p => !(p.product_id === prodId && p.partner_id === partnerId));
                
                // Re-fetch products to get newly synced our_deal
                const prodsData = await api.get('/products/?limit=100').catch(() => null);
                if (Array.isArray(prodsData)) products = prodsData;

                renderTable();
                showToast(`Price record for "${partnerName}" removed successfully`, 'success');
            } catch (err) {
                console.error('Failed to delete price:', err);
                showToast(err.message || 'Failed to delete price record', 'error');
            }
        });
    });
}

function openPriceModal(priceRecord = null) {
    const isEdit = Boolean(priceRecord);
    const prod = isEdit ? products.find(p => p.id === priceRecord.product_id) : null;
    const partner = isEdit ? partners.find(p => p.id === priceRecord.partner_id) : null;

    const title = isEdit
        ? `Edit Price: ${prod ? prod.name : '#' + priceRecord.product_id} (${partner ? partner.name : '#' + priceRecord.partner_id})`
        : 'Add Partner Price';

    const productOptions = products.map(p => `
        <option value="${p.id}" ${priceRecord && priceRecord.product_id === p.id ? 'selected' : ''}>
            #${p.id} — ${p.name}
        </option>
    `).join('');

    const partnerOptions = partners.map(part => `
        <option value="${part.id}" ${priceRecord && priceRecord.partner_id === part.id ? 'selected' : ''}>
            ${part.name}
        </option>
    `).join('');

    const modalHtml = `
        <form id="price-form" style="display: flex; flex-direction: column; gap: var(--space-md);">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
                <div class="form-group">
                    <label for="price-product-select" class="form-label">Product *</label>
                    <select id="price-product-select" class="form-select" required ${isEdit ? 'disabled' : ''}>
                        <option value="" disabled ${!priceRecord ? 'selected' : ''}>Select Product</option>
                        ${productOptions}
                    </select>
                </div>

                <div class="form-group">
                    <label for="price-partner-select" class="form-label">Retail Partner *</label>
                    <select id="price-partner-select" class="form-select" required ${isEdit ? 'disabled' : ''}>
                        <option value="" disabled ${!priceRecord ? 'selected' : ''}>Select Partner</option>
                        ${partnerOptions}
                    </select>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
                <div class="form-group">
                    <label for="price-amount" class="form-label">Partner Price (₹) *</label>
                    <input type="number" id="price-amount" class="form-input" min="0" step="0.01" placeholder="e.g. 24999.00" required value="${priceRecord ? priceRecord.partner_price : ''}">
                </div>

                <div class="form-group">
                    <label for="price-marked" class="form-label">Marked Price / MRP (₹)</label>
                    <input type="number" id="price-marked" class="form-input" min="0" step="0.01" placeholder="e.g. 29999.00" value="${priceRecord?.marked_price != null ? priceRecord.marked_price : ''}">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
                <div class="form-group">
                    <label for="price-stock" class="form-label">Stock Count</label>
                    <input type="number" id="price-stock" class="form-input" min="0" step="1" placeholder="e.g. 25" value="${priceRecord ? priceRecord.stock_count : '10'}">
                </div>

                <div class="form-group">
                    <label for="price-url" class="form-label">Partner Product URL</label>
                    <input type="text" id="price-url" class="form-input" placeholder="e.g. https://www.amazon.in/dp/example" value="${priceRecord?.partner_product_url || ''}">
                </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: var(--space-sm); margin-top: var(--space-md); padding-top: var(--space-sm); border-top: 1px solid var(--color-border);">
                <button type="button" class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
                <button type="submit" class="btn btn-primary" id="modal-submit-btn">${isEdit ? 'Save Changes' : 'Create Partner Price'}</button>
            </div>
        </form>
    `;

    showModal(modalHtml, { title, maxWidth: '540px' });

    const form = document.getElementById('price-form');
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

        const productId = isEdit ? priceRecord.product_id : parseInt(document.getElementById('price-product-select').value, 10);
        const partnerId = isEdit ? priceRecord.partner_id : parseInt(document.getElementById('price-partner-select').value, 10);
        const partner_price = parseFloat(document.getElementById('price-amount').value);
        const markedRaw = document.getElementById('price-marked').value;
        const marked_price = markedRaw && !isNaN(parseFloat(markedRaw)) ? parseFloat(markedRaw) : null;
        const stock_count = parseInt(document.getElementById('price-stock').value, 10) || 0;
        const partner_product_url = document.getElementById('price-url').value.trim() || null;

        if (isNaN(productId) || isNaN(partnerId)) {
            showToast('Please select both product and partner', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = isEdit ? 'Save Changes' : 'Create Partner Price';
            return;
        }

        if (isNaN(partner_price) || partner_price <= 0) {
            showToast('Please enter a valid price greater than 0', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = isEdit ? 'Save Changes' : 'Create Partner Price';
            return;
        }

        const payload = {
            product_id: productId,
            partner_id: partnerId,
            partner_price,
            marked_price,
            stock_count,
            partner_product_url,
            date: new Date().toISOString()
        };

        try {
            if (isEdit) {
                const updated = await api.put(`/partner-prices/${productId}-${partnerId}`, payload);
                const idx = partnerPrices.findIndex(p => p.product_id === productId && p.partner_id === partnerId);
                if (idx > -1) {
                    partnerPrices[idx] = { ...partnerPrices[idx], ...updated };
                }
                showToast('Price updated successfully', 'success');
            } else {
                const created = await api.post('/partner-prices/', payload);
                partnerPrices.unshift(created);
                showToast('Partner price added successfully', 'success');
            }

            // Sync products to reflect our_deal calculation
            const prodsData = await api.get('/products/?limit=100').catch(() => null);
            if (Array.isArray(prodsData)) products = prodsData;

            closeModal();
            renderTable();
        } catch (err) {
            console.error('Failed to save partner price:', err);
            showToast(err.message || 'Failed to save partner price', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = isEdit ? 'Save Changes' : 'Create Partner Price';
        }
    });
}
