import { initAdminLayout } from '../../components/admin-layout.js';
import { api } from '../../utils/api.js';
import { formatDate, formatPrice } from '../../utils/helpers.js';
import { getCurrentUser } from '../../state/auth.js';
import { showToast } from '../../components/toast.js';
import { showModal, closeModal, confirmModal } from '../../components/modal.js';

let users = [];
let orders = [];
let searchQuery = '';
let roleFilter = '';

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', async () => {
    initAdminLayout();
    setupControls();
    await loadData();
});

function setupControls() {
    const addAdminBtn = document.getElementById('add-admin-btn');
    if (addAdminBtn) {
        addAdminBtn.addEventListener('click', openAddAdminModal);
    }

    const searchInput = document.getElementById('user-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderTable();
        });
    }

    const roleSelect = document.getElementById('user-role-filter');
    if (roleSelect) {
        roleSelect.addEventListener('change', (e) => {
            roleFilter = e.target.value;
            renderTable();
        });
    }
}

async function loadData() {
    const tbody = document.getElementById('users-table-body');
    const countBadge = document.getElementById('users-count-badge');

    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--color-text-secondary);">
                    Loading users and orders from server...
                </td>
            </tr>
        `;
    }
    if (countBadge) {
        countBadge.textContent = 'Loading users...';
    }

    try {
        const [usersData, ordersData] = await Promise.all([
            api.get('/login/users'),
            api.get('/orders/').catch(err => {
                console.warn('Failed to load orders for user metrics:', err);
                return [];
            })
        ]);

        const rawUsers = Array.isArray(usersData) ? usersData : [];
        users = rawUsers.map(normalizeUserData);
        orders = Array.isArray(ordersData) ? ordersData : [];

        renderTable();
    } catch (err) {
        console.error('Failed to load admin users:', err);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--color-error);">
                        Failed to load users: ${escapeHtml(err.message || 'Server error')}
                    </td>
                </tr>
            `;
        }
        if (countBadge) {
            countBadge.textContent = 'Error loading users';
        }
        showToast(err.message || 'Failed to load users from backend', 'error');
    }
}

function normalizeUserData(raw) {
    const id = raw.id;
    let name = raw.name || [raw.firstname, raw.lastname].filter(Boolean).join(' ').trim();
    if (!name) {
        name = raw.email ? raw.email.split('@')[0] : (raw.phone ? `User (${raw.phone})` : `User #${id}`);
    }
    const email = raw.email || '';
    const phone = raw.phone || '';
    const is_admin = Boolean(raw.is_admin || raw.role === 'admin');
    const role = is_admin ? 'admin' : (raw.role || 'user');
    const joinDateRaw = raw.join_date || raw.joinDate;
    const formattedJoinDate = joinDateRaw ? formatDate(joinDateRaw) : 'Jan 2026';

    return {
        id,
        name,
        email,
        phone,
        role,
        is_admin,
        joinDate: formattedJoinDate,
        rawJoinDate: joinDateRaw
    };
}

function getUserOrders(userId) {
    return orders.filter(o => {
        const oUserId = o.order_detail ? o.order_detail.user_id : (o.user_id || o.userId);
        return oUserId === userId;
    });
}

function renderTable() {
    const tbody = document.getElementById('users-table-body');
    const countBadge = document.getElementById('users-count-badge');
    if (!tbody) return;

    const currentAdmin = getCurrentUser();

    const filtered = users.filter(user => {
        if (roleFilter && user.role !== roleFilter) return false;
        if (!searchQuery) return true;
        const q = searchQuery;
        return (
            String(user.id).includes(q) ||
            (user.name && user.name.toLowerCase().includes(q)) ||
            (user.email && user.email.toLowerCase().includes(q)) ||
            (user.phone && user.phone.toLowerCase().includes(q))
        );
    });

    if (countBadge) {
        countBadge.textContent = `Showing ${filtered.length} of ${users.length} users`;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="admin-empty">
                    ${users.length === 0 ? 'No registered users found.' : 'No users match your search and filter criteria.'}
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(user => {
        const userOrders = getUserOrders(user.id);
        const orderCount = userOrders.length;
        const isSelf = currentAdmin && currentAdmin.id === user.id;

        // Generate avatar initials
        const initials = user.name
            .split(' ')
            .filter(Boolean)
            .map(p => p[0].toUpperCase())
            .slice(0, 2)
            .join('') || 'U';

        const avatarBg = user.role === 'admin' ? 'var(--color-primary-light, #e0f2fe)' : 'var(--color-surface-hover, #f3f4f6)';
        const avatarColor = user.role === 'admin' ? 'var(--color-primary, #0ea5e9)' : 'var(--color-text-secondary, #6b7280)';

        return `
            <tr>
                <td><strong>#${user.id}</strong></td>
                <td>
                    <div style="display: flex; align-items: center; gap: var(--space-sm);">
                        <div style="width: 36px; height: 36px; border-radius: 50%; background: ${avatarBg}; color: ${avatarColor}; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.85rem; flex-shrink: 0; border: 1px solid var(--color-border);">
                            ${escapeHtml(initials)}
                        </div>
                        <div>
                            <div style="font-weight: 600; color: var(--color-text);">
                                ${escapeHtml(user.name)}
                                ${isSelf ? '<span style="font-size: 0.75rem; margin-left: 4px; padding: 2px 6px; border-radius: 4px; background: var(--color-primary-light); color: var(--color-primary); font-weight: 500;">You</span>' : ''}
                            </div>
                            <div style="font-size: 0.8rem; color: var(--color-text-secondary);">
                                ${escapeHtml(user.email || user.phone || 'ID #' + user.id)}
                            </div>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="font-size: 0.85rem;">
                        ${user.phone ? `<div style="display: flex; align-items: center; gap: 4px;"><span>📞</span> <span>${escapeHtml(user.phone)}</span></div>` : ''}
                        ${user.email ? `<div style="display: flex; align-items: center; gap: 4px; color: var(--color-text-secondary);"><span>✉️</span> <span>${escapeHtml(user.email)}</span></div>` : (!user.phone ? '<span style="color: var(--color-text-secondary); font-style: italic;">No contact info</span>' : '')}
                    </div>
                </td>
                <td>
                    <span class="badge" style="background-color: ${user.role === 'admin' ? 'var(--color-primary)' : 'var(--color-surface-hover)'}; color: ${user.role === 'admin' ? 'white' : 'var(--color-text)'}; border: 1px solid ${user.role === 'admin' ? 'var(--color-primary)' : 'var(--color-border)'}; font-weight: 600;">
                        ${user.role === 'admin' ? '🛡️ Admin' : '👤 Customer'}
                    </span>
                </td>
                <td>${user.joinDate}</td>
                <td style="text-align: center;">
                    <span class="badge" style="background-color: ${orderCount > 0 ? 'var(--color-surface-hover)' : 'transparent'}; font-weight: 600;">
                        ${orderCount}
                    </span>
                </td>
                <td style="text-align: center;">
                    <span class="badge" style="background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-weight: 500;">
                        Active
                    </span>
                </td>
                <td style="text-align: right;">
                    <div class="table-actions" style="justify-content: flex-end;">
                        <button class="btn btn-sm btn-outline view-btn" data-id="${user.id}">
                            View
                        </button>
                        ${isSelf ? `
                            <button class="btn btn-sm btn-ghost" title="You cannot delete your own account" disabled style="opacity: 0.4; cursor: not-allowed;">
                                Delete
                            </button>
                        ` : `
                            <button class="btn btn-sm delete-btn" data-id="${user.id}" data-name="${escapeHtml(user.name)}" style="color: var(--color-error); border: 1px solid var(--color-error); background: transparent;">
                                Delete
                            </button>
                        `}
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Attach event listeners to buttons
    tbody.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = parseInt(btn.getAttribute('data-id'), 10);
            const user = users.find(u => u.id === userId);
            if (user) openViewUserModal(user);
        });
    });

    tbody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = parseInt(btn.getAttribute('data-id'), 10);
            const userName = btn.getAttribute('data-name');
            handleDeleteUser(userId, userName);
        });
    });
}

/**
 * View User Modal: displays profile info and order history
 */
function openViewUserModal(user) {
    const userOrders = getUserOrders(user.id);
    const totalSpent = userOrders.reduce((sum, o) => {
        const amt = o.order_detail ? o.order_detail.amount_paid : (o.amount_paid || 0);
        return sum + (Number(amt) || 0);
    }, 0);

    const currentAdmin = getCurrentUser();
    const isSelf = currentAdmin && currentAdmin.id === user.id;

    const ordersHtml = userOrders.length > 0
        ? `
            <div style="max-height: 220px; overflow-y: auto; border: 1px solid var(--color-border); border-radius: var(--radius-md);">
                <table class="data-table" style="margin: 0; border: none; border-radius: 0;">
                    <thead>
                        <tr>
                            <th style="padding: 8px 12px;">Order ID</th>
                            <th style="padding: 8px 12px;">Date</th>
                            <th style="padding: 8px 12px;">Items</th>
                            <th style="padding: 8px 12px; text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${userOrders.map(o => {
                            const oDetail = o.order_detail || o;
                            const items = o.order_items || [];
                            const itemsText = items.length > 0
                                ? items.map(it => `${it.product_name || 'Item'} (${it.quantity})`).join(', ')
                                : '1 order';
                            const dateStr = oDetail.created_at || o.date;
                            return `
                                <tr>
                                    <td style="padding: 8px 12px;"><strong>#${oDetail.id || o.id}</strong></td>
                                    <td style="padding: 8px 12px; font-size: 0.85rem; color: var(--color-text-secondary);">${dateStr ? formatDate(dateStr) : 'Recent'}</td>
                                    <td style="padding: 8px 12px; font-size: 0.85rem; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(itemsText)}</td>
                                    <td style="padding: 8px 12px; text-align: right; font-weight: 600;">${formatPrice(Number(oDetail.amount_paid || o.amount_paid || 0))}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `
        : `
            <div style="text-align: center; padding: var(--space-xl); background: var(--color-surface-hover); border-radius: var(--radius-md); color: var(--color-text-secondary);">
                🛒 No orders placed by this user yet.
            </div>
        `;

    const modalContent = `
        <div style="display: flex; flex-direction: column; gap: var(--space-lg);">
            <!-- User Profile Summary -->
            <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: var(--space-md); border-bottom: 1px solid var(--color-border);">
                <div>
                    <h4 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--color-text);">${escapeHtml(user.name)}</h4>
                    <div style="font-size: 0.85rem; color: var(--color-text-secondary); margin-top: 2px;">User ID: #${user.id}</div>
                </div>
                <span class="badge" style="background-color: ${user.role === 'admin' ? 'var(--color-primary)' : 'var(--color-surface-hover)'}; color: ${user.role === 'admin' ? 'white' : 'var(--color-text)'}; border: 1px solid ${user.role === 'admin' ? 'var(--color-primary)' : 'var(--color-border)'}; font-weight: 600; padding: 4px 10px;">
                    ${user.role === 'admin' ? '🛡️ Admin' : '👤 Customer'}
                </span>
            </div>

            <!-- Contact & Account Details -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); background: var(--color-surface-hover); padding: var(--space-md); border-radius: var(--radius-md);">
                <div>
                    <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-secondary);">Phone</div>
                    <div style="font-weight: 600; margin-top: 2px; color: var(--color-text);">${escapeHtml(user.phone || 'Not provided')}</div>
                </div>
                <div>
                    <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-secondary);">Email</div>
                    <div style="font-weight: 600; margin-top: 2px; color: var(--color-text);">${escapeHtml(user.email || 'Not provided')}</div>
                </div>
                <div>
                    <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-secondary);">Joined Date</div>
                    <div style="font-weight: 600; margin-top: 2px; color: var(--color-text);">${user.joinDate}</div>
                </div>
                <div>
                    <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-secondary);">Total Spend</div>
                    <div style="font-weight: 600; margin-top: 2px; color: var(--color-success);">${formatPrice(totalSpent)}</div>
                </div>
            </div>

            <!-- Orders Section -->
            <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-sm);">
                    <h5 style="margin: 0; font-size: 1rem; font-weight: 600;">Orders (${userOrders.length})</h5>
                </div>
                ${ordersHtml}
            </div>

            <!-- Modal Footer Actions -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: var(--space-md); border-top: 1px solid var(--color-border); margin-top: var(--space-xs);">
                <div>
                    ${!isSelf ? `
                        <button class="btn btn-sm" id="modal-delete-user-btn" style="color: var(--color-error); border: 1px solid var(--color-error); background: transparent;">
                            Delete User
                        </button>
                    ` : ''}
                </div>
                <button class="btn btn-secondary btn-sm" id="modal-close-btn">
                    Close
                </button>
            </div>
        </div>
    `;

    const dialog = showModal(modalContent, {
        title: `User #${user.id} Details`,
        maxWidth: '560px'
    });

    const closeBtn = dialog.querySelector('#modal-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    const modalDeleteBtn = dialog.querySelector('#modal-delete-user-btn');
    if (modalDeleteBtn) {
        modalDeleteBtn.addEventListener('click', () => {
            closeModal();
            handleDeleteUser(user.id, user.name);
        });
    }
}

/**
 * Live 5-checkpoint password strength checker
 * Rules matching backend is_strong_password():
 *  1. count >= 8
 *  2. contains_upper
 *  3. contains_lower
 *  4. contains_digit
 *  5. contains_special
 */
function checkPasswordStrength(password) {
    if (!password) {
        return {
            count: 0,
            length_valid: false,
            contains_upper: false,
            contains_lower: false,
            contains_digit: false,
            contains_special: false,
            is_strong: false,
            score: 0
        };
    }

    let count = 0;
    let contains_lower = false;
    let contains_upper = false;
    let contains_digit = false;
    let contains_special = false;

    for (let index = 0; index < password.length; index++) {
        const ch = password[index];
        if (ch >= 'A' && ch <= 'Z') {
            contains_upper = true;
        } else if (ch >= 'a' && ch <= 'z') {
            contains_lower = true;
        } else if (ch >= '0' && ch <= '9') {
            contains_digit = true;
        } else {
            contains_special = true;
        }
        count++;
    }

    const length_valid = count >= 8;
    const is_strong = contains_lower && contains_upper && contains_digit && contains_special && length_valid;
    const score = (length_valid ? 1 : 0) +
                  (contains_upper ? 1 : 0) +
                  (contains_lower ? 1 : 0) +
                  (contains_digit ? 1 : 0) +
                  (contains_special ? 1 : 0);

    return {
        count,
        length_valid,
        contains_upper,
        contains_lower,
        contains_digit,
        contains_special,
        is_strong,
        score
    };
}

/**
 * Add Admin Modal: allows creating a new admin account with live password checker
 */
function openAddAdminModal() {
    const modalContent = `
        <form id="add-admin-form" style="display: flex; flex-direction: column; gap: var(--space-md);">
            <p style="margin: 0; color: var(--color-text-secondary); font-size: 0.9rem;">
                Create a new administrator account with full administrative privileges.
            </p>

            <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" for="admin-phone">
                    Phone Number <span style="color: var(--color-error);">*</span>
                </label>
                <input type="tel" id="admin-phone" class="form-input" placeholder="+91 9876543210" required autofocus>
                <div style="font-size: 0.75rem; color: var(--color-text-secondary); margin-top: 4px;">Must be a unique phone number.</div>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" for="admin-email">
                    Email Address <span style="font-size: 0.8rem; color: var(--color-text-secondary); font-weight: 400;">(Optional)</span>
                </label>
                <input type="email" id="admin-email" class="form-input" placeholder="admin@dealbridge.com">
            </div>

            <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" for="admin-password">
                    Password <span style="color: var(--color-error);">*</span>
                </label>
                <div style="position: relative;">
                    <input type="password" id="admin-password" class="form-input" placeholder="Create strong admin password" required autocomplete="new-password">
                    <button type="button" id="toggle-admin-pw" class="btn btn-ghost btn-sm" style="position: absolute; right: 4px; top: 50%; transform: translateY(-50%); padding: 4px 8px; font-size: 0.8rem;" aria-label="Toggle password visibility">👁️</button>
                </div>

                <!-- 5 Checkpoints Live Strength Meter -->
                <div id="admin-pw-meter" style="margin-top: var(--space-sm); padding: var(--space-sm) var(--space-md); background: var(--color-surface-hover); border-radius: var(--radius-md); border: 1px solid var(--color-border);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 0.8rem;">
                        <span style="font-weight: 600; color: var(--color-text);">Password Strength:</span>
                        <span id="admin-strength-label" style="font-weight: 600; color: var(--color-text-secondary);">Very Weak</span>
                    </div>

                    <!-- Progress Bars -->
                    <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; margin-bottom: 8px;">
                        <div id="pw-bar-1" style="height: 4px; border-radius: 2px; background: var(--color-border); transition: background 0.2s;"></div>
                        <div id="pw-bar-2" style="height: 4px; border-radius: 2px; background: var(--color-border); transition: background 0.2s;"></div>
                        <div id="pw-bar-3" style="height: 4px; border-radius: 2px; background: var(--color-border); transition: background 0.2s;"></div>
                        <div id="pw-bar-4" style="height: 4px; border-radius: 2px; background: var(--color-border); transition: background 0.2s;"></div>
                        <div id="pw-bar-5" style="height: 4px; border-radius: 2px; background: var(--color-border); transition: background 0.2s;"></div>
                    </div>

                    <!-- 5 Checkpoints List -->
                    <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; font-size: 0.78rem;">
                        <li id="chk-len" style="display: flex; align-items: center; gap: 6px; color: var(--color-text-secondary); transition: color 0.2s;">
                            <span class="chk-icon" style="font-weight: bold; width: 14px;">○</span> At least 8 characters
                        </li>
                        <li id="chk-upper" style="display: flex; align-items: center; gap: 6px; color: var(--color-text-secondary); transition: color 0.2s;">
                            <span class="chk-icon" style="font-weight: bold; width: 14px;">○</span> At least one uppercase letter (A-Z)
                        </li>
                        <li id="chk-lower" style="display: flex; align-items: center; gap: 6px; color: var(--color-text-secondary); transition: color 0.2s;">
                            <span class="chk-icon" style="font-weight: bold; width: 14px;">○</span> At least one lowercase letter (a-z)
                        </li>
                        <li id="chk-digit" style="display: flex; align-items: center; gap: 6px; color: var(--color-text-secondary); transition: color 0.2s;">
                            <span class="chk-icon" style="font-weight: bold; width: 14px;">○</span> At least one number (0-9)
                        </li>
                        <li id="chk-special" style="display: flex; align-items: center; gap: 6px; color: var(--color-text-secondary); transition: color 0.2s;">
                            <span class="chk-icon" style="font-weight: bold; width: 14px;">○</span> At least one special character (!@#$%^&*)
                        </li>
                    </ul>
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" for="admin-confirm-password">
                    Confirm Password <span style="color: var(--color-error);">*</span>
                </label>
                <input type="password" id="admin-confirm-password" class="form-input" placeholder="Repeat password" required autocomplete="new-password">
                <div id="admin-pw-match-msg" style="font-size: 0.75rem; margin-top: 4px; display: none;"></div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: var(--space-md); padding-top: var(--space-md); border-top: 1px solid var(--color-border); margin-top: var(--space-xs);">
                <button type="button" class="btn btn-secondary" id="cancel-add-admin-btn">Cancel</button>
                <button type="submit" class="btn btn-primary" id="submit-add-admin-btn">
                    Register Admin
                </button>
            </div>
        </form>
    `;

    const dialog = showModal(modalContent, {
        title: 'Register New Administrator',
        maxWidth: '520px'
    });

    const form = dialog.querySelector('#add-admin-form');
    const cancelBtn = dialog.querySelector('#cancel-add-admin-btn');
    const pwInput = dialog.querySelector('#admin-password');
    const confirmPwInput = dialog.querySelector('#admin-confirm-password');
    const togglePwBtn = dialog.querySelector('#toggle-admin-pw');
    const matchMsg = dialog.querySelector('#admin-pw-match-msg');
    const submitBtn = dialog.querySelector('#submit-add-admin-btn');

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }

    if (togglePwBtn && pwInput) {
        togglePwBtn.addEventListener('click', () => {
            const isPassword = pwInput.type === 'password';
            pwInput.type = isPassword ? 'text' : 'password';
            togglePwBtn.textContent = isPassword ? '🙈' : '👁️';
        });
    }

    function updateCheckpointItem(id, valid) {
        const item = dialog.querySelector(`#${id}`);
        if (!item) return;
        const icon = item.querySelector('.chk-icon');
        if (valid) {
            item.style.color = 'var(--color-success, #10b981)';
            if (icon) icon.textContent = '✓';
        } else {
            item.style.color = 'var(--color-text-secondary, #6b7280)';
            if (icon) icon.textContent = '○';
        }
    }

    function updateLivePasswordUI() {
        const val = pwInput ? pwInput.value : '';
        const strength = checkPasswordStrength(val);

        updateCheckpointItem('chk-len', strength.length_valid);
        updateCheckpointItem('chk-upper', strength.contains_upper);
        updateCheckpointItem('chk-lower', strength.contains_lower);
        updateCheckpointItem('chk-digit', strength.contains_digit);
        updateCheckpointItem('chk-special', strength.contains_special);

        const label = dialog.querySelector('#admin-strength-label');
        const bars = [
            dialog.querySelector('#pw-bar-1'),
            dialog.querySelector('#pw-bar-2'),
            dialog.querySelector('#pw-bar-3'),
            dialog.querySelector('#pw-bar-4'),
            dialog.querySelector('#pw-bar-5')
        ];

        let barColor = 'var(--color-border)';
        let labelText = 'Very Weak';
        let labelColor = 'var(--color-text-secondary)';

        if (strength.score <= 1) {
            barColor = 'var(--color-error, #ef4444)';
            labelText = 'Very Weak';
            labelColor = 'var(--color-error, #ef4444)';
        } else if (strength.score <= 2) {
            barColor = '#f97316';
            labelText = 'Weak';
            labelColor = '#f97316';
        } else if (strength.score <= 3) {
            barColor = '#eab308';
            labelText = 'Fair';
            labelColor = '#eab308';
        } else if (strength.score <= 4) {
            barColor = '#3b82f6';
            labelText = 'Good';
            labelColor = '#3b82f6';
        } else {
            barColor = 'var(--color-success, #10b981)';
            labelText = 'Strong ✓';
            labelColor = 'var(--color-success, #10b981)';
        }

        if (label) {
            label.textContent = labelText;
            label.style.color = labelColor;
        }

        bars.forEach((bar, idx) => {
            if (!bar) return;
            if (idx < strength.score) {
                bar.style.background = barColor;
            } else {
                bar.style.background = 'var(--color-border, #e5e7eb)';
            }
        });

        // Check password matching if confirm input has value
        if (confirmPwInput && confirmPwInput.value) {
            checkPasswordMatch();
        }
    }

    function checkPasswordMatch() {
        if (!confirmPwInput || !pwInput || !matchMsg) return;
        if (!confirmPwInput.value) {
            matchMsg.style.display = 'none';
            return;
        }
        if (confirmPwInput.value === pwInput.value) {
            matchMsg.style.display = 'block';
            matchMsg.style.color = 'var(--color-success, #10b981)';
            matchMsg.textContent = '✓ Passwords match';
        } else {
            matchMsg.style.display = 'block';
            matchMsg.style.color = 'var(--color-error, #ef4444)';
            matchMsg.textContent = '✕ Passwords do not match';
        }
    }

    if (pwInput) {
        pwInput.addEventListener('input', updateLivePasswordUI);
    }
    if (confirmPwInput) {
        confirmPwInput.addEventListener('input', checkPasswordMatch);
    }

    // Submit handler
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const phone = dialog.querySelector('#admin-phone').value.trim();
            const email = dialog.querySelector('#admin-email').value.trim();
            const password = pwInput.value;
            const confirmPassword = confirmPwInput.value;

            if (!phone) {
                showToast('Please enter a phone number.', 'error');
                return;
            }

            const strength = checkPasswordStrength(password);
            if (!strength.is_strong) {
                showToast('Password does not fulfill all 5 strength requirements.', 'error');
                pwInput.focus();
                return;
            }

            if (password !== confirmPassword) {
                showToast('Passwords do not match.', 'error');
                confirmPwInput.focus();
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Registering Admin...';
            }

            try {
                const payload = {
                    phone,
                    password,
                    ...(email ? { email } : {})
                };

                const res = await api.post('/login/register-admin', payload);
                showToast(res.message || 'Admin registered successfully!', 'success');
                closeModal();
                await loadData();
            } catch (err) {
                console.error('Register admin error:', err);
                showToast(err.message || 'Failed to register admin.', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Register Admin';
                }
            }
        });
    }
}

/**
 * Handle Delete User Action: confirmation and backend deletion
 */
async function handleDeleteUser(userId, userName) {
    const currentAdmin = getCurrentUser();
    if (currentAdmin && currentAdmin.id === userId) {
        showToast('You cannot delete your own account.', 'warning');
        return;
    }

    const confirmed = await confirmModal(`
        Are you sure you want to delete user <strong>"${escapeHtml(userName || '#' + userId)}"</strong> (ID #${userId})?
        <br><br>
        <span style="color: var(--color-error); font-size: 0.9em;">
            ⚠️ This will permanently remove the user record and associated data.
        </span>
    `, {
        title: 'Delete User Confirmation',
        confirmText: 'Delete User',
        cancelText: 'Cancel',
        type: 'danger'
    });

    if (!confirmed) return;

    try {
        await api.delete(`/login/users/${userId}`);
        showToast(`User #${userId} deleted successfully.`, 'success');
        await loadData();
    } catch (err) {
        console.error('Delete user error:', err);
        // If the endpoint isn't implemented on the backend yet
        if (err.message && (err.message.includes('405') || err.message.includes('Method Not Allowed') || err.message.includes('404'))) {
            showToast(`Delete failed: Backend endpoint DELETE /api/v1/login/users/${userId} is not implemented yet.`, 'error');
        } else {
            showToast(err.message || 'Failed to delete user', 'error');
        }
    }
}
