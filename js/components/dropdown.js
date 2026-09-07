export function initDropdowns() {
  document.addEventListener('click', (e) => {
    // Close all open dropdowns if clicking outside
    if (!e.target.closest('.dropdown')) {
      document.querySelectorAll('.dropdown-menu.open').forEach(menu => {
        menu.classList.remove('open');
      });
    }
  });
}

export function toggleDropdown(triggerId, menuId) {
  const menu = document.getElementById(menuId);
  if (!menu) return;
  
  // Close other dropdowns
  document.querySelectorAll('.dropdown-menu.open').forEach(m => {
    if (m.id !== menuId) m.classList.remove('open');
  });
  
  menu.classList.toggle('open');
}
