import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { getCart, getCartTotal, getCartSavings } from '../state/cart.js';
import { requireAuth, getCurrentUser } from '../state/auth.js';
import { getProductById } from '../data/products.js';
import { getAddressesByUser, getDefaultAddress } from '../data/addresses.js';
import { availableCheckoutCodes, validateCheckoutCode } from '../data/promo-codes.js';
import { formatPrice } from '../utils/helpers.js';

let currentStep = 1;
let selectedAddressId = null;
let appliedPromoDiscount = 0;

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth('/checkout.html')) return;
    
    const cart = getCart();
    if (cart.length === 0) {
        window.location.href = '/cart.html';
        return;
    }

    initHeader();
    initFooter();
    
    initStep1();
    updateSidebarSummary();
    setupNavigationEvents();
});

function goToStep(step) {
    document.querySelectorAll('.checkout-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.step').forEach((s, idx) => {
        if (idx + 1 < step) {
            s.classList.add('completed');
            s.classList.remove('active');
        } else if (idx + 1 === step) {
            s.classList.add('active');
            s.classList.remove('completed');
        } else {
            s.classList.remove('active', 'completed');
        }
    });

    document.getElementById(`step-${step}`).classList.add('active');
    currentStep = step;

    if (step === 2) initStep2();
    if (step === 3) initStep3();
    if (step === 4) initStep4();
}

function setupNavigationEvents() {
    document.getElementById('btn-continue-1').addEventListener('click', () => {
        if (!selectedAddressId) {
            showToast('Please select a delivery address', 'error');
            return;
        }
        goToStep(2);
    });

    document.getElementById('btn-continue-2').addEventListener('click', () => goToStep(3));
    document.getElementById('btn-continue-3').addEventListener('click', () => goToStep(4));

    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', (e) => {
            goToStep(parseInt(e.target.dataset.target));
        });
    });

    document.getElementById('btn-pay').addEventListener('click', handlePayment);

    // Payment method selection styling
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('selected'));
            e.target.closest('.payment-method-card').classList.add('selected');
        });
    });
}

function initStep1() {
    const user = getCurrentUser();
    const addresses = getAddressesByUser(user.id);
    const defaultAddr = getDefaultAddress(user.id);
    const addressList = document.getElementById('address-list');

    if (addresses.length === 0) {
        addressList.innerHTML = '<p class="text-secondary">No saved addresses found. Please add a new one.</p>';
    } else {
        let html = '';
        addresses.forEach(addr => {
            const isSelected = (defaultAddr && defaultAddr.id === addr.id) || (!defaultAddr && addr.id === addresses[0].id);
            if (isSelected) selectedAddressId = addr.id;
            
            html += `
                <label class="address-card ${isSelected ? 'selected' : ''}" data-id="${addr.id}">
                    <input type="radio" name="address" value="${addr.id}" ${isSelected ? 'checked' : ''}>
                    <div class="flex justify-between align-center mb-xs">
                        <strong>${addr.name}</strong>
                        <span class="badge" style="background: var(--color-bg);">${addr.type}</span>
                    </div>
                    <p class="text-sm text-secondary mb-xs">${addr.phone}</p>
                    <p class="text-sm">${addr.addressLine1}, ${addr.addressLine2 || ''}</p>
                    <p class="text-sm">${addr.city}, ${addr.state} - ${addr.pincode}</p>
                </label>
            `;
        });
        addressList.innerHTML = html;

        document.querySelectorAll('.address-card').forEach(card => {
            card.addEventListener('click', (e) => {
                document.querySelectorAll('.address-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                card.querySelector('input').checked = true;
                selectedAddressId = parseInt(card.dataset.id);
            });
        });
    }

    document.getElementById('btn-add-address').addEventListener('click', () => {
        showModal(`
            <form id="add-address-form">
                <div class="form-group">
                    <label class="form-label">Full Name</label>
                    <input type="text" class="form-control" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Phone Number</label>
                    <input type="tel" class="form-control" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Address Line 1</label>
                    <input type="text" class="form-control" required>
                </div>
                <div class="grid grid-cols-2 gap-md">
                    <div class="form-group">
                        <label class="form-label">City</label>
                        <input type="text" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Pincode</label>
                        <input type="text" class="form-control" required>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary btn-block mt-md">Save Address</button>
            </form>
        `, { title: 'Add New Address' });

        document.getElementById('add-address-form').addEventListener('submit', (e) => {
            e.preventDefault();
            // In a real app we'd save this, here we just fake it
            showToast('Address saved successfully!', 'success');
            document.querySelector('.modal__close').click();
        });
    });
}

function initStep2() {
    const cart = getCart();
    const container = document.getElementById('checkout-items-list');
    let html = '';

    cart.forEach(item => {
        const product = getProductById(item.productId);
        html += `
            <div class="flex align-center border-bottom pb-md mb-md">
                <img src="${product.images[0]}" alt="${product.name}" style="width: 60px; height: 60px; object-fit: contain; margin-right: var(--space-md);">
                <div style="flex: 1;">
                    <h4 class="h6 m-0">${product.name}</h4>
                    <span class="text-sm text-secondary">Qty: ${item.quantity}</span>
                </div>
                <div class="font-bold">
                    ${formatPrice(product.ourPrice * item.quantity)}
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function initStep3() {
    const promosContainer = document.getElementById('available-promos');
    let html = '';
    availableCheckoutCodes.forEach(promo => {
        html += `
            <div class="card p-md mb-sm flex justify-between align-center" style="border: 1px dashed var(--color-border);">
                <div>
                    <div class="font-bold" style="color: var(--color-primary); font-family: monospace;">${promo.code}</div>
                    <div class="text-sm text-secondary">${promo.description}</div>
                </div>
                <button class="btn btn-sm btn-secondary btn-apply-card-promo" data-code="${promo.code}">Apply</button>
            </div>
        `;
    });
    promosContainer.innerHTML = html;

    const applyBtn = document.getElementById('btn-apply-promo');
    const input = document.getElementById('promo-input');

    const handleApply = (code) => {
        if (!code) return;
        const subtotal = getCartTotal();
        const res = validateCheckoutCode(code, subtotal);
        if (res.valid) {
            appliedPromoDiscount = res.discount;
            updateSidebarSummary();
            showToast(res.message, 'success');
            input.value = code;
        } else {
            showToast(res.message, 'error');
        }
    };

    // Remove old listeners to avoid duplicates
    const newApplyBtn = applyBtn.cloneNode(true);
    applyBtn.replaceWith(newApplyBtn);
    newApplyBtn.addEventListener('click', () => handleApply(input.value.trim()));

    document.querySelectorAll('.btn-apply-card-promo').forEach(btn => {
        btn.addEventListener('click', (e) => {
            handleApply(e.target.dataset.code);
        });
    });
}

function initStep4() {
    const totalToPay = getCartTotal() - appliedPromoDiscount;
    document.getElementById('btn-pay').textContent = `Pay ${formatPrice(totalToPay)}`;
}

function updateSidebarSummary() {
    const cart = getCart();
    const itemsCount = cart.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = getCartTotal();
    const savings = getCartSavings();
    const finalTotal = subtotal - appliedPromoDiscount;

    document.getElementById('summary-items-count').textContent = `Items (${itemsCount})`;
    document.getElementById('summary-subtotal').textContent = formatPrice(subtotal);
    document.getElementById('summary-savings').textContent = `-${formatPrice(savings)}`;
    
    const promoRow = document.getElementById('promo-discount-row');
    if (appliedPromoDiscount > 0) {
        promoRow.style.display = 'flex';
        document.getElementById('summary-promo-discount').textContent = `-${formatPrice(appliedPromoDiscount)}`;
    } else {
        promoRow.style.display = 'none';
    }

    document.getElementById('summary-total').textContent = formatPrice(finalTotal);
}

function handlePayment() {
    const btn = document.getElementById('btn-pay');
    btn.disabled = true;
    btn.textContent = 'Processing...';

    setTimeout(() => {
        // Redirect to confirmation page
        window.location.href = '/confirmation.html';
    }, 1500);
}
