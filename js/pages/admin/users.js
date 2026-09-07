import { initAdminLayout } from '../../components/admin-layout.js';
import { users } from '../../data/users.js';
import { orders } from '../../data/orders.js';
import { formatDate } from '../../utils/helpers.js';
import { showToast } from '../../components/toast.js';

document.addEventListener('DOMContentLoaded', () => {
    initAdminLayout();
    
    const tbody = document.getElementById('users-table-body');

    function renderTable() {
        if (!tbody) return;
        
        tbody.innerHTML = users.map(user => {
            const userOrders = orders.filter(o => o.userId === user.id).length;
            
            return `
            <tr>
                <td>#${user.id}</td>
                <td><strong>${user.name}</strong></td>
                <td>${user.email}</td>
                <td>
                    <span class="badge" style="background-color: ${user.role === 'admin' ? 'var(--color-primary)' : 'var(--color-border)'}; color: ${user.role === 'admin' ? 'white' : 'var(--color-text)'}">
                        ${user.role}
                    </span>
                </td>
                <td>${formatDate(user.joinDate || '2026-01-15')}</td>
                <td>${userOrders}</td>
                <td><span class="badge" style="background-color: var(--color-success); color: white;">Active</span></td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-outline view-btn" data-id="${user.id}">View</button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                showToast('View user details modal.', 'info');
            });
        });
    }

    renderTable();
});
