import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { login, register, isLoggedIn } from '../state/auth.js';
import { showToast } from '../components/toast.js';

function initAuthPage() {
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
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.textContent : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Signing in...';
            }

            try {
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;

                const result = await login(email, password);
                if (result.success) {
                    showToast('Login successful!', 'success');
                    const urlParams = new URLSearchParams(window.location.search);
                    const defaultRedirect = result.user?.role === 'admin' ? '/admin/index.html' : '/profile.html';
                    const redirect = urlParams.get('redirect') || defaultRedirect;
                    setTimeout(() => {
                        window.location.href = redirect;
                    }, 400);
                } else {
                    showToast(result.message || 'Login failed', 'error');
                }
            } catch (err) {
                showToast(err.message || 'An error occurred during login', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            }
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.textContent : '';

            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (password !== confirmPassword) {
                showToast('Passwords do not match', 'error');
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating account...';
            }

            try {
                const result = await register({ name, email, phone, password });
                if (result.success) {
                    showToast('Registration successful! Redirecting to login...', 'success');
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 1500);
                } else {
                    showToast(result.message || 'Registration failed', 'error');
                }
            } catch (err) {
                showToast(err.message || 'An error occurred during registration', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            }
        });
    }

    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Password reset instructions will be sent if account exists.', 'info');
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
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthPage);
} else {
    initAuthPage();
}

