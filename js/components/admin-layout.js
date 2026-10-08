import { requireAuth, requireAdmin, logout } from '../state/auth.js';

export function initAdminLayout() {
  // Enforce admin access
  requireAuth('/login.html?admin=true');
  requireAdmin();

  // Render Sidebar
  const sidebar = document.getElementById('admin-sidebar');
  if (sidebar) {
    sidebar.innerHTML = `
      <div class="admin-sidebar__title">DealBridge Admin</div>
      <ul class="admin-nav">
          <li class="admin-nav__item"><a href="/admin/index.html" data-path="/admin/index.html">📊 Dashboard</a></li>
          <li class="admin-nav__item"><a href="/admin/users.html" data-path="/admin/users.html">👥 Users</a></li>
          <li class="admin-nav__item"><a href="/admin/products.html" data-path="/admin/products.html">📦 Products</a></li>
          <li class="admin-nav__item"><a href="/admin/categories.html" data-path="/admin/categories.html">📂 Categories</a></li>
          <li class="admin-nav__item"><a href="/admin/partners.html" data-path="/admin/partners.html">🤝 Partners</a></li>
          <li class="admin-nav__item"><a href="/admin/prices.html" data-path="/admin/prices.html">💰 Prices</a></li>
          <li class="admin-nav__item"><a href="/admin/orders.html" data-path="/admin/orders.html">📋 Orders</a></li>
          <li class="admin-nav__item"><a href="/admin/reviews.html" data-path="/admin/reviews.html">⭐ Reviews</a></li>
          <li class="admin-nav__item"><a href="#" id="admin-logout">🚪 Logout</a></li>
      </ul>
    `;

    // Highlight active link
    const currentPath = window.location.pathname;
    const links = sidebar.querySelectorAll('.admin-nav__item a[data-path]');
    links.forEach(link => {
      // Handle the case where path is just /admin/ or /admin
      let linkPath = link.getAttribute('data-path');
      if (currentPath === linkPath || (currentPath === '/admin/' && linkPath === '/admin/index.html')) {
        link.classList.add('active');
      }
    });

    // Handle logout
    const logoutBtn = document.getElementById('admin-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
        window.location.href = '/';
      });
    }
  }
}
