let container = null;

function ensureContainer() {
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message, type = 'info', duration = 3000) {
  const toastContainer = ensureContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  
  toast.innerHTML = `
    <span class="toast__icon">${icons[type] || icons.info}</span>
    <span class="toast__message">${message}</span>
    <button class="toast__close" aria-label="Dismiss">✕</button>
  `;
  
  toast.querySelector('.toast__close').addEventListener('click', () => dismissToast(toast));
  
  toastContainer.appendChild(toast);
  
  if (duration > 0) {
    setTimeout(() => dismissToast(toast), duration);
  }
  
  return toast;
}

function dismissToast(toast) {
  toast.style.animation = 'slideOut 0.3s ease forwards';
  toast.addEventListener('animationend', () => toast.remove());
}
