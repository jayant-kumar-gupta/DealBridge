export function initFooter() {
  const footerEl = document.getElementById('app-footer');
  if (!footerEl) return;
  footerEl.innerHTML = `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-col">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: var(--space-md);">
              <img src="/assets/images/logo.jpg" alt="DealBridge Logo" width="28" height="28" style="border-radius: 6px;">
              <h3 class="footer-section__title" style="margin-bottom: 0;">DealBridge</h3>
            </div>
            <p style="color: rgba(255, 255, 255, 0.7); font-size: var(--font-size-sm); line-height: 1.6; margin-bottom: var(--space-md);">
              Your trusted deal comparison and discovery platform. We partner with leading e-commerce platforms to bring you exclusive discounted prices and instant promo redemption.
            </p>
            <div class="footer-social">
              <a href="#" aria-label="Facebook" style="font-size: 1.25rem;">📘</a>
              <a href="#" aria-label="Twitter" style="font-size: 1.25rem;">🐦</a>
              <a href="#" aria-label="Instagram" style="font-size: 1.25rem;">📸</a>
              <a href="#" aria-label="LinkedIn" style="font-size: 1.25rem;">💼</a>
            </div>
          </div>
          
          <div class="footer-col">
            <h4 class="footer-section__title">Categories</h4>
            <ul>
              <li><a href="/category.html?id=1">Electronics</a></li>
              <li><a href="/category.html?id=2">Laptops</a></li>
              <li><a href="/category.html?id=3">Smartphones</a></li>
              <li><a href="/category.html?id=4">Fashion</a></li>
              <li><a href="/category.html?id=5">Home Appliances</a></li>
              <li><a href="/category.html?id=6">Gaming</a></li>
            </ul>
          </div>
          
          <div class="footer-col">
            <h4 class="footer-section__title">Quick Links</h4>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/search.html">All Products & Deals</a></li>
              <li><a href="/cart.html">Shopping Cart</a></li>
              <li><a href="/orders.html">My Orders</a></li>
              <li><a href="/wishlist.html">Wishlist</a></li>
              <li><a href="/promo-codes.html">Promo Codes</a></li>
            </ul>
          </div>
          
          <div class="footer-col">
            <h4 class="footer-section__title">Account & Support</h4>
            <ul>
              <li><a href="/profile.html">My Account</a></li>
              <li><a href="/addresses.html">Saved Addresses</a></li>
              <li><a href="/notifications.html">Notifications</a></li>
              <li><a href="/login.html">Login</a></li>
              <li><a href="/register.html">Create Account</a></li>
            </ul>
          </div>
        </div>
        
        <div class="footer-bottom">
          <p>&copy; ${new Date().getFullYear()} DealBridge. All rights reserved. Built with pride and honour.</p>
          <div style="display: flex; gap: var(--space-md);">
            <span style="color: rgba(255,255,255,0.5);">Verified Partner Network</span>
          </div>
        </div>
      </div>
    </footer>
  `;
}
