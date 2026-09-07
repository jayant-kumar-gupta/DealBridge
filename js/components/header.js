import { isLoggedIn, getCurrentUser, logout } from '../state/auth.js';
import { getCartCount } from '../state/cart.js';
import { getUnreadCount } from '../data/notifications.js';
import { toggleDropdown } from './dropdown.js';

export function initHeader() {
  const headerEl = document.getElementById('app-header');
  if (!headerEl) return;
  headerEl.className = 'site-header';
  renderHeader(headerEl);
  setupHeaderEvents(headerEl);
  initTheme();
}

function renderHeader(headerEl) {
  const loggedIn = isLoggedIn();
  const user = getCurrentUser();
  const cartCount = getCartCount();
  
  headerEl.innerHTML = `
    <div class="header-container container">
      <div class="header-left">
        <button class="mobile-menu-btn" aria-label="Open menu">☰</button>
        <a href="/" class="header-logo">
          <img src="/assets/images/logo.jpg" alt="DealBridge Logo" width="36" height="36">
          <span class="header-logo__text">DealBridge</span>
        </a>
      </div>
      
      <div class="header-center">
        <form class="header-search search-box" action="/search.html" method="get">
          <input type="search" name="q" placeholder="Search products, brands, categories..." required>
          <button type="submit" aria-label="Search">🔍</button>
        </form>
      </div>
      
      <div class="header-right header-actions">
        <button class="theme-toggle-btn btn btn-ghost btn-icon" aria-label="Toggle theme" title="Toggle dark/light mode">☀️</button>
        
        ${loggedIn && user ? `
          <div class="header-user dropdown">
            <button class="btn btn-ghost user-btn dropdown-trigger" aria-haspopup="true" aria-expanded="false" id="profile-dropdown-btn">
              👤 <span class="user-name">${user.name.split(' ')[0]}</span> ▾
            </button>
            <div class="dropdown-menu" id="profile-dropdown" role="menu">
              <div class="dropdown-header" style="padding: 10px 16px; border-bottom: 1px solid var(--color-border);">
                <strong style="display:block; color: var(--color-text);">${user.name}</strong>
                <span style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">${user.email}</span>
              </div>
              <a href="/profile.html" class="dropdown-item">👤 My Profile</a>
              <a href="/orders.html" class="dropdown-item">📦 My Orders</a>
              <a href="/wishlist.html" class="dropdown-item">❤️ Wishlist</a>
              <a href="/addresses.html" class="dropdown-item">📍 Manage Addresses</a>
              <a href="/promo-codes.html" class="dropdown-item">🎟️ Promo Codes</a>
              <a href="/notifications.html" class="dropdown-item" style="display: flex; justify-content: space-between; align-items: center;">
                <span>🔔 Notifications</span>
                <span class="badge badge-discount" id="notification-badge" style="display:none; font-size: 10px; padding: 2px 6px;">0</span>
              </a>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item logout-btn" style="width: 100%; text-align: left; background: none; border: none; font-size: inherit; color: var(--color-error); cursor: pointer;">🚪 Logout</button>
            </div>
          </div>
        ` : `
          <a href="/login.html" class="btn btn-primary btn-sm login-btn">Login</a>
        `}
        
        <a href="/cart.html" class="btn btn-ghost header-action header-cart-btn" aria-label="Shopping Cart">
          <span>🛒</span>
          <span class="cart-label" style="font-weight: 500;">Cart</span>
          <span class="cart-count" id="header-cart-badge">${cartCount}</span>
        </a>
      </div>
    </div>
    
    <div class="mobile-nav-overlay"></div>
    <nav class="mobile-nav">
      <div class="mobile-nav__header">
        <div class="header-logo">
          <img src="/assets/images/logo.jpg" alt="DealBridge Logo" width="32" height="32">
          <span class="header-logo__text">DealBridge</span>
        </div>
        <button class="mobile-close-btn btn btn-ghost btn-icon" aria-label="Close menu">✕</button>
      </div>
      <div class="mobile-nav__body">
        <form class="mobile-search search-box mb-lg" action="/search.html" method="get">
          <input type="search" name="q" placeholder="Search products..." required>
          <button type="submit">🔍</button>
        </form>
        <ul class="mobile-nav__links">
          <li><a href="/">🏠 Home</a></li>
          <li><a href="/search.html">🛍️ All Products</a></li>
          <li><a href="/category.html?id=1">🔌 Electronics</a></li>
          <li><a href="/category.html?id=2">💻 Laptops</a></li>
          <li><a href="/category.html?id=3">📱 Smartphones</a></li>
          <li><a href="/category.html?id=4">👗 Fashion</a></li>
          <li><a href="/category.html?id=5">🏠 Appliances</a></li>
          <li><a href="/category.html?id=6">🎮 Gaming</a></li>
          ${loggedIn ? `
            <li style="border-top: 1px solid var(--color-border); margin-top: 8px; padding-top: 8px;"><a href="/profile.html">👤 My Profile</a></li>
            <li><a href="/orders.html">📦 My Orders</a></li>
            <li><a href="/wishlist.html">❤️ Wishlist</a></li>
            <li><a href="/addresses.html">📍 Addresses</a></li>
            <li><a href="/promo-codes.html">🎟️ Promo Codes</a></li>
            <li><a href="/notifications.html">🔔 Notifications</a></li>
            <li><button class="logout-btn-mobile btn btn-ghost btn-full" style="justify-content: flex-start; color: var(--color-error); padding: 12px 0;">🚪 Logout</button></li>
          ` : `
            <li style="border-top: 1px solid var(--color-border); margin-top: 8px; padding-top: 8px;"><a href="/login.html" class="btn btn-primary btn-full">Login / Sign Up</a></li>
          `}
        </ul>
      </div>
    </nav>
  `;

  // Update notification badge if user is logged in
  if (loggedIn && user) {
    const unreadCount = getUnreadCount(user.id);
    const badge = document.getElementById('notification-badge');
    if (badge && unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = 'inline-block';
    }
  }
}

function setupHeaderEvents(headerEl) {
  // Theme Toggle
  const themeBtn = headerEl.querySelector('.theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }
  
  // Mobile Menu
  const mobileMenuBtn = headerEl.querySelector('.mobile-menu-btn');
  const mobileCloseBtn = headerEl.querySelector('.mobile-close-btn');
  const mobileNav = headerEl.querySelector('.mobile-nav');
  const overlay = headerEl.querySelector('.mobile-nav-overlay');
  
  if (mobileMenuBtn && mobileNav && overlay) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileNav.classList.add('open');
      overlay.classList.add('open');
    });
    
    const closeMenu = () => {
      mobileNav.classList.remove('open');
      overlay.classList.remove('open');
    };
    
    if (mobileCloseBtn) mobileCloseBtn.addEventListener('click', closeMenu);
    overlay.addEventListener('click', closeMenu);
  }
  
  // Profile Dropdown
  const dropdownTrigger = headerEl.querySelector('#profile-dropdown-btn');
  if (dropdownTrigger) {
    dropdownTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown('profile-dropdown-btn', 'profile-dropdown');
    });
  }
  
  // Logout
  const logoutBtns = headerEl.querySelectorAll('.logout-btn, .logout-btn-mobile');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      logout();
      window.location.href = '/';
    });
  });
  
  // Event listeners for state changes
  document.addEventListener('cart-change', (e) => {
    const badge = document.getElementById('header-cart-badge');
    if (badge) badge.textContent = e.detail.count;
  });
  
  document.addEventListener('auth-change', () => {
    renderHeader(headerEl);
    setupHeaderEvents(headerEl);
    updateThemeIcon();
  });
}

function initTheme() {
  const savedTheme = localStorage.getItem('dealbridge_theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
  updateThemeIcon();
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('dealbridge_theme', newTheme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const themeBtns = document.querySelectorAll('.theme-toggle-btn');
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  themeBtns.forEach(btn => {
    btn.textContent = isDark ? '☀️' : '🌙';
  });
}
