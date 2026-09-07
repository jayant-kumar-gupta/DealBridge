import { initAdminLayout } from '../../components/admin-layout.js';
import { products } from '../../data/products.js';
import { partners } from '../../data/partners.js';
import { categories } from '../../data/categories.js';
import { formatPrice } from '../../utils/helpers.js';

document.addEventListener('DOMContentLoaded', () => {
    initAdminLayout();
    
    const tbody = document.getElementById('prices-table-body');
    const partnerFilter = document.getElementById('price-partner-filter');
    const categoryFilter = document.getElementById('price-category-filter');

    // Populate filters
    partners.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.name;
        partnerFilter.appendChild(option);
    });

    categories.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = c.name;
        categoryFilter.appendChild(option);
    });

    function renderTable() {
        if (!tbody) return;
        
        const pFilter = partnerFilter.value ? parseInt(partnerFilter.value) : null;
        const cFilter = categoryFilter.value ? parseInt(categoryFilter.value) : null;
        
        let rowsHtml = '';
        
        products.forEach(product => {
            if (cFilter && product.categoryId !== cFilter) return;
            
            product.partnerPrices.forEach(pp => {
                if (pFilter && pp.partnerId !== pFilter) return;
                
                const partner = partners.find(p => p.id === pp.partnerId);
                const savings = pp.price - product.ourPrice;
                const isBestDeal = product.bestDeal && product.ourPrice < pp.price;
                
                rowsHtml += `
                <tr ${isBestDeal ? 'style="background-color: var(--color-primary-light);"' : ''}>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <img src="${product.images[0]}" alt="" style="width: 30px; height: 30px; object-fit: cover; border-radius: 4px;">
                            <span style="font-size: 13px;">${product.name}</span>
                        </div>
                    </td>
                    <td>${partner ? partner.name : 'Unknown'}</td>
                    <td style="color: var(--color-text-secondary); text-decoration: line-through;">${formatPrice(pp.price)}</td>
                    <td><strong>${formatPrice(product.ourPrice)}</strong></td>
                    <td style="color: ${savings > 0 ? 'var(--color-success)' : 'inherit'}">${savings > 0 ? formatPrice(savings) : '-'}</td>
                    <td>${Math.round((savings / pp.price) * 100)}%</td>
                </tr>
                `;
            });
        });
        
        tbody.innerHTML = rowsHtml || '<tr><td colspan="6" class="admin-empty">No price data found matching filters.</td></tr>';
    }

    partnerFilter?.addEventListener('change', renderTable);
    categoryFilter?.addEventListener('change', renderTable);
    
    renderTable();
});
