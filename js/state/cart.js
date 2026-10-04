import { api } from '../utils/api.js';
import { isLoggedIn } from './auth.js';

const CART_KEY = 'dealbridge_cart';

/**
 * Normalizes cart item from backend into frontend cart item representation.
 */
function normalizeBackendItem(item) {
  return {
    productId: item.product_id,
    quantity: item.quantity,
    partner_id: item.partner_id,
    name: item.name,
    brand: item.brand,
    image_path: item.image_path,
    image: item.image_path,
    price: item.price,
    our_deal: item.price,
    ourPrice: item.price,
    original_price: item.original_price,
    savings: item.savings,
    partner_name: item.partner_name,
    partner_color: item.partner_color,
  };
}

export function getCart() {
  try {
    const data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  document.dispatchEvent(new CustomEvent('cart-change', { detail: { cart, count: getCartCount() } }));
}

/**
 * Fetches user's cart from backend if logged in.
 */
export async function fetchCart() {
  if (!isLoggedIn()) {
    return getCart();
  }
  try {
    const items = await api.get('/carts/');
    if (Array.isArray(items)) {
      const cart = items.map(normalizeBackendItem);
      saveCart(cart);
      return cart;
    }
  } catch (err) {
    console.error('Failed to fetch cart from server:', err);
  }
  return getCart();
}

/**
 * Merges local guest cart items into user's DB cart upon login.
 */
export async function syncGuestCart() {
  if (!isLoggedIn()) return getCart();
  const localItems = getCart();
  if (!localItems || localItems.length === 0) {
    return await fetchCart();
  }

  try {
    for (const item of localItems) {
      try {
        await api.post('/carts/', {
          product_id: item.productId,
          quantity: item.quantity || 1,
          partner_id: item.partner_id || undefined,
        });
      } catch (postErr) {
        console.warn(`Failed to sync product ${item.productId} to cart:`, postErr);
      }
    }
  } catch (err) {
    console.error('Error during guest cart sync:', err);
  }

  return await fetchCart();
}

export async function addToCart(productId, quantity = 1, productData = null) {
  if (typeof productId === 'object' && productId !== null) {
    productData = productId;
    productId = productData.id ?? productData.productId;
  }
  const numId = Number(productId);
  const qty = Number(quantity) || 1;

  const cart = getCart();
  const existingIndex = cart.findIndex(item => Number(item.productId) === numId);

  if (existingIndex > -1) {
    cart[existingIndex].quantity += qty;
    if (productData) {
      Object.assign(cart[existingIndex], productData);
    }
  } else {
    const newItem = {
      productId: numId,
      quantity: qty,
      ...(productData || {}),
    };
    cart.push(newItem);
  }

  saveCart(cart);

  if (isLoggedIn()) {
    try {
      const serverItem = await api.post('/carts/', {
        product_id: numId,
        quantity: qty,
        partner_id: productData?.partner_id || undefined,
      });
      if (serverItem) {
        const currentCart = getCart();
        const idx = currentCart.findIndex(item => Number(item.productId) === numId);
        if (idx > -1) {
          currentCart[idx] = normalizeBackendItem(serverItem);
          saveCart(currentCart);
        }
      }
    } catch (err) {
      console.error('Failed to add item to server cart:', err);
    }
  }

  return getCart();
}

export async function removeFromCart(productId) {
  const numId = Number(productId);
  const cart = getCart().filter(item => Number(item.productId) !== numId);
  saveCart(cart);

  if (isLoggedIn()) {
    try {
      await api.delete(`/carts/${numId}`);
    } catch (err) {
      console.error('Failed to remove item from server cart:', err);
    }
  }

  return cart;
}

export async function updateQuantity(productId, quantity) {
  const numId = Number(productId);
  const qty = Number(quantity);
  if (qty < 1) {
    return removeFromCart(numId);
  }

  const cart = getCart();
  const item = cart.find(i => Number(i.productId) === numId);
  if (item) {
    item.quantity = qty;
    saveCart(cart);
  }

  if (isLoggedIn()) {
    try {
      const serverItem = await api.put('/carts/', {
        product_id: numId,
        quantity: qty,
      });
      if (serverItem) {
        const currentCart = getCart();
        const idx = currentCart.findIndex(i => Number(i.productId) === numId);
        if (idx > -1) {
          currentCart[idx] = normalizeBackendItem(serverItem);
          saveCart(currentCart);
        }
      }
    } catch (err) {
      console.error('Failed to update cart quantity on server:', err);
    }
  }

  return getCart();
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
  document.dispatchEvent(new CustomEvent('cart-change', { detail: { cart: [], count: 0 } }));
  return [];
}

export function getCartCount() {
  return getCart().reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

export function isInCart(productId) {
  const numId = Number(productId);
  return getCart().some(item => Number(item.productId) === numId);
}

export function getCartTotal() {
  return getCart().reduce((total, item) => {
    const price = Number(item.price ?? item.our_deal ?? item.ourPrice ?? 0);
    return total + (price * (Number(item.quantity) || 1));
  }, 0);
}

export function getCartSavings() {
  return getCart().reduce((savings, item) => {
    const price = Number(item.price ?? item.our_deal ?? item.ourPrice ?? 0);
    if (!price) return savings;
    const qty = Number(item.quantity) || 1;
    if (item.savings != null) {
      return savings + (Number(item.savings) * qty);
    }
    const originalPrice = Number(item.original_price ?? (price * 50 / 49));
    return savings + Math.max(0, (originalPrice - price) * qty);
  }, 0);
}

// Auto-register sync hooks and listeners
if (typeof window !== 'undefined') {
  window.__dealbridgeSyncCart = syncGuestCart;

  document.addEventListener('auth-change', async (e) => {
    if (e.detail?.loggedIn) {
      await syncGuestCart();
    } else {
      localStorage.removeItem(CART_KEY);
      document.dispatchEvent(new CustomEvent('cart-change', { detail: { cart: [], count: 0 } }));
    }
  });

  if (isLoggedIn()) {
    fetchCart().catch(() => {});
  }
}
