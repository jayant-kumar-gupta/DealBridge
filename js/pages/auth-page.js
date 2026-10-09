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

    const passwordInput = document.getElementById('password');
    if (passwordInput && document.getElementById('password-strength-container')) {
        setupPasswordStrengthChecker(passwordInput);
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

            const strength = checkPasswordStrength(password);
            if (!strength.is_strong) {
                showToast('Password does not meet strength requirements. Please fulfill all 5 checkpoints.', 'error');
                return;
            }

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

/**
 * Live password strength checker matching backend is_strong_password()
 * Rules (5 checkpoints):
 *  1. count >= 8
 *  2. contains_upper
 *  3. contains_lower
 *  4. contains_digit
 *  5. contains_special (non-alphanumeric)
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

function setupPasswordStrengthChecker(passwordInput) {
    const strengthLabel = document.getElementById('strength-label');
    const bars = [
        document.getElementById('strength-bar-1'),
        document.getElementById('strength-bar-2'),
        document.getElementById('strength-bar-3'),
        document.getElementById('strength-bar-4'),
        document.getElementById('strength-bar-5')
    ];

    const chkLength = document.getElementById('chk-length');
    const chkUpper = document.getElementById('chk-upper');
    const chkLower = document.getElementById('chk-lower');
    const chkDigit = document.getElementById('chk-digit');
    const chkSpecial = document.getElementById('chk-special');

    function updateCheckpoint(element, isValid) {
        if (!element) return;
        const icon = element.querySelector('.chk-icon');
        if (isValid) {
            element.style.color = 'var(--color-success, #10b981)';
            if (icon) icon.textContent = '✓';
        } else {
            element.style.color = 'var(--color-text-secondary, #6b7280)';
            if (icon) icon.textContent = '○';
        }
    }

    function updateStrengthUI() {
        const password = passwordInput.value || '';
        const strength = checkPasswordStrength(password);

        // Update 5 checkpoints
        updateCheckpoint(chkLength, strength.length_valid);
        updateCheckpoint(chkUpper, strength.contains_upper);
        updateCheckpoint(chkLower, strength.contains_lower);
        updateCheckpoint(chkDigit, strength.contains_digit);
        updateCheckpoint(chkSpecial, strength.contains_special);

        // Color definitions
        const levelColors = {
            empty: 'var(--color-border, #e5e7eb)',
            veryWeak: '#ef4444',
            weak: '#f97316',
            medium: '#f59e0b',
            good: '#3b82f6',
            strong: '#10b981'
        };

        if (password.length === 0) {
            if (strengthLabel) {
                strengthLabel.textContent = 'Too Weak';
                strengthLabel.style.color = 'var(--color-text-secondary, #6b7280)';
            }
            bars.forEach(bar => {
                if (bar) bar.style.backgroundColor = levelColors.empty;
            });
            return;
        }

        let activeColor = levelColors.veryWeak;
        let labelText = 'Too Weak';

        if (strength.is_strong) {
            activeColor = levelColors.strong;
            labelText = 'Strong ✓';
        } else {
            switch (strength.score) {
                case 1:
                    activeColor = levelColors.veryWeak;
                    labelText = 'Very Weak';
                    break;
                case 2:
                    activeColor = levelColors.weak;
                    labelText = 'Weak';
                    break;
                case 3:
                    activeColor = levelColors.medium;
                    labelText = 'Medium';
                    break;
                case 4:
                    activeColor = levelColors.good;
                    labelText = 'Good';
                    break;
                case 5:
                    activeColor = levelColors.strong;
                    labelText = 'Strong ✓';
                    break;
                default:
                    activeColor = levelColors.veryWeak;
                    labelText = 'Too Weak';
            }
        }

        if (strengthLabel) {
            strengthLabel.textContent = labelText;
            strengthLabel.style.color = activeColor;
        }

        bars.forEach((bar, index) => {
            if (bar) {
                if (index < strength.score) {
                    bar.style.backgroundColor = activeColor;
                } else {
                    bar.style.backgroundColor = levelColors.empty;
                }
            }
        });
    }

    passwordInput.addEventListener('input', updateStrengthUI);
    // Initial update in case field has value
    updateStrengthUI();
}

