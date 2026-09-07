let activeModal = null;

export function showModal(contentHTML, options = {}) {
  // Create dialog if it doesn't exist
  if (activeModal) closeModal();
  
  const dialog = document.createElement('dialog');
  dialog.className = 'modal';
  dialog.setAttribute('closedby', 'any');
  
  const { title = '', showClose = true, maxWidth = '560px' } = options;
  dialog.style.maxWidth = maxWidth;
  
  dialog.innerHTML = `
    ${title ? `
      <div class="modal__header">
        <h3>${title}</h3>
        ${showClose ? '<button class="modal__close btn btn-ghost btn-icon" aria-label="Close">✕</button>' : ''}
      </div>
    ` : ''}
    <div class="modal__body">${contentHTML}</div>
  `;
  
  document.body.appendChild(dialog);
  activeModal = dialog;
  
  // Close button
  const closeBtn = dialog.querySelector('.modal__close');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  
  // Close on backdrop click (fallback for browsers without closedby)
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeModal();
  });
  
  dialog.addEventListener('close', () => {
    dialog.remove();
    activeModal = null;
  });
  
  dialog.showModal();
  return dialog;
}

export function closeModal() {
  if (activeModal) {
    activeModal.close();
  }
}

export function confirmModal(message, options = {}) {
  return new Promise((resolve) => {
    const { title = 'Confirm', confirmText = 'Confirm', cancelText = 'Cancel', type = 'primary' } = options;
    const dialog = showModal(`
      <p style="margin-bottom: var(--space-xl);">${message}</p>
      <div class="modal__footer" style="border: none; padding: 0;">
        <button class="btn btn-secondary cancel-btn">${cancelText}</button>
        <button class="btn btn-${type} confirm-btn">${confirmText}</button>
      </div>
    `, { title, showClose: false });
    
    dialog.querySelector('.cancel-btn').addEventListener('click', () => { closeModal(); resolve(false); });
    dialog.querySelector('.confirm-btn').addEventListener('click', () => { closeModal(); resolve(true); });
  });
}
