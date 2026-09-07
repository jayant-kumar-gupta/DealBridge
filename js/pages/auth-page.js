import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { login, isLoggedIn } from '../state/auth.js';
import { showToast } from '../components/toast.js';

document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initFooter();

    if (isLoggedIn() && !window.location.pathname.includes('logout')) {
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || '/profile.html';
        window.location.href = redirect;
        return;
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            const result = login(email, password);
            if (result.success) {
                const urlParams = new URLSearchParams(window.location.search);
                const redirect = urlParams.get('redirect') || '/profile.html';
                window.location.href = redirect;
            } else {
                showToast(result.message || 'Login failed', 'error');
            }
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Registration successful! Please login.', 'success');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 1500);
        });
    }

    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Password reset link sent to your email.', 'success');
        });
    }

    const resetForm = document.getElementById('reset-form');
    if (resetForm) {
        resetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Password reset successfully. Please login.', 'success');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 1500);
        });
    }
});
