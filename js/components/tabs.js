export function initTabs(containerSelector, callback) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  
  const tabs = container.querySelectorAll('.tab-item');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabId = tab.dataset.tab;
      if (callback) callback(tabId);
    });
  });
  
  // Activate first tab by default
  if (tabs.length > 0 && !container.querySelector('.tab-item.active')) {
    tabs[0].classList.add('active');
  }
}
