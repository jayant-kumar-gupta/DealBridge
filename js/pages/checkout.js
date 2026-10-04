import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { getCart, getCartTotal, getCartSavings, fetchCart, clearCart } from '../state/cart.js?v=2.1';
import { requireAuth, getCurrentUser } from '../state/auth.js';
import { api } from '../utils/api.js';
import { formatPrice } from '../utils/helpers.js';

let currentStep = 1;
let selectedAddressId = null;
let userAddresses = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;

    initHeader();
    initFooter();

    // Ensure cart is synced with backend
    const cart = await fetchCart();
    if (!cart || cart.length === 0) {
        window.location.href = '/cart.html';
        return;
    }

    updateSidebarSummary();
    setupNavigationEvents();
    await loadAddresses();
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

    const targetSection = document.getElementById(`step-${step}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    currentStep = step;

    if (step === 1) renderAddressList();
    if (step === 2) initStep2();
    if (step === 3) initStep3();
}

function setupNavigationEvents() {
    document.getElementById('btn-continue-1').addEventListener('click', async () => {
        if (!selectedAddressId) {
            showToast('Please select a delivery address', 'error');
            return;
        }

        // Ensure selected address is marked as default in backend
        const selected = userAddresses.find(a => a.id === selectedAddressId);
        if (selected && !selected.isdefault) {
            try {
                // First unset existing default address in backend
                const oldDefaults = userAddresses.filter(a => a.id !== selected.id && a.isdefault);
                for (const old of oldDefaults) {
                    await api.put(`/addresses/${old.id}`, {
                        address_line1: old.address_line1,
                        address_line2: old.address_line2 || null,
                        city: old.city,
                        state: old.state,
                        pincode: Number(old.pincode),
                        type: old.type || 'Home',
                        isdefault: false
                    });
                    old.isdefault = false;
                }

                await api.put(`/addresses/${selected.id}`, {
                    address_line1: selected.address_line1,
                    address_line2: selected.address_line2 || null,
                    city: selected.city,
                    state: selected.state,
                    pincode: Number(selected.pincode),
                    type: selected.type || 'Home',
                    isdefault: true
                });
                userAddresses.forEach(a => {
                    a.isdefault = (a.id === selected.id);
                });
            } catch (err) {
                console.warn('Failed to set address as default:', err);
            }
        }

        goToStep(2);
    });

    document.getElementById('btn-continue-2').addEventListener('click', () => goToStep(3));

    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = parseInt(e.currentTarget.dataset.target, 10);
            if (!isNaN(target)) {
                goToStep(target);
            }
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

    const addAddressBtn = document.getElementById('btn-add-address');
    if (addAddressBtn) {
        addAddressBtn.addEventListener('click', openAddAddressModal);
    }
}

async function loadAddresses() {
    const addressList = document.getElementById('address-list');
    addressList.innerHTML = '<p class="text-secondary">Loading saved addresses...</p>';

    try {
        const data = await api.get('/addresses/');
        userAddresses = Array.isArray(data) ? data : [];
        renderAddressList();
    } catch (err) {
        console.error('Error fetching addresses:', err);
        addressList.innerHTML = '<p class="text-error">Failed to load addresses. Please refresh or add a new one.</p>';
    }
}

function renderAddressList() {
    const addressList = document.getElementById('address-list');
    const user = getCurrentUser() || {};
    const userName = `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'User';
    const userPhone = user.phone || '';

    if (userAddresses.length === 0) {
        addressList.innerHTML = '<p class="text-secondary">No saved addresses found. Please add a new delivery address.</p>';
        selectedAddressId = null;
        return;
    }

    const defaultAddr = userAddresses.find(a => a.isdefault) || userAddresses[0];
    const defaultId = defaultAddr ? defaultAddr.id : null;
    if (!selectedAddressId && defaultAddr) {
        selectedAddressId = defaultAddr.id;
    }

    let html = '';
    userAddresses.forEach(addr => {
        const isSelected = selectedAddressId === addr.id;
        const isDefault = addr.id === defaultId;
        html += `
            <label class="address-card ${isSelected ? 'selected' : ''}" data-id="${addr.id}">
                <input type="radio" name="address" value="${addr.id}" ${isSelected ? 'checked' : ''}>
                <div class="flex justify-between align-center mb-xs">
                    <strong>${userName}</strong>
                    <div class="flex gap-xs align-center">
                        <span class="badge" style="background: var(--color-bg);">${addr.type || 'Home'}</span>
                        ${isDefault ? '<span class="badge" style="background: var(--color-primary-light); color: var(--color-primary-dark);">Default</span>' : ''}
                    </div>
                </div>
                ${userPhone ? `<p class="text-sm text-secondary mb-xs">${userPhone}</p>` : ''}
                <p class="text-sm">${addr.address_line1}${addr.address_line2 ? `, ${addr.address_line2}` : ''}</p>
                <p class="text-sm">${addr.city}, ${addr.state} - ${addr.pincode}</p>
            </label>
        `;
    });

    addressList.innerHTML = html;

    addressList.querySelectorAll('.address-card').forEach(card => {
        card.addEventListener('click', () => {
            addressList.querySelectorAll('.address-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            const radio = card.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
            selectedAddressId = parseInt(card.dataset.id, 10);
        });
    });
}

function openAddAddressModal() {
    showModal(`
        <form id="add-address-form" style="display: flex; flex-direction: column; gap: var(--space-md);">
            <div class="form-group">
                <label class="form-label">Address Line 1 *</label>
                <input type="text" id="modal-address1" class="form-control" required placeholder="Flat, House no., Building, Street">
            </div>
            <div class="form-group">
                <label class="form-label">Address Line 2 (Optional)</label>
                <input type="text" id="modal-address2" class="form-control" placeholder="Area, Landmark, Sector">
            </div>
            <div class="grid grid-cols-2 gap-md">
                <div class="form-group">
                    <label class="form-label">City *</label>
                    <input type="text" id="modal-city" class="form-control" required placeholder="City">
                </div>
                <div class="form-group">
                    <label class="form-label">State *</label>
                    <input type="text" id="modal-state" class="form-control" required placeholder="State">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-md">
                <div class="form-group">
                    <label class="form-label">Pincode *</label>
                    <input type="number" id="modal-pincode" class="form-control" required placeholder="6-digit pincode">
                </div>
                <div class="form-group">
                    <label class="form-label">Address Type</label>
                    <select id="modal-type" class="form-control">
                        <option value="Home">Home</option>
                        <option value="Work">Work</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
            </div>
            <button type="submit" id="btn-submit-address" class="btn btn-primary btn-block mt-md">Save & Select Address</button>
        </form>
    `, { title: 'Add New Delivery Address' });

    const form = document.getElementById('add-address-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('btn-submit-address');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        const address1 = document.getElementById('modal-address1').value.trim();
        const address2 = document.getElementById('modal-address2').value.trim() || null;
        const city = document.getElementById('modal-city').value.trim();
        const state = document.getElementById('modal-state').value.trim();
        const pincode = parseInt(document.getElementById('modal-pincode').value.trim(), 10);
        const type = document.getElementById('modal-type').value;

        try {
            const isFirst = userAddresses.length === 0;
            const newAddress = await api.post('/addresses/', {
                address_line1: address1,
                address_line2: address2,
                city,
                state,
                pincode,
                type,
                isdefault: isFirst
            });

            userAddresses.push(newAddress);
            selectedAddressId = newAddress.id;
            renderAddressList();

            const closeBtn = document.querySelector('.modal__close');
            if (closeBtn) closeBtn.click();

            showToast('Address added successfully!', 'success');
        } catch (err) {
            console.error('Failed to create address:', err);
            showToast(err.message || 'Failed to save address', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save & Select Address';
        }
    });
}

function initStep2() {
    const cart = getCart();
    const container = document.getElementById('checkout-items-list');
    let html = '';

    cart.forEach(item => {
        const name = item.name || 'Product';
        const price = item.price ?? item.our_deal ?? 0;
        const image = item.image_path || item.image || '/assets/images/placeholder.jpg';
        const totalItemPrice = Math.round(price * item.quantity * 100) / 100;

        html += `
            <div class="flex align-center border-bottom pb-md mb-md">
                <img src="${image}" alt="${name}" style="width: 60px; height: 60px; object-fit: contain; margin-right: var(--space-md); border-radius: var(--radius-sm); border: 1px solid var(--color-border);">
                <div style="flex: 1;">
                    <h4 class="h6 m-0">${name}</h4>
                    <span class="text-sm text-secondary">Qty: ${item.quantity} × ${formatPrice(price)}</span>
                </div>
                <div class="font-bold">
                    ${formatPrice(totalItemPrice)}
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function initStep3() {
    const totalToPay = getCartTotal();
    const btn = document.getElementById('btn-pay');
    if (btn) {
        btn.textContent = `Pay ${formatPrice(totalToPay)}`;
    }
}

function updateSidebarSummary() {
    const cart = getCart();
    const itemsCount = cart.reduce((sum, i) => sum + i.quantity, 0);
    const total = getCartTotal();
    const savings = getCartSavings();

    const countEl = document.getElementById('summary-items-count');
    const subtotalEl = document.getElementById('summary-subtotal');
    const savingsEl = document.getElementById('summary-savings');
    const totalEl = document.getElementById('summary-total');

    if (countEl) countEl.textContent = `Items (${itemsCount})`;
    if (subtotalEl) subtotalEl.textContent = formatPrice(total);
    if (savingsEl) savingsEl.textContent = `-${formatPrice(savings)}`;
    if (totalEl) totalEl.textContent = formatPrice(total);
}

async function handlePayment() {
    const cart = getCart();
    if (!cart || cart.length === 0) {
        showToast('Your cart is empty', 'error');
        window.location.href = '/cart.html';
        return;
    }

    if (!selectedAddressId) {
        showToast('Please select a delivery address', 'error');
        goToStep(1);
        return;
    }

    const btn = document.getElementById('btn-pay');
    btn.disabled = true;
    btn.textContent = 'Processing Payment...';

    try {
        // Compute required total matching backend calculation:
        // required_amount += round(item.quantity * product.our_deal, 2)
        const totalAmount = Math.round(cart.reduce((sum, item) => {
            const price = Number(item.price ?? item.our_deal ?? 0);
            return sum + Math.round(item.quantity * price * 100) / 100;
        }, 0) * 100) / 100;

        const orderResult = await api.post('/orders/', {
            amount_paid: totalAmount
        });

        // Clear frontend cart now that order is created and backend cart is cleared
        clearCart();

        showToast('Payment successful! Order placed.', 'success');

        const orderId = orderResult?.order_detail?.id;
        setTimeout(() => {
            if (orderId) {
                window.location.href = `/confirmation.html?id=${orderId}`;
            } else {
                window.location.href = '/orders.html';
            }
        }, 600);
    } catch (err) {
        console.error('Order creation failed:', err);
        showToast(err.message || 'Payment processing failed. Please try again.', 'error');
        btn.disabled = false;
        initStep3();
    }
}
