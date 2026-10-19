import { api } from '../utils/api.js';
import { isLoggedIn } from './auth.js';

const USER_CART_KEY = 'dealbridge_cart';
const GUEST_CART_KEY = 'dealbridge_guest_cart';

function getActiveCartKey() {
  return isLoggedIn() ? USER_CART_KEY : GUEST_CART_KEY;
}

/**
 * Normalizes cart item from backend into frontend cart item representation.
 */
function normalizeBackendItem(item) {
  const price = item.price != null ? Number(item.price) : 0;
  const markedPrice = item.marked_price != null ? Number(item.marked_price) : (item.original_price != null ? Number(item.original_price) : null);
  const originalPrice = markedPrice != null && markedPrice > price ? markedPrice : price;
  const savings = item.savings != null ? Number(item.savings) : Math.max(0, originalPrice - price);

  return {
    productId: item.product_id,
    quantity: item.quantity,
    partner_id: item.partner_id,
    name: item.name,
    brand: item.brand,
    image_path: item.image_path,
    image: item.image_path,
    price: price,
    our_deal: price,
    ourPrice: price,
    marked_price: markedPrice,
    original_price: originalPrice,
    savings: savings,
    partner_name: item.partner_name,
    partner_color: item.partner_color,
  };
}

export function getCart() {
  try {
    const key = getActiveCartKey();
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  const key = getActiveCartKey();
  localStorage.setItem(key, JSON.stringify(cart));
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
      localStorage.setItem(USER_CART_KEY, JSON.stringify(cart));
      document.dispatchEvent(new CustomEvent('cart-change', { detail: { cart, count: getCartCount() } }));
      return cart;
    }
  } catch (err) {
    console.error('Failed to fetch cart from server:', err);
  }
  return getCart();
}

let isSyncing = false;

/**
 * Merges local guest cart items into user's DB cart upon login.
 * Operates ONLY on guest cart items, then immediately clears guest cart so it never re-multiplies.
 */
export async function syncGuestCart() {
  if (!isLoggedIn() || isSyncing) return getCart();

  let guestItems = [];
  try {
    const data = localStorage.getItem(GUEST_CART_KEY);
    guestItems = data ? JSON.parse(data) : [];
  } catch {
    guestItems = [];
  }

  // Clear guest cart immediately so items can never be re-synced
  localStorage.removeItem(GUEST_CART_KEY);

  if (!guestItems || guestItems.length === 0) {
    return await fetchCart();
  }

  isSyncing = true;
  try {
    for (const item of guestItems) {
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
  } finally {
    isSyncing = false;
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
  localStorage.removeItem(USER_CART_KEY);
  localStorage.removeItem(GUEST_CART_KEY);
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
    const markedPrice = item.marked_price != null ? Number(item.marked_price) : (item.original_price != null ? Number(item.original_price) : null);
    if (markedPrice != null && markedPrice > price) {
      return savings + ((markedPrice - price) * qty);
    }
    return savings;
  }, 0);
}

// Auto-register sync hooks and listeners
if (typeof window !== 'undefined') {
  window.__dealbridgeSyncCart = syncGuestCart;

  document.addEventListener('auth-change', async (e) => {
    if (e.detail?.loggedIn) {
      await syncGuestCart();
    } else {
      localStorage.removeItem(USER_CART_KEY);
      localStorage.removeItem(GUEST_CART_KEY);
      document.dispatchEvent(new CustomEvent('cart-change', { detail: { cart: [], count: 0 } }));
    }
  });

  if (isLoggedIn()) {
    fetchCart().catch(() => {});
  }
}
