import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { isLoggedIn, logout } from '../state/auth.js';
import { getOrderById } from '../data/orders.js';
import { products } from '../data/products.js';
import { formatPrice } from '../utils/helpers.js';
import { showToast } from '../components/toast.js';

document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initFooter();

    if (!isLoggedIn()) {
        window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
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

    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    const container = document.getElementById('order-container');

    if (!orderId) {
        container.innerHTML = '<div class="alert alert--error">Order ID not found.</div>';
        return;
    }

    const order = getOrderById(orderId);
    if (!order) {
        container.innerHTML = '<div class="alert alert--error">Order not found.</div>';
        return;
    }

    let timelineHtml = '<ul class="timeline" id="order-timeline">';
    if (order.timeline) {
        order.timeline.forEach((step, index) => {
            timelineHtml += `
                <li class="timeline-step ${step.completed ? 'completed' : ''}" data-index="${index}">
                    <div class="timeline-indicator"></div>
                    <div class="timeline-content">
                        <div class="timeline-title">${step.status}</div>
                        <div class="timeline-date">${step.date}</div>
                    </div>
                </li>
            `;
        });
    }
    timelineHtml += '</ul>';
    
    // Support advancing timeline for demo
    timelineHtml += `<button class="btn btn--outline btn--sm" id="simulate-btn" style="margin-top: var(--spacing-sm);">Simulate Status Change</button>`;

    let itemsHtml = '<div style="margin-top: var(--spacing-lg);"><h3>Items</h3><div style="margin-top: var(--spacing-md); border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden;">';
    order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        itemsHtml += `
            <div style="display: flex; gap: var(--spacing-md); padding: var(--spacing-md); border-bottom: 1px solid var(--color-border);">
                <img src="${product ? product.images[0] : '/assets/images/products/product-1.jpg'}" alt="${product ? product.name : 'Product'}" style="width: 80px; height: 80px; object-fit: cover; border-radius: var(--radius-sm);">
                <div style="flex: 1;">
                    <div style="font-weight: 600;">${product ? product.name : 'Product'}</div>
                    <div style="color: var(--color-text-secondary); font-size: 0.9rem;">Qty: ${item.quantity}</div>
                </div>
                <div style="font-weight: 600;">${formatPrice(item.price * item.quantity)}</div>
            </div>
        `;
    });
    itemsHtml += '</div></div>';

    let promoHtml = '';
    if (order.promoCode) {
        promoHtml = `
            <div class="promo-box">
                <p style="margin-bottom: var(--spacing-xs); font-weight: 500;">Partner Redemption Code (${order.partnerName})</p>
                <div class="promo-code-text" id="promo-code">${order.promoCode}</div>
                <button class="btn btn--primary btn--sm" id="copy-btn" style="margin-top: var(--spacing-md);">Copy Code</button>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="card" style="margin-bottom: var(--spacing-lg);">
            <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: var(--spacing-md); border-bottom: 1px solid var(--color-border); padding-bottom: var(--spacing-md); margin-bottom: var(--spacing-md);">
                <div>
                    <h2 style="margin-bottom: var(--spacing-xs);">Order ${order.id}</h2>
                    <p style="color: var(--color-text-secondary);">Placed on ${new Date(order.date).toLocaleDateString()}</p>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 1.2rem; font-weight: 700; color: var(--color-primary); margin-bottom: var(--spacing-xs);">${formatPrice(order.total)}</div>
                    <span style="padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; background: var(--color-bg); border: 1px solid var(--color-border); text-transform: uppercase;">
                        ${order.status}
                    </span>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--spacing-xl);">
                <div>
                    <h3>Order Status</h3>
                    ${timelineHtml}
                </div>
                <div>
                    <h3>Payment Details</h3>
                    <div style="background: var(--color-bg); padding: var(--spacing-md); border-radius: var(--radius-md); margin-top: var(--spacing-md);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-xs);">
                            <span style="color: var(--color-text-secondary);">Subtotal</span>
                            <span>${formatPrice(order.subtotal)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-xs); color: var(--color-deal);">
                            <span>Discount</span>
                            <span>-${formatPrice(order.discount)}</span>
                        </div>
                        <hr style="border: none; border-top: 1px solid var(--color-border); margin: var(--spacing-sm) 0;">
                        <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 1.1rem;">
                            <span>Total</span>
                            <span>${formatPrice(order.total)}</span>
                        </div>
                        <div style="margin-top: var(--spacing-md); font-size: 0.9rem;">
                            <span style="color: var(--color-text-secondary);">Paid via:</span> ${order.paymentMethod}
                        </div>
                    </div>
                    
                    ${promoHtml}
                </div>
            </div>
            
            ${itemsHtml}
        </div>
    `;

    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(order.promoCode);
            showToast('Promo code copied to clipboard!', 'success');
            copyBtn.textContent = 'Copied!';
            setTimeout(() => copyBtn.textContent = 'Copy Code', 2000);
        });
    }

    const simulateBtn = document.getElementById('simulate-btn');
    if (simulateBtn && order.timeline) {
        simulateBtn.addEventListener('click', () => {
            const pendingStepIndex = order.timeline.findIndex(s => !s.completed);
            if (pendingStepIndex !== -1) {
                order.timeline[pendingStepIndex].completed = true;
                order.timeline[pendingStepIndex].date = new Date().toLocaleString();
                
                const stepEl = document.querySelector(`.timeline-step[data-index="${pendingStepIndex}"]`);
                if (stepEl) {
                    stepEl.classList.add('completed');
                    stepEl.querySelector('.timeline-date').textContent = order.timeline[pendingStepIndex].date;
                }
                
                if (pendingStepIndex === order.timeline.length - 1) {
                    order.status = 'delivered';
                    showToast('Order delivered!', 'success');
                    simulateBtn.style.display = 'none';
                    // Update header status
                    const statusBadge = document.querySelector('span[style*="uppercase"]');
                    if (statusBadge) statusBadge.textContent = 'delivered';
                } else {
                    showToast(`Status updated to: ${order.timeline[pendingStepIndex].status}`, 'success');
                }
            } else {
                showToast('All steps completed', 'info');
                simulateBtn.style.display = 'none';
            }
        });
    }
});
