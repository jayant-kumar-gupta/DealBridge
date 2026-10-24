import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { login, register, isLoggedIn, requestPasswordResetOtp, verifyPasswordResetOtp, resetPasswordWithOtp } from '../state/auth.js';
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
    const regOtpForm = document.getElementById('reg-otp-form');
    const regScreen1 = document.getElementById('reg-screen-1');
    const regScreen2 = document.getElementById('reg-screen-2');
    const regPhoneDisplay = document.getElementById('reg-phone-display');
    const regOtpInput = document.getElementById('reg-otp');
    const btnRegResend = document.getElementById('btn-reg-resend-otp');
    const btnRegEdit = document.getElementById('btn-reg-edit-details');

    let pendingRegistration = null;
    let expectedOtp = '';

    function generateAndShowRegOtp(phone) {
        expectedOtp = String(Math.floor(100000 + Math.random() * 900000));
        showToast(`Demo Mode: Your OTP for ${phone} is ${expectedOtp}`, 'info');
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

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

            pendingRegistration = { name, email, phone, password };

            // Transition to Screen 2: OTP Verification
            if (regScreen1 && regScreen2) {
                regScreen1.style.display = 'none';
                regScreen2.style.display = 'block';
            }
            if (regPhoneDisplay) regPhoneDisplay.textContent = phone;
            if (regOtpInput) {
                regOtpInput.value = '';
                regOtpInput.focus();
            }

            generateAndShowRegOtp(phone);
        });
    }

    if (regOtpForm) {
        regOtpForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const enteredOtp = regOtpInput ? regOtpInput.value.trim() : '';
            if (enteredOtp !== expectedOtp) {
                showToast('Invalid OTP. Please check the code and try again.', 'error');
                if (regOtpInput) regOtpInput.focus();
                return;
            }

            const submitBtn = document.getElementById('btn-verify-reg');
            const originalText = submitBtn ? submitBtn.textContent : 'Verify & Create Account';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating account...';
            }

            try {
                const result = await register(pendingRegistration);
                if (result.success) {
                    showToast('OTP verified & account created! Redirecting to login...', 'success');
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 1500);
                } else {
                    showToast(result.message || 'Registration failed', 'error');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText;
                    }
                }
            } catch (err) {
                showToast(err.message || 'An error occurred during registration', 'error');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            }
        });
    }

    if (btnRegResend) {
        btnRegResend.addEventListener('click', () => {
            if (pendingRegistration && pendingRegistration.phone) {
                generateAndShowRegOtp(pendingRegistration.phone);
                showToast('A new OTP has been sent.', 'success');
                if (regOtpInput) {
                    regOtpInput.value = '';
                    regOtpInput.focus();
                }
            }
        });
    }

    if (btnRegEdit) {
        btnRegEdit.addEventListener('click', () => {
            if (regScreen1 && regScreen2) {
                regScreen2.style.display = 'none';
                regScreen1.style.display = 'block';
            }
        });
    }

    setupForgotPasswordWizard();
}

function setupForgotPasswordWizard() {
    const screen1 = document.getElementById('fp-screen-1');
    const screen2 = document.getElementById('fp-screen-2');
    const screen3 = document.getElementById('fp-screen-3');
    const screenSuccess = document.getElementById('fp-screen-success');

    if (!screen1 && !document.getElementById('forgot-form')) {
        return; // Not on forgot password page
    }

    const dot1 = document.getElementById('step-dot-1');
    const dot2 = document.getElementById('step-dot-2');
    const dot3 = document.getElementById('step-dot-3');
    const line1 = document.getElementById('step-line-1');
    const line2 = document.getElementById('step-line-2');

    const forgotForm = document.getElementById('forgot-form');
    const otpForm = document.getElementById('otp-form');
    const resetForm = document.getElementById('reset-form');

    const fpPhoneGroup = document.getElementById('fp-phone-group');
    const fpEmailGroup = document.getElementById('fp-email-group');
    const fpPhoneInput = document.getElementById('fp-phone');
    const fpEmailInput = document.getElementById('fp-email');
    const btnToggleIdentifier = document.getElementById('btn-toggle-identifier');
    const fpSubtitle1 = document.getElementById('fp-subtitle-1');
    const fpTargetDisplay = document.getElementById('fp-target-display');
    const fpOtpInput = document.getElementById('fp-otp');
    const btnResendOtp = document.getElementById('btn-resend-otp');
    const btnChangeIdentifier = document.getElementById('btn-change-identifier');

    let mode = 'phone'; // 'phone' | 'email'
    let currentIdentifier = '';
    let verifiedOtp = '';

    function setStep(step) {
        if (screen1) screen1.style.display = (step === 1) ? 'block' : 'none';
        if (screen2) screen2.style.display = (step === 2) ? 'block' : 'none';
        if (screen3) screen3.style.display = (step === 3) ? 'block' : 'none';
        if (screenSuccess) screenSuccess.style.display = (step === 'success') ? 'block' : 'none';

        const activeColor = 'var(--color-primary, #0ea5e9)';
        const inactiveBorder = 'var(--color-border, #e5e7eb)';
        const inactiveBg = 'var(--color-bg, #ffffff)';
        const textLight = '#ffffff';
        const textMuted = 'var(--color-text-secondary, #6b7280)';

        if (dot1 && dot2 && dot3) {
            if (step === 1) {
                dot1.style.background = activeColor;
                dot1.style.color = textLight;
                dot1.style.border = 'none';

                dot2.style.background = inactiveBg;
                dot2.style.color = textMuted;
                dot2.style.border = `2px solid ${inactiveBorder}`;

                dot3.style.background = inactiveBg;
                dot3.style.color = textMuted;
                dot3.style.border = `2px solid ${inactiveBorder}`;

                if (line1) line1.style.background = inactiveBorder;
                if (line2) line2.style.background = inactiveBorder;
            } else if (step === 2) {
                dot1.style.background = activeColor;
                dot1.style.color = textLight;
                dot1.style.border = 'none';

                dot2.style.background = activeColor;
                dot2.style.color = textLight;
                dot2.style.border = 'none';

                dot3.style.background = inactiveBg;
                dot3.style.color = textMuted;
                dot3.style.border = `2px solid ${inactiveBorder}`;

                if (line1) line1.style.background = activeColor;
                if (line2) line2.style.background = inactiveBorder;
            } else if (step === 3 || step === 'success') {
                dot1.style.background = activeColor;
                dot1.style.color = textLight;
                dot1.style.border = 'none';

                dot2.style.background = activeColor;
                dot2.style.color = textLight;
                dot2.style.border = 'none';

                dot3.style.background = activeColor;
                dot3.style.color = textLight;
                dot3.style.border = 'none';

                if (line1) line1.style.background = activeColor;
                if (line2) line2.style.background = activeColor;
            }
        }

        if (step === 3) {
            const passwordInput = document.getElementById('password');
            if (passwordInput) {
                passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    }

    // Toggle between Phone and Email in Screen 1
    if (btnToggleIdentifier) {
        btnToggleIdentifier.addEventListener('click', () => {
            if (mode === 'phone') {
                mode = 'email';
                if (fpPhoneGroup) fpPhoneGroup.style.display = 'none';
                if (fpEmailGroup) fpEmailGroup.style.display = 'block';
                if (fpSubtitle1) fpSubtitle1.textContent = 'Enter your registered email address to receive a verification OTP.';
                btnToggleIdentifier.textContent = 'Continue with phone number';
                if (fpEmailInput) fpEmailInput.focus();
            } else {
                mode = 'phone';
                if (fpEmailGroup) fpEmailGroup.style.display = 'none';
                if (fpPhoneGroup) fpPhoneGroup.style.display = 'block';
                if (fpSubtitle1) fpSubtitle1.textContent = 'Enter your registered phone number to receive a verification OTP.';
                btnToggleIdentifier.textContent = 'Continue with email';
                if (fpPhoneInput) fpPhoneInput.focus();
            }
        });
    }

    // Return to Step 1 from Step 2
    if (btnChangeIdentifier) {
        btnChangeIdentifier.addEventListener('click', () => {
            setStep(1);
        });
    }

    // Resend OTP on Step 2
    if (btnResendOtp) {
        btnResendOtp.addEventListener('click', async () => {
            if (!currentIdentifier) {
                setStep(1);
                return;
            }
            btnResendOtp.disabled = true;
            btnResendOtp.textContent = 'Sending...';
            try {
                const result = await requestPasswordResetOtp(currentIdentifier);
                if (result.success) {
                    if (result.demo_otp) {
                        showToast(`Demo Mode: Your new OTP is ${result.demo_otp}`, "info");
                        const demoBox = document.getElementById('fp-demo-box');
                        const demoVal = document.getElementById('fp-demo-otp-val');
                        if (demoBox && demoVal) {
                            demoVal.textContent = result.demo_otp;
                            demoBox.style.display = 'block';
                        }
                    } else {
                        showToast('A new OTP has been sent successfully.', 'success');
                    }
                } else {
                    showToast(result.message || 'Failed to resend OTP', 'error');
                }
            } catch (err) {
                showToast(err.message || 'Failed to resend OTP', 'error');
            } finally {
                btnResendOtp.disabled = false;
                btnResendOtp.textContent = 'Resend OTP';
            }
        });
    }

    // Screen 1: Request OTP Form Submit
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('btn-send-otp') || forgotForm.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.textContent : 'Send OTP';

            let identifier = '';
            if (mode === 'phone') {
                identifier = fpPhoneInput ? fpPhoneInput.value.trim() : '';
                if (!identifier) {
                    showToast('Please enter your phone number.', 'error');
                    if (fpPhoneInput) fpPhoneInput.focus();
                    return;
                }
            } else {
                identifier = fpEmailInput ? fpEmailInput.value.trim() : '';
                if (!identifier) {
                    showToast('Please enter your email address.', 'error');
                    if (fpEmailInput) fpEmailInput.focus();
                    return;
                }
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Sending OTP...';
            }

            try {
                const result = await requestPasswordResetOtp(identifier);
                if (result.success) {
                    currentIdentifier = identifier;
                    if (fpTargetDisplay) {
                        fpTargetDisplay.textContent = identifier;
                    }
                    if (result.demo_otp) {
                        showToast(`Demo Mode: Your OTP is ${result.demo_otp}`, "info");
                        const demoBox = document.getElementById('fp-demo-box');
                        const demoVal = document.getElementById('fp-demo-otp-val');
                        if (demoBox && demoVal) {
                            demoVal.textContent = result.demo_otp;
                            demoBox.style.display = 'block';
                        }
                    } else {
                        showToast('OTP sent! Please check your notifications.', 'success');
                    }
                    setStep(2);
                    if (fpOtpInput) {
                        fpOtpInput.value = '';
                        fpOtpInput.focus();
                    }
                } else {
                    showToast(result.message || 'Failed to send OTP. Please try again.', 'error');
                }
            } catch (err) {
                showToast(err.message || 'An error occurred while sending OTP', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            }
        });
    }

    // Screen 2: Verify OTP Form Submit
    if (otpForm) {
        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('btn-verify-otp') || otpForm.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.textContent : 'Verify OTP';

            const otp = fpOtpInput ? fpOtpInput.value.trim() : '';
            if (!otp || otp.length < 4) {
                showToast('Please enter a valid 6-digit OTP.', 'error');
                if (fpOtpInput) fpOtpInput.focus();
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Verifying...';
            }

            try {
                const result = await verifyPasswordResetOtp(currentIdentifier, otp);
                if (result.success) {
                    verifiedOtp = otp;
                    showToast('OTP verified successfully!', 'success');
                    setStep(3);
                    const newPwInput = document.getElementById('password');
                    if (newPwInput) {
                        newPwInput.value = '';
                        newPwInput.focus();
                    }
                } else {
                    showToast(result.message || 'Invalid OTP. Please try again.', 'error');
                }
            } catch (err) {
                showToast(err.message || 'An error occurred while verifying OTP', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            }
        });
    }

    // Screen 3: Reset Password Form Submit
    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('btn-submit-reset') || resetForm.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.textContent : 'Reset Password';

            const newPassword = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            const strength = checkPasswordStrength(newPassword);
            if (!strength.is_strong) {
                showToast('Password does not meet strength requirements. Please fulfill all 5 checkpoints.', 'error');
                return;
            }

            if (newPassword !== confirmPassword) {
                showToast('Passwords do not match.', 'error');
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Resetting Password...';
            }

            try {
                const result = await resetPasswordWithOtp(currentIdentifier, verifiedOtp, newPassword);
                if (result.success) {
                    showToast('Password changed successfully! Redirecting to login...', 'success');
                    setStep('success');
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 1500);
                } else {
                    showToast(result.message || 'Failed to reset password', 'error');
                }
            } catch (err) {
                showToast(err.message || 'An error occurred while resetting password', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            }
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

