import { initAdminLayout } from '../../components/admin-layout.js';
import { reviews } from '../../data/reviews.js';
import { formatDate, truncateText } from '../../utils/helpers.js';

document.addEventListener('DOMContentLoaded', () => {
    initAdminLayout();
    const tbody = document.getElementById('reviews-table-body');
    if (tbody) {
        tbody.innerHTML = reviews.map(review => `
            <tr>
                <td>#${review.productId}</td>
                <td><strong>${review.userName}</strong></td>
                <td>⭐ ${review.rating}/5</td>
                <td>${formatDate(review.date)}</td>
                <td style="max-width: 300px;">${truncateText(review.comment, 50)}</td>
            </tr>
        `).join('');
    }
});
