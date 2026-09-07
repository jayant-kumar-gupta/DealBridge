import { initAdminLayout } from '../../components/admin-layout.js';
import { categories } from '../../data/categories.js';
import { products } from '../../data/products.js';

document.addEventListener('DOMContentLoaded', () => {
    initAdminLayout();
    const tbody = document.getElementById('categories-table-body');
    if (tbody) {
        tbody.innerHTML = categories.map(cat => {
            const count = products.filter(p => p.categoryId === cat.id).length;
            return `
            <tr>
                <td>#${cat.id}</td>
                <td><i class="fas ${cat.icon}"></i> ${cat.icon}</td>
                <td><strong>${cat.name}</strong></td>
                <td>${count} products</td>
            </tr>
            `;
        }).join('');
    }
});
