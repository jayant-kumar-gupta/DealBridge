import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { isLoggedIn, logout } from '../state/auth.js';
import { addresses } from '../data/addresses.js';
import { showToast } from '../components/toast.js';

document.addEventListener('DOMContentLoaded', () => {
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

    let currentAddresses = [...addresses];

    function renderAddresses() {
        const container = document.getElementById('addresses-grid');
        container.innerHTML = '';

        currentAddresses.forEach(addr => {
            const card = document.createElement('div');
            card.className = 'card';
            card.style.position = 'relative';
            if (addr.isDefault) {
                card.style.borderColor = 'var(--color-primary)';
                card.style.boxShadow = '0 0 0 1px var(--color-primary)';
            }
            
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-sm);">
                    <div style="display: flex; gap: var(--spacing-xs); align-items: center;">
                        <span style="background: var(--color-bg); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase;">
                            ${addr.type}
                        </span>
                        ${addr.isDefault ? `<span style="background: var(--color-primary-light); color: var(--color-primary-dark); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">Default</span>` : ''}
                    </div>
                </div>
                <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 4px;">${addr.name}</div>
                <div style="color: var(--color-text-secondary); margin-bottom: 8px;">${addr.phone}</div>
                <div style="line-height: 1.5; color: var(--color-text-secondary); margin-bottom: var(--spacing-md);">
                    ${addr.addressLine1}<br>
                    ${addr.addressLine2 ? addr.addressLine2 + '<br>' : ''}
                    ${addr.city}, ${addr.state} - ${addr.pincode}
                </div>
                <div style="display: flex; gap: var(--spacing-sm); margin-top: auto;">
                    <button class="btn btn--outline btn--sm edit-btn" data-id="${addr.id}">Edit</button>
                    <button class="btn btn--outline btn--sm delete-btn" data-id="${addr.id}" style="color: var(--color-error); border-color: var(--color-error);">Delete</button>
                    ${!addr.isDefault ? `<button class="btn btn--outline btn--sm default-btn" data-id="${addr.id}" style="margin-left: auto;">Set Default</button>` : ''}
                </div>
            `;
            container.appendChild(card);
        });

        // Events
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                openModal(id);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (confirm('Are you sure you want to delete this address?')) {
                    const id = parseInt(e.target.dataset.id);
                    currentAddresses = currentAddresses.filter(a => a.id !== id);
                    renderAddresses();
                    showToast('Address deleted');
                }
            });
        });

        document.querySelectorAll('.default-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                currentAddresses.forEach(a => a.isDefault = (a.id === id));
                renderAddresses();
                showToast('Default address updated');
            });
        });
    }

    renderAddresses();

    const modal = document.getElementById('address-modal');
    const form = document.getElementById('address-form');
    let editingId = null;

    document.getElementById('add-address-btn').addEventListener('click', () => {
        openModal();
    });

    document.getElementById('close-modal').addEventListener('click', () => {
        modal.close();
    });

    function openModal(id = null) {
        editingId = id;
        if (id) {
            document.getElementById('modal-title').textContent = 'Edit Address';
            const addr = currentAddresses.find(a => a.id === id);
            document.getElementById('name').value = addr.name;
            document.getElementById('phone').value = addr.phone;
            document.getElementById('addressLine1').value = addr.addressLine1;
            document.getElementById('addressLine2').value = addr.addressLine2 || '';
            document.getElementById('city').value = addr.city;
            document.getElementById('state').value = addr.state;
            document.getElementById('pincode').value = addr.pincode;
            document.getElementById('type').value = addr.type;
        } else {
            document.getElementById('modal-title').textContent = 'Add Address';
            form.reset();
        }
        modal.showModal();
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const newAddr = {
            id: editingId || Date.now(),
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            addressLine1: document.getElementById('addressLine1').value,
            addressLine2: document.getElementById('addressLine2').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            pincode: document.getElementById('pincode').value,
            type: document.getElementById('type').value,
            isDefault: currentAddresses.length === 0
        };

        if (editingId) {
            const index = currentAddresses.findIndex(a => a.id === editingId);
            newAddr.isDefault = currentAddresses[index].isDefault;
            currentAddresses[index] = newAddr;
            showToast('Address updated successfully', 'success');
        } else {
            currentAddresses.push(newAddr);
            showToast('Address added successfully', 'success');
        }
        
        modal.close();
        renderAddresses();
    });
});
