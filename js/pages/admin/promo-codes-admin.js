import { initAdminLayout } from '../../components/admin-layout.js';
import { promoCodes } from '../../data/promo-codes.js';

document.addEventListener('DOMContentLoaded', () => {
    initAdminLayout();
    const tbody = document.getElementById('promocodes-table-body');
    if (tbody) {
        tbody.innerHTML = promoCodes.map(code => `
            <tr>
                <td><strong>${code.code}</strong></td>
                <td>${code.type}</td>
                <td>${code.type === 'percentage' ? code.value + '%' : '₹' + code.value}</td>
                <td>
                    <span class="badge" style="background-color: var(--color-success); color: white;">Active</span>
                </td>
            </tr>
        `).join('');
    }
});
