import { initAdminLayout } from '../../components/admin-layout.js';
import { partners } from '../../data/partners.js';
import { showToast } from '../../components/toast.js';

let currentPartners = [...partners];

document.addEventListener('DOMContentLoaded', () => {
    initAdminLayout();
    
    const tbody = document.getElementById('partners-table-body');
    const addBtn = document.getElementById('add-partner-btn');

    function renderTable() {
        if (!tbody) return;
        
        tbody.innerHTML = currentPartners.map(partner => `
            <tr>
                <td>#${partner.id}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${partner.color};"></div>
                        <strong>${partner.name}</strong>
                    </div>
                </td>
                <td><span class="badge" style="background-color: var(--color-success); color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">Active</span></td>
                <td>⭐ ${partner.rating}</td>
                <td>${partner.deliveryTime}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-outline edit-btn" data-id="${partner.id}">Edit</button>
                        <button class="btn btn-sm btn-outline toggle-btn" data-id="${partner.id}">Deactivate</button>
                    </div>
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                showToast('Partner status updated.', 'success');
            });
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                showToast('Edit partner modal would open here.', 'info');
            });
        });
    }

    addBtn?.addEventListener('click', () => {
        showToast('Add partner modal would open here.', 'info');
    });

    renderTable();
});
