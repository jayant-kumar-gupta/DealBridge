import { initAdminLayout } from '../../components/admin-layout.js';
import { products } from '../../data/products.js';
import { formatPrice } from '../../utils/helpers.js';

document.addEventListener('DOMContentLoaded', () => {
    initAdminLayout();
    const tbody = document.getElementById('discounts-table-body');
    if (tbody) {
        const discounted = products.filter(p => p.discount > 0).sort((a, b) => b.discount - a.discount);
        tbody.innerHTML = discounted.map(p => `
            <tr>
                <td>#${p.id}</td>
                <td><strong>${p.name}</strong></td>
                <td style="text-decoration: line-through; color: var(--color-text-secondary);">${formatPrice(p.originalPrice)}</td>
                <td>${formatPrice(p.ourPrice)}</td>
                <td><span style="color: var(--color-success); font-weight: 600;">${p.discount}% OFF</span></td>
            </tr>
        `).join('');
    }
});
