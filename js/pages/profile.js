import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { getCurrentUser, isLoggedIn, logout } from '../state/auth.js';
import { showToast } from '../components/toast.js';

document.addEventListener('DOMContentLoaded', () => {
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

    const user = getCurrentUser();
    if (user) {
        document.getElementById('profile-name').textContent = user.name;
        document.getElementById('profile-email').textContent = user.email;
        document.getElementById('profile-phone').textContent = user.phone || '+91 98765 43210';
        document.getElementById('profile-date').textContent = user.joinDate || 'Jan 2026';
        
        const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        document.getElementById('profile-avatar').textContent = initials;
    }

    const editBtn = document.getElementById('edit-profile-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const editFormSection = document.getElementById('edit-profile-form');
    const profileForm = document.getElementById('profile-form');

    editBtn.addEventListener('click', () => {
        document.getElementById('edit-name').value = user.name;
        document.getElementById('edit-email').value = user.email;
        document.getElementById('edit-phone').value = user.phone || '+91 98765 43210';
        editFormSection.style.display = 'block';
        editBtn.style.display = 'none';
    });

    cancelBtn.addEventListener('click', () => {
        editFormSection.style.display = 'none';
        editBtn.style.display = 'inline-block';
    });

    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // In a real app, we'd call an update API and update state
        const newName = document.getElementById('edit-name').value;
        const newEmail = document.getElementById('edit-email').value;
        const newPhone = document.getElementById('edit-phone').value;
        
        document.getElementById('profile-name').textContent = newName;
        document.getElementById('profile-email').textContent = newEmail;
        document.getElementById('profile-phone').textContent = newPhone;
        
        const initials = newName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        document.getElementById('profile-avatar').textContent = initials;

        showToast('Profile updated successfully', 'success');
        editFormSection.style.display = 'none';
        editBtn.style.display = 'inline-block';
    });
});
