import { products } from '../data/products.js';

const CART_KEY = 'dealbridge_cart';

export function getCart() {
  const data = localStorage.getItem(CART_KEY);
  return data ? JSON.parse(data) : [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  document.dispatchEvent(new CustomEvent('cart-change', { detail: { cart, count: getCartCount() } }));
}

export function addToCart(productId, quantity = 1) {
  const cart = getCart();
  const existing = cart.find(item => item.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }
  saveCart(cart);
  return cart;
}

export function removeFromCart(productId) {
  const cart = getCart().filter(item => item.productId !== productId);
  saveCart(cart);
  return cart;
}

export function updateQuantity(productId, quantity) {
  if (quantity < 1) return removeFromCart(productId);
  const cart = getCart();
  const item = cart.find(item => item.productId === productId);
  if (item) {
    item.quantity = quantity;
    saveCart(cart);
  }
  return cart;
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
  document.dispatchEvent(new CustomEvent('cart-change', { detail: { cart: [], count: 0 } }));
}

export function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

export function isInCart(productId) {
  return getCart().some(item => item.productId === productId);
}

export function getCartTotal() {
  return getCart().reduce((total, item) => {
    const product = products.find(p => p.id === item.productId);
    return total + (product ? product.ourPrice * item.quantity : 0);
  }, 0);
}

export function getCartSavings() {
  return getCart().reduce((savings, item) => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return savings;
    const cheapestPartner = product.partnerPrices.reduce((min, pp) => pp.price < min.price ? pp : min);
    return savings + ((cheapestPartner.price - product.ourPrice) * item.quantity);
  }, 0);
}
