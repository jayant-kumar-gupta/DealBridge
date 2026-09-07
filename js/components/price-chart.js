export function renderPriceChart(canvasId, priceHistory, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  
  const width = rect.width;
  const height = rect.height;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Data processing
  if (!priceHistory || priceHistory.length === 0) return;
  const prices = priceHistory.map(p => p.price);
  const minPrice = Math.min(...prices) * 0.95;
  const maxPrice = Math.max(...prices) * 1.05;
  const priceRange = maxPrice - minPrice;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Get theme colors from CSS variables
  const style = getComputedStyle(document.documentElement);
  const textColor = style.getPropertyValue('--color-text-secondary').trim() || '#666';
  const borderColor = style.getPropertyValue('--color-border').trim() || '#eee';
  const primaryColor = style.getPropertyValue('--color-primary').trim() || '#1d8ba0';
  const dealColor = style.getPropertyValue('--color-deal').trim() || '#2a9d4e';
  
  // Draw grid lines
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 0.5;
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (chartHeight / gridLines) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    
    // Y-axis labels
    const price = maxPrice - (priceRange / gridLines) * i;
    ctx.fillStyle = textColor;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('₹' + Math.round(price).toLocaleString('en-IN'), padding.left - 8, y + 4);
  }
  
  // Draw X-axis labels
  const xLabelCount = Math.min(priceHistory.length, 6);
  const step = Math.max(1, Math.floor(priceHistory.length / xLabelCount));
  ctx.fillStyle = textColor;
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'center';
  for (let i = 0; i < priceHistory.length; i += step) {
    const x = padding.left + (chartWidth / (priceHistory.length - 1)) * i;
    const date = new Date(priceHistory[i].date);
    const label = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    ctx.fillText(label, x, height - padding.bottom + 20);
  }
  
  // Draw the line
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  
  priceHistory.forEach((point, i) => {
    const x = padding.left + (chartWidth / (priceHistory.length - 1)) * i;
    const y = padding.top + chartHeight - ((point.price - minPrice) / priceRange) * chartHeight;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  
  // Draw gradient fill under line
  const primaryRgba = primaryColor.includes('hsl') 
    ? primaryColor.replace('hsl(', 'hsla(').replace(')', ', 0.25)') 
    : 'rgba(29, 139, 160, 0.25)';
  const primaryTransparent = primaryColor.includes('hsl') 
    ? primaryColor.replace('hsl(', 'hsla(').replace(')', ', 0.0)') 
    : 'rgba(29, 139, 160, 0.0)';

  const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
  gradient.addColorStop(0, primaryRgba);
  gradient.addColorStop(1, primaryTransparent);
  
  ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
  ctx.lineTo(padding.left, padding.top + chartHeight);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Draw dots on each data point
  priceHistory.forEach((point, i) => {
    const x = padding.left + (chartWidth / (priceHistory.length - 1)) * i;
    const y = padding.top + chartHeight - ((point.price - minPrice) / priceRange) * chartHeight;
    
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = primaryColor;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
  
  // Highlight current price (last point)
  const lastPoint = priceHistory[priceHistory.length - 1];
  const lastX = padding.left + chartWidth;
  const lastY = padding.top + chartHeight - ((lastPoint.price - minPrice) / priceRange) * chartHeight;
  
  ctx.beginPath();
  ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
  ctx.fillStyle = dealColor;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Label for current price
  ctx.fillStyle = dealColor;
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('₹' + lastPoint.price.toLocaleString('en-IN'), lastX - 10, lastY - 10);
}

export function filterPriceHistory(priceHistory, range = '30d') {
  const now = new Date();
  let cutoff;
  switch (range) {
    case '7d': cutoff = new Date(now - 7 * 86400000); break;
    case '30d': cutoff = new Date(now - 30 * 86400000); break;
    case '6m': cutoff = new Date(now - 180 * 86400000); break;
    default: cutoff = new Date(now - 30 * 86400000);
  }
  return priceHistory.filter(p => new Date(p.date) >= cutoff);
}
