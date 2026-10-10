import { api } from '../utils/api.js';

const AUTH_KEY = 'dealbridge_auth';
const TOKEN_KEY = 'dealbridge_token';

/**
 * Normalizes user data from the backend to ensure frontend compatibility.
 * Reconciles backend fields with frontend expectations.
 */
function normalizeUser(rawUser) {
  if (!rawUser) return null;
  const name = rawUser.name || [rawUser.firstname, rawUser.lastname].filter(Boolean).join(' ') || rawUser.email?.split('@')[0] || 'User';
  const role = rawUser.role || (rawUser.is_admin ? 'admin' : 'user');
  const joinDate = rawUser.joinDate || (rawUser.join_date ? new Date(rawUser.join_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Jan 2026');

  return {
    id: rawUser.id,
    name,
    email: rawUser.email || '',
    phone: rawUser.phone || '',
    role,
    is_admin: Boolean(rawUser.is_admin || role === 'admin'),
    joinDate,
    join_date: rawUser.join_date || null,
    avatar: rawUser.avatar || null,
  };
}

export function isLoggedIn() {
  return localStorage.getItem(AUTH_KEY) !== null && localStorage.getItem(TOKEN_KEY) !== null;
}

export function getCurrentUser() {
  const authData = localStorage.getItem(AUTH_KEY);
  if (!authData) return null;
  try {
    return JSON.parse(authData);
  } catch {
    return null;
  }
}

export function isAdmin() {
  const user = getCurrentUser();
  return Boolean(user && (user.role === 'admin' || user.is_admin));
}

export async function login(usernameOrEmail, password) {
  try {
    const data = await api.post('/login/', {
      username: usernameOrEmail,
      password: password
    });

    if (!data || !data.access_token) {
      return { success: false, message: 'Invalid response from server' };
    }

    localStorage.setItem(TOKEN_KEY, data.access_token);
    const user = normalizeUser(data.user);
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    }

    if (typeof window !== 'undefined' && window.__dealbridgeSyncCart) {
      try {
        await window.__dealbridgeSyncCart();
      } catch (syncErr) {
        console.warn('Cart sync warning:', syncErr);
      }
    }

    document.dispatchEvent(new CustomEvent('auth-change', { detail: { user, loggedIn: true } }));
    return { success: true, user };
  } catch (error) {
    return { success: false, message: error.message || 'Login failed' };
  }
}

export async function register(userData) {
  try {
    const data = await api.post('/login/register', userData);
    return { success: true, message: data.message || 'Registered successfully', user: normalizeUser(data.user) };
  } catch (error) {
    return { success: false, message: error.message || 'Registration failed' };
  }
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('dealbridge_cart');
  localStorage.removeItem('dealbridge_guest_cart');
  document.dispatchEvent(new CustomEvent('cart-change', { detail: { cart: [], count: 0 } }));
  document.dispatchEvent(new CustomEvent('auth-change', { detail: { user: null, loggedIn: false } }));
}

export function requireAuth(loginUrl = '/login.html') {
  if (!isLoggedIn()) {
    const destination = (loginUrl && loginUrl.startsWith('/login')) ? loginUrl : '/login.html';
    const currentPath = window.location.pathname + window.location.search;
    window.location.href = `${destination}?redirect=${encodeURIComponent(currentPath)}`;
    return false;
  }
  return true;
}

export function requireAdmin() {
  if (!isAdmin()) {
    window.location.href = '/login.html?admin=true';
    return false;
  }
  return true;
}

export async function fetchCurrentUser() {
  try {
    const rawUser = await api.get('/login/me');
    const user = normalizeUser(rawUser);
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      document.dispatchEvent(new CustomEvent('user-update', { detail: { user } }));
    }
    return user;
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    return null;
  }
}

export async function updateProfile(profileData) {
  try {
    const updatedRaw = await api.put('/login/me', profileData);
    const user = normalizeUser(updatedRaw);
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      document.dispatchEvent(new CustomEvent('auth-change', { detail: { user, loggedIn: true } }));
    }
    return { success: true, user };
  } catch (error) {
    return { success: false, message: error.message || 'Update failed' };
  }
}

export async function requestPasswordResetOtp(identifier) {
  try {
    const data = await api.post('/login/forgot-password/otp', { identifier });
    return { success: true, message: data.message || 'An OTP has been sent successfully.' };
  } catch (error) {
    return { success: false, message: error.message || 'Failed to send OTP' };
  }
}

export async function verifyPasswordResetOtp(identifier, otp) {
  try {
    const data = await api.post('/login/forgot-password/verify', { identifier, otp });
    if (data && data.message && data.message.includes('not matched')) {
      return { success: false, message: data.message };
    }
    return { success: true, message: data.message || 'OTP validated successfully' };
  } catch (error) {
    return { success: false, message: error.message || 'Invalid or expired OTP' };
  }
}

export async function resetPasswordWithOtp(identifier, otp, newPassword) {
  try {
    const data = await api.put('/login/reset-password', {
      identifier,
      otp,
      new_password: newPassword
    });
    return { success: true, message: data.message || 'Password changed successfully' };
  } catch (error) {
    return { success: false, message: error.message || 'Failed to reset password' };
  }
}
