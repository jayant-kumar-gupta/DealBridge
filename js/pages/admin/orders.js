import { initAdminLayout } from '../../components/admin-layout.js';
import { orders } from '../../data/orders.js';
import { formatPrice, formatDate } from '../../utils/helpers.js';
import { showToast } from '../../components/toast.js';

let currentOrders = [...orders];

document.addEventListener('DOMContentLoaded', () => {
    initAdminLayout();
    
    const tbody = document.getElementById('orders-table-body');
    const statusFilter = document.getElementById('order-status-filter');

    function renderTable() {
        if (!tbody) return;
        
        const filterVal = statusFilter.value;
        const filtered = currentOrders.filter(o => filterVal ? o.status === filterVal : true);
        
        tbody.innerHTML = filtered.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>${formatDate(order.date)}</td>
                <td>User #${order.userId}</td>
                <td>${formatPrice(order.total)}</td>
                <td>${order.items.length} items</td>
                <td>
                    <select class="form-select status-select" data-id="${order.id}" style="padding: 4px; font-size: 12px; height: auto;">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-outline view-btn" data-id="${order.id}">View Details</button>
                    </div>
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const newStatus = e.target.value;
                const order = currentOrders.find(o => o.id === id);
                if(order) order.status = newStatus;
                showToast(`Order #${id} status updated to ${newStatus}`, 'success');
            });
        });

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                showToast('View order details modal.', 'info');
            });
        });
    }

    statusFilter?.addEventListener('change', renderTable);
    renderTable();
});
