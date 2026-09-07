const WISHLIST_KEY = 'dealbridge_wishlist';

export function getWishlist() {
  const data = localStorage.getItem(WISHLIST_KEY);
  return data ? JSON.parse(data) : [];
}

function saveWishlist(wishlist) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  document.dispatchEvent(new CustomEvent('wishlist-change', { detail: { wishlist } }));
}

export function addToWishlist(productId) {
  const wishlist = getWishlist();
  if (!wishlist.includes(productId)) {
    wishlist.push(productId);
    saveWishlist(wishlist);
  }
  return wishlist;
}

export function removeFromWishlist(productId) {
  const wishlist = getWishlist().filter(id => id !== productId);
  saveWishlist(wishlist);
  return wishlist;
}

export function toggleWishlist(productId) {
  if (isInWishlist(productId)) {
    return removeFromWishlist(productId);
  } else {
    return addToWishlist(productId);
  }
}

export function isInWishlist(productId) {
  return getWishlist().includes(productId);
}
