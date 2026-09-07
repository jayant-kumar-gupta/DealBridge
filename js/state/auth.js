import { users, demoCredentials } from '../data/users.js';

const AUTH_KEY = 'dealbridge_auth';

export function isLoggedIn() {
  return localStorage.getItem(AUTH_KEY) !== null;
}

export function getCurrentUser() {
  const authData = localStorage.getItem(AUTH_KEY);
  if (!authData) return null;
  return JSON.parse(authData);
}

export function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === 'admin';
}

export function login(email, password) {
  // Check against demo credentials
  const userEntry = Object.values(demoCredentials).find(
    cred => cred.email === email && cred.password === password
  );
  if (!userEntry) {
    return { success: false, message: 'Invalid email or password' };
  }
  const user = users.find(u => u.email === email);
  if (!user) {
    return { success: false, message: 'User not found' };
  }
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  document.dispatchEvent(new CustomEvent('auth-change', { detail: { user, loggedIn: true } }));
  return { success: true, user };
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  document.dispatchEvent(new CustomEvent('auth-change', { detail: { user: null, loggedIn: false } }));
}

export function requireAuth(redirectUrl = '/login.html') {
  if (!isLoggedIn()) {
    window.location.href = `${redirectUrl}?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
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
