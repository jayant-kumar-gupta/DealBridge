import { initAdminLayout } from '../../components/admin-layout.js';
import { api } from '../../utils/api.js';
import { showModal, closeModal } from '../../components/modal.js';
import { showToast } from '../../components/toast.js';
import { formatPrice, formatDate } from '../../utils/helpers.js';

let orders = [];
let partners = [];
let searchQuery = '';
let statusFilter = '';

document.addEventListener('DOMContentLoaded', async () => {
    initAdminLayout();
    setupEvents();
    await loadData();
});

function setupEvents() {
    const searchInput = document.getElementById('order-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderTable();
        });
    }

    const filterSelect = document.getElementById('order-status-filter');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            statusFilter = e.target.value.toLowerCase().trim();
            renderTable();
        });
    }
}

async function loadData() {
    const tbody = document.getElementById('orders-table-body');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2.5rem;" class="text-secondary">Loading customer orders...</td></tr>';
    }

    try {
        const [ordersData, partnersData] = await Promise.all([
            api.get('/orders/'),
            api.get('/partners/').catch(() => [])
        ]);

        orders = Array.isArray(ordersData) ? ordersData : [];
        partners = Array.isArray(partnersData) ? partnersData : [];
        renderTable();
    } catch (err) {
        console.error('Failed to load orders data:', err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2.5rem;" class="text-error">Failed to load orders: ${err.message || 'Error'}</td></tr>`;
        }
        showToast(err.message || 'Failed to load orders', 'error');
    }
}

function renderTable() {
    const tbody = document.getElementById('orders-table-body');
    if (!tbody) return;

    const filtered = orders.filter(item => {
        const orderDetail = item.order_detail || {};
        const address = item.address || {};
        const items = Array.isArray(item.order_items) ? item.order_items : [];

        // Status Filter
        if (statusFilter) {
            const status = (orderDetail.status || '').toLowerCase();
            if (status !== statusFilter) return false;
        }

        // Search Query
        if (searchQuery) {
            const idMatch = String(orderDetail.id).includes(searchQuery);
            const userMatch = String(orderDetail.user_id).includes(searchQuery);
            const nameMatch = address.name && address.name.toLowerCase().includes(searchQuery);
            const cityMatch = address.city && address.city.toLowerCase().includes(searchQuery);
            const productMatch = items.some(i => i.product_name && i.product_name.toLowerCase().includes(searchQuery));
            const promoMatch = orderDetail.promocode && orderDetail.promocode.toLowerCase().includes(searchQuery);

            if (!idMatch && !userMatch && !nameMatch && !cityMatch && !productMatch && !promoMatch) {
                return false;
            }
        }

        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="admin-empty" style="text-align: center; padding: 2.5rem; color: var(--color-text-secondary);">
                    ${orders.length === 0 ? 'No customer orders have been placed yet.' : 'No orders match your search and filter criteria.'}
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(item => {
        const order = item.order_detail || {};
        const address = item.address || null;
        const items = Array.isArray(item.order_items) ? item.order_items : [];

        const totalItemsCount = items.reduce((sum, itm) => sum + (itm.quantity || 1), 0);
        const firstItemName = items[0]?.product_name || `Item #${items[0]?.product_id || ''}`;
        const moreCount = items.length > 1 ? ` + ${items.length - 1} more` : '';

        const status = (order.status || 'Active').toUpperCase();
        let statusBadgeStyle = 'background: rgba(16, 185, 129, 0.12); color: #059669; border: 1px solid rgba(16, 185, 129, 0.25);';
        if (status === 'DELIVERED') {
            statusBadgeStyle = 'background: rgba(59, 130, 246, 0.12); color: #2563eb; border: 1px solid rgba(59, 130, 246, 0.25);';
        } else if (status === 'CANCELLED') {
            statusBadgeStyle = 'background: rgba(239, 68, 68, 0.12); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.25);';
        }

        let customerDisplay = `<strong>User #${order.user_id}</strong>`;
        if (address) {
            customerDisplay = `
                <div style="line-height: 1.3;">
                    <strong>${address.name || 'User #' + order.user_id}</strong>
                    <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 2px;">
                        ${address.city}, ${address.state} • ${address.phone || 'No phone'}
                    </div>
                </div>
            `;
        }

        return `
            <tr>
                <td><strong>#${order.id}</strong></td>
                <td>
                    <div style="font-size: 0.9rem; color: var(--color-text);">${formatDate(order.date)}</div>
                </td>
                <td style="max-width: 220px;">
                    ${customerDisplay}
                </td>
                <td style="max-width: 240px;">
                    <div style="font-weight: 500; font-size: 0.9rem; color: var(--color-text); line-height: 1.3;">${firstItemName}${moreCount}</div>
                    <small style="color: var(--color-text-secondary); font-size: 0.8rem;">${totalItemsCount} ${totalItemsCount === 1 ? 'item' : 'items'}</small>
                </td>
                <td>
                    <strong style="color: var(--color-deal); font-size: 1.05rem;">${formatPrice(order.amount_paid)}</strong>
                </td>
                <td>
                    <span class="badge" style="${statusBadgeStyle} font-weight: 600; font-size: 0.78rem; padding: 4px 8px;">${status}</span>
                </td>
                <td style="text-align: right;">
                    <div class="table-actions" style="justify-content: flex-end;">
                        <button class="btn btn-sm btn-outline view-order-btn" data-id="${order.id}">View Details</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Attach row button events
    tbody.querySelectorAll('.view-order-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id, 10);
            const found = orders.find(o => o.order_detail?.id === id);
            if (found) {
                openOrderDetailsModal(found);
            }
        });
    });
}

function openOrderDetailsModal(orderData) {
    const order = orderData.order_detail || {};
    const address = orderData.address || null;
    const items = Array.isArray(orderData.order_items) ? orderData.order_items : [];

    const status = (order.status || 'Active').toUpperCase();
    let statusBadgeStyle = 'background: rgba(16, 185, 129, 0.15); color: #059669; border: 1px solid rgba(16, 185, 129, 0.3);';
    if (status === 'DELIVERED') {
        statusBadgeStyle = 'background: rgba(59, 130, 246, 0.15); color: #2563eb; border: 1px solid rgba(59, 130, 246, 0.3);';
    } else if (status === 'CANCELLED') {
        statusBadgeStyle = 'background: rgba(239, 68, 68, 0.15); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.3);';
    }

    let addressHtml = '<span class="text-secondary" style="font-style: italic;">No delivery address info attached.</span>';
    if (address) {
        addressHtml = `
            <div style="line-height: 1.5; font-size: 0.95rem;">
                <strong>${address.name || 'Recipient'}</strong> (${address.type || 'Address'})<br>
                ${address.address_line1}<br>
                ${address.address_line2 ? address.address_line2 + '<br>' : ''}
                ${address.city}, ${address.state} - ${address.pincode}<br>
                ${address.phone ? 'Phone: ' + address.phone : ''}
            </div>
        `;
    }

    let itemsTableRows = items.map(itm => {
        const partner = partners.find(p => p.id === itm.partner_id);
        const partnerName = partner ? partner.name : (itm.partner_id ? 'Partner #' + itm.partner_id : 'DealBridge');
        const partnerColor = partner?.badge_color || '#4A90D9';
        const lineTotal = (itm.price || 0) * (itm.quantity || 1);

        let imgUrl = itm.image_path || '/assets/images/placeholder.jpg';
        if (imgUrl && !imgUrl.startsWith('/') && !imgUrl.startsWith('http')) {
            imgUrl = '/' + imgUrl;
        }

        return `
            <tr style="border-bottom: 1px solid var(--color-border);">
                <td style="padding: 10px 8px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${imgUrl}" alt="" style="width: 40px; height: 40px; object-fit: contain; border-radius: 4px; border: 1px solid var(--color-border); background: var(--color-surface); flex-shrink: 0;" onerror="this.src='/assets/images/placeholder.jpg'">
                        <div>
                            <div style="font-weight: 600; font-size: 0.9rem; color: var(--color-text);">${itm.product_name || 'Product #' + itm.product_id}</div>
                            <small style="color: var(--color-text-secondary); font-size: 0.78rem;">ID: #${itm.product_id}</small>
                        </div>
                    </div>
                </td>
                <td style="padding: 10px 8px;">
                    <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.85rem; font-weight: 500;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: ${partnerColor};"></span>
                        ${partnerName}
                    </span>
                </td>
                <td style="padding: 10px 8px; text-align: center; font-weight: 600;">${itm.quantity}</td>
                <td style="padding: 10px 8px; text-align: right;">${formatPrice(itm.price)}</td>
                <td style="padding: 10px 8px; text-align: right; font-weight: 700; color: var(--color-deal);">${formatPrice(lineTotal)}</td>
            </tr>
        `;
    }).join('');

    const modalContent = `
        <div style="display: flex; flex-direction: column; gap: var(--space-lg); max-height: 80vh; overflow-y: auto; padding-right: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-md); border-bottom: 1px solid var(--color-border); padding-bottom: var(--space-md);">
                <div>
                    <h3 style="margin: 0; font-size: 1.25rem;">Order #${order.id}</h3>
                    <div style="color: var(--color-text-secondary); font-size: 0.85rem; margin-top: 4px;">Placed on ${formatDate(order.date)} • Customer ID: #${order.user_id}</div>
                </div>
                <div style="text-align: right;">
                    <span class="badge" style="${statusBadgeStyle} font-weight: 600; font-size: 0.85rem; padding: 4px 10px;">${status}</span>
                    <div style="font-size: 1.25rem; font-weight: 700; color: var(--color-deal); margin-top: 4px;">${formatPrice(order.amount_paid)}</div>
                </div>
            </div>

            <div style="background: var(--color-bg); padding: var(--space-md); border-radius: var(--radius-md); border: 1px solid var(--color-border);">
                <div style="font-weight: 600; margin-bottom: 6px; font-size: 0.95rem; color: var(--color-text);">📍 Delivery Information</div>
                ${addressHtml}
            </div>

            <div>
                <div style="font-weight: 600; margin-bottom: 8px; font-size: 0.95rem; color: var(--color-text);">📦 Purchased Items (${items.length})</div>
                <div style="border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                        <thead>
                            <tr style="background: var(--color-surface); border-bottom: 1px solid var(--color-border);">
                                <th style="padding: 8px; text-align: left;">Product</th>
                                <th style="padding: 8px; text-align: left;">Partner</th>
                                <th style="padding: 8px; text-align: center;">Qty</th>
                                <th style="padding: 8px; text-align: right;">Price</th>
                                <th style="padding: 8px; text-align: right;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsTableRows}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: var(--space-sm);">
                <button type="button" class="btn btn-secondary" id="order-modal-close-btn">Close</button>
            </div>
        </div>
    `;

    showModal(modalContent, { title: `Order Details #${order.id}`, maxWidth: '640px' });

    const closeBtn = document.getElementById('order-modal-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
}
