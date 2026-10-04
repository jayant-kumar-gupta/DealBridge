import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { isLoggedIn, getCurrentUser, logout } from '../state/auth.js';
import { api } from '../utils/api.js';
import { showToast } from '../components/toast.js';

let currentAddresses = [];
let editingId = null;

document.addEventListener('DOMContentLoaded', async () => {
    initHeader();
    initFooter();

    if (!isLoggedIn()) {
        window.location.href = '/login.html?redirect=/addresses.html';
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

    setupModalAndForm();
    await loadAddresses();
});

async function loadAddresses() {
    const container = document.getElementById('addresses-grid');
    container.innerHTML = '<p class="text-secondary" style="padding: 1.5rem;">Loading your saved addresses...</p>';

    try {
        const data = await api.get('/addresses/');
        currentAddresses = Array.isArray(data) ? data : [];

        // Self-healing: Ensure at most one address is marked default
        const defaultAddrs = currentAddresses.filter(a => a.isdefault);
        if (defaultAddrs.length > 1) {
            // Keep the first default, unset the rest in database
            for (let i = 1; i < defaultAddrs.length; i++) {
                const extra = defaultAddrs[i];
                extra.isdefault = false;
                api.put(`/addresses/${extra.id}`, {
                    address_line1: extra.address_line1,
                    address_line2: extra.address_line2 || null,
                    city: extra.city,
                    state: extra.state,
                    pincode: Number(extra.pincode),
                    type: extra.type || 'Home',
                    isdefault: false
                }).catch(err => console.warn('Failed to unset extra default address:', err));
            }
        }

        renderAddresses();
    } catch (err) {
        console.error('Failed to load addresses:', err);
        container.innerHTML = '<p class="text-error" style="padding: 1.5rem;">Failed to load addresses. Please refresh or log in again.</p>';
    }
}

function renderAddresses() {
    const container = document.getElementById('addresses-grid');
    container.innerHTML = '';

    const user = getCurrentUser() || {};
    const userName = `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'My Address';
    const userPhone = user.phone || '';

    if (currentAddresses.length === 0) {
        container.innerHTML = '<p class="text-secondary" style="padding: 1.5rem; grid-column: 1 / -1;">No addresses saved yet. Click "+ Add New Address" above to add one.</p>';
        return;
    }

    // Defensive check: identify which single address is default
    const defaultItem = currentAddresses.find(a => a.isdefault);
    const defaultId = defaultItem ? defaultItem.id : null;

    currentAddresses.forEach(addr => {
        const isDefault = addr.id === defaultId;
        const card = document.createElement('div');
        card.className = 'card';
        card.style.position = 'relative';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        if (isDefault) {
            card.style.borderColor = 'var(--color-primary)';
            card.style.boxShadow = '0 0 0 1px var(--color-primary)';
        }

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-sm);">
                <div style="display: flex; gap: var(--spacing-xs); align-items: center;">
                    <span style="background: var(--color-bg); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase;">
                        ${addr.type || 'Home'}
                    </span>
                    ${isDefault ? `<span style="background: var(--color-primary-light); color: var(--color-primary-dark); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">Default</span>` : ''}
                </div>
            </div>
            <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 4px;">${userName}</div>
            ${userPhone ? `<div style="color: var(--color-text-secondary); margin-bottom: 8px;">${userPhone}</div>` : ''}
            <div style="line-height: 1.5; color: var(--color-text-secondary); margin-bottom: var(--spacing-md); flex: 1;">
                ${addr.address_line1}<br>
                ${addr.address_line2 ? `${addr.address_line2}<br>` : ''}
                ${addr.city}, ${addr.state} - ${addr.pincode}
            </div>
            <div class="address-card-actions">
                <button class="address-card-action edit-btn" data-id="${addr.id}">Edit</button>
                <button class="address-card-action address-card-action--delete delete-btn" data-id="${addr.id}">Delete</button>
                ${!isDefault ? `<button class="address-card-action address-card-action--default default-btn" data-id="${addr.id}">Set Default</button>` : ''}
            </div>
        `;
        container.appendChild(card);
    });

    // Edit buttons
    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id, 10);
            openModal(id);
        });
    });

    // Delete buttons
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt(e.currentTarget.dataset.id, 10);
            if (!confirm('Are you sure you want to delete this address?')) return;

            try {
                const wasDefault = currentAddresses.find(a => a.id === id)?.isdefault;
                await api.delete(`/addresses/${id}`);
                currentAddresses = currentAddresses.filter(a => a.id !== id);

                // If deleted address was default and there are remaining addresses, promote the first one
                if (wasDefault && currentAddresses.length > 0) {
                    const newDefault = currentAddresses[0];
                    try {
                        await api.put(`/addresses/${newDefault.id}`, {
                            address_line1: newDefault.address_line1,
                            address_line2: newDefault.address_line2 || null,
                            city: newDefault.city,
                            state: newDefault.state,
                            pincode: Number(newDefault.pincode),
                            type: newDefault.type || 'Home',
                            isdefault: true
                        });
                        newDefault.isdefault = true;
                    } catch (e) {
                        console.warn('Failed to promote new default address:', e);
                    }
                }

                renderAddresses();
                showToast('Address deleted successfully', 'success');
            } catch (err) {
                console.error('Failed to delete address:', err);
                showToast(err.message || 'Failed to delete address', 'error');
            }
        });
    });

    // Set Default buttons
    container.querySelectorAll('.default-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt(e.currentTarget.dataset.id, 10);
            const target = currentAddresses.find(a => a.id === id);
            if (!target) return;

            btn.disabled = true;

            try {
                // First unset any other addresses that are currently default
                const oldDefaults = currentAddresses.filter(a => a.id !== id && a.isdefault);
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

                // Set target address as default
                await api.put(`/addresses/${id}`, {
                    address_line1: target.address_line1,
                    address_line2: target.address_line2 || null,
                    city: target.city,
                    state: target.state,
                    pincode: Number(target.pincode),
                    type: target.type || 'Home',
                    isdefault: true
                });

                currentAddresses.forEach(a => {
                    a.isdefault = (a.id === id);
                });
                renderAddresses();
                showToast('Default address updated', 'success');
            } catch (err) {
                console.error('Failed to set default address:', err);
                showToast(err.message || 'Failed to set default address', 'error');
                btn.disabled = false;
            }
        });
    });
}

function setupModalAndForm() {
    const modal = document.getElementById('address-modal');
    const form = document.getElementById('address-form');
    const addBtn = document.getElementById('add-address-btn');
    const closeBtn = document.getElementById('close-modal');

    if (addBtn) {
        addBtn.addEventListener('click', () => openModal(null));
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (modal.close) modal.close();
            else modal.style.display = 'none';
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving...';

            const addressLine1 = document.getElementById('addressLine1').value.trim();
            const addressLine2 = document.getElementById('addressLine2').value.trim() || null;
            const city = document.getElementById('city').value.trim();
            const state = document.getElementById('state').value.trim();
            const pincode = parseInt(document.getElementById('pincode').value.trim(), 10);
            const typeValue = document.getElementById('type').value;
            const type = typeValue.charAt(0).toUpperCase() + typeValue.slice(1);

            try {
                if (editingId) {
                    const existing = currentAddresses.find(a => a.id === editingId);
                    const isDef = existing ? existing.isdefault : false;

                    const updated = await api.put(`/addresses/${editingId}`, {
                        address_line1: addressLine1,
                        address_line2: addressLine2,
                        city,
                        state,
                        pincode,
                        type,
                        isdefault: isDef
                    });

                    const idx = currentAddresses.findIndex(a => a.id === editingId);
                    if (idx !== -1) currentAddresses[idx] = updated;
                    showToast('Address updated successfully', 'success');
                } else {
                    const isFirst = currentAddresses.length === 0;
                    const created = await api.post('/addresses/', {
                        address_line1: addressLine1,
                        address_line2: addressLine2,
                        city,
                        state,
                        pincode,
                        type,
                        isdefault: isFirst
                    });

                    currentAddresses.push(created);
                    showToast('Address added successfully', 'success');
                }

                if (modal.close) modal.close();
                else modal.style.display = 'none';

                renderAddresses();
            } catch (err) {
                console.error('Failed to save address:', err);
                showToast(err.message || 'Failed to save address', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Save';
            }
        });
    }
}

function openModal(id = null) {
    editingId = id;
    const modal = document.getElementById('address-modal');
    const form = document.getElementById('address-form');
    const user = getCurrentUser() || {};

    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    if (nameInput) nameInput.value = `${user.firstname || ''} ${user.lastname || ''}`.trim();
    if (phoneInput) phoneInput.value = user.phone || '';

    if (id) {
        document.getElementById('modal-title').textContent = 'Edit Address';
        const addr = currentAddresses.find(a => a.id === id);
        if (addr) {
            document.getElementById('addressLine1').value = addr.address_line1 || '';
            document.getElementById('addressLine2').value = addr.address_line2 || '';
            document.getElementById('city').value = addr.city || '';
            document.getElementById('state').value = addr.state || '';
            document.getElementById('pincode').value = addr.pincode || '';
            document.getElementById('type').value = (addr.type || 'home').toLowerCase();
        }
    } else {
        document.getElementById('modal-title').textContent = 'Add New Address';
        document.getElementById('addressLine1').value = '';
        document.getElementById('addressLine2').value = '';
        document.getElementById('city').value = '';
        document.getElementById('state').value = '';
        document.getElementById('pincode').value = '';
        document.getElementById('type').value = 'home';
    }

    if (modal.showModal) {
        modal.showModal();
    } else {
        modal.style.display = 'block';
    }
}
