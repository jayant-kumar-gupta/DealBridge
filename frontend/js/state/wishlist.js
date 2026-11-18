const WISHLIST_KEY = 'dealbridge_wishlist';

export function getWishlist() {
  try {
    const data = localStorage.getItem(WISHLIST_KEY);
    return data ? JSON.parse(data).map(Number) : [];
  } catch {
    return [];
  }
}

function saveWishlist(wishlist) {
  const normalized = Array.from(new Set(wishlist.map(Number).filter(id => !isNaN(id) && id > 0)));
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(normalized));
  document.dispatchEvent(new CustomEvent('wishlist-change', { detail: { wishlist: normalized, count: normalized.length } }));
}

export function addToWishlist(productId) {
  const numId = Number(productId);
  if (!numId) return getWishlist();
  const wishlist = getWishlist();
  if (!wishlist.includes(numId)) {
    wishlist.push(numId);
    saveWishlist(wishlist);
  }
  return wishlist;
}

export function removeFromWishlist(productId) {
  const numId = Number(productId);
  const wishlist = getWishlist().filter(id => id !== numId);
  saveWishlist(wishlist);
  return wishlist;
}

export function toggleWishlist(productId) {
  const numId = Number(productId);
  if (isInWishlist(numId)) {
    return removeFromWishlist(numId);
  } else {
    return addToWishlist(numId);
  }
}

export function isInWishlist(productId) {
  const numId = Number(productId);
  return getWishlist().includes(numId);
}

export function getWishlistCount() {
  return getWishlist().length;
}

export function clearWishlist() {
  localStorage.removeItem(WISHLIST_KEY);
  document.dispatchEvent(new CustomEvent('wishlist-change', { detail: { wishlist: [], count: 0 } }));
}
