import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { getCurrentUser, isLoggedIn, logout, fetchCurrentUser, updateProfile } from '../state/auth.js';
import { showToast } from '../components/toast.js';

document.addEventListener('DOMContentLoaded', async () => {
    initHeader();
    initFooter();

    if (!isLoggedIn()) {
        window.location.href = '/login.html?redirect=/profile.html';
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

    // Refresh user from server if possible, otherwise use cached
    let user = await fetchCurrentUser() || getCurrentUser();

    function renderUserProfile(u) {
        if (!u) return;
        document.getElementById('profile-name').textContent = u.name || 'User';
        document.getElementById('profile-email').textContent = u.email || '';
        document.getElementById('profile-phone').textContent = u.phone || '';
        document.getElementById('profile-date').textContent = u.joinDate || 'N/A';

        const nameParts = (u.name || 'User').split(' ').filter(Boolean);
        const initials = nameParts.map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
        document.getElementById('profile-avatar').textContent = initials;
    }

    renderUserProfile(user);

    const editBtn = document.getElementById('edit-profile-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const editFormSection = document.getElementById('edit-profile-form');
    const profileForm = document.getElementById('profile-form');

    if (editBtn) {
        editBtn.addEventListener('click', () => {
            const current = getCurrentUser() || {};
            document.getElementById('edit-name').value = current.name || '';
            document.getElementById('edit-email').value = current.email || '';
            document.getElementById('edit-phone').value = current.phone || '';
            editFormSection.style.display = 'block';
            editBtn.style.display = 'none';
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            editFormSection.style.display = 'none';
            editBtn.style.display = 'inline-block';
        });
    }

    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = profileForm.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            const newName = document.getElementById('edit-name').value.trim();
            const newEmail = document.getElementById('edit-email').value.trim();
            const newPhone = document.getElementById('edit-phone').value.trim();

            const result = await updateProfile({
                name: newName,
                email: newEmail,
                phone: newPhone,
            });

            if (submitBtn) submitBtn.disabled = false;

            if (result.success) {
                renderUserProfile(result.user);
                showToast('Profile updated successfully', 'success');
                editFormSection.style.display = 'none';
                editBtn.style.display = 'inline-block';
            } else {
                showToast(result.message || 'Failed to update profile', 'error');
            }
        });
    }
});

