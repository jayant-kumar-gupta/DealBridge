import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { isLoggedIn, logout } from '../state/auth.js';
import { promoCodes } from '../data/promo-codes.js';
import { formatPrice } from '../utils/helpers.js';
import { showToast } from '../components/toast.js';

document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initFooter();

    if (!isLoggedIn()) {
        window.location.href = '/login.html?redirect=/promo-codes.html';
        return;
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
            window.location.href = '/login.html';
        });
    }

    const container = document.getElementById('promo-list');

    if (promoCodes.length === 0) {
        container.innerHTML = '<p>No promo codes found.</p>';
        return;
    }

    function getStatusBadge(status) {
        const lower = status.toLowerCase();
        if (lower === 'available') {
            return `<span style="background: var(--color-success); color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">Available</span>`;
        } else if (lower === 'used') {
            return `<span style="background: var(--color-text-secondary); color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">Used</span>`;
        } else {
            return `<span style="background: var(--color-error); color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; opacity: 0.8;">Expired</span>`;
        }
    }

    promoCodes.forEach(promo => {
        const discountText = promo.discountType === 'flat' ? formatPrice(promo.discount) : `${promo.discount}% OFF`;
        const isAvailable = promo.status.toLowerCase() === 'available';
        
        const card = document.createElement('div');
        card.className = 'card';
        card.style.display = 'flex';
        card.style.justifyContent = 'space-between';
        card.style.alignItems = 'center';
        card.style.flexWrap = 'wrap';
        card.style.gap = 'var(--spacing-md)';
        card.style.borderLeft = `4px solid ${isAvailable ? 'var(--color-success)' : 'var(--color-border)'}`;
        
        card.innerHTML = `
            <div>
                <div style="display: flex; gap: var(--spacing-sm); align-items: center; margin-bottom: var(--spacing-xs);">
                    <div style="font-family: monospace; font-size: 1.2rem; font-weight: 700; color: var(--color-primary-dark);">${promo.code}</div>
                    ${getStatusBadge(promo.status)}
                </div>
                <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 4px;">${discountText} at ${promo.applicablePartner}</div>
                <div style="font-size: 0.9rem; color: var(--color-text-secondary);">
                    Min. Order: ${formatPrice(promo.minOrderValue)} • Valid till: ${new Date(promo.expiryDate).toLocaleDateString()}
                </div>
                ${promo.orderId ? `<div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 4px;">From Order: <a href="/order-detail.html?id=${promo.orderId}" class="link">${promo.orderId}</a></div>` : ''}
            </div>
            <div>
                ${isAvailable ? `<button class="btn btn--outline copy-btn" data-code="${promo.code}">Copy Code</button>` : ''}
            </div>
        `;
        
        container.appendChild(card);
    });

    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const code = e.target.dataset.code;
            navigator.clipboard.writeText(code);
            showToast('Promo code copied!', 'success');
            const originalText = e.target.textContent;
            e.target.textContent = 'Copied!';
            setTimeout(() => e.target.textContent = originalText, 2000);
        });
    });
});
