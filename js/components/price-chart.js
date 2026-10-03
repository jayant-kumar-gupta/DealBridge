export function filterPriceHistory(priceHistory, range = '1m') {
  if (!priceHistory || priceHistory.length === 0) return [];
  const now = new Date();
  let days = 30;
  const r = (range || '1m').toLowerCase();
  if (r === '1m') days = 30;
  else if (r === '6m') days = 180;
  else if (r === '1y') days = 365;
  else days = 30;

  const cutoff = new Date(now.getTime() - days * 86400000);
  return priceHistory.filter(p => new Date(p.date) >= cutoff);
}

export function renderPriceChart(canvasId, priceHistory, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  // Resize canvas according to display width & DPR for crisp retina lines
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  const padding = { top: 25, right: 35, bottom: 40, left: 65 };
  const chartWidth = Math.max(10, width - padding.left - padding.right);
  const chartHeight = Math.max(10, height - padding.top - padding.bottom);

  ctx.clearRect(0, 0, width, height);

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
                 document.body.getAttribute('data-theme') === 'dark';

  const textColor = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  const partnerMap = options.partnerMap || new Map();
  const visiblePartnerIds = options.visiblePartnerIds || null;
  const range = (options.range || '1m').toLowerCase();

  // Time range strictly defines the full X-axis timeline window
  const now = new Date();
  const maxTime = now.getTime();
  let minTime = maxTime - 30 * 86400000;
  if (range === '6m') {
    minTime = maxTime - 180 * 86400000;
  } else if (range === '1y') {
    minTime = maxTime - 365 * 86400000;
  } else {
    minTime = maxTime - 30 * 86400000;
  }
  const timeRange = maxTime - minTime;

  // Filter to visible partners within this timeframe
  const activePoints = (priceHistory || []).filter(p => {
    const ptTime = new Date(p.date).getTime();
    if (ptTime < minTime || ptTime > maxTime) return false;
    if (!visiblePartnerIds) return true;
    return visiblePartnerIds.has ? visiblePartnerIds.has(p.partner_id) : visiblePartnerIds.includes(p.partner_id);
  });

  // Draw Grid Lines & Y-Axis Labels
  const gridLines = 5;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 0.5;

  let minPrice = 0;
  let maxPrice = 1000;
  let priceRange = 1000;

  if (activePoints.length > 0) {
    const allPrices = activePoints.map(p => p.price);
    const rawMin = Math.min(...allPrices);
    const rawMax = Math.max(...allPrices);

    minPrice = rawMin * 0.95;
    maxPrice = rawMax * 1.05;
    if (minPrice >= maxPrice || rawMin === rawMax) {
      minPrice = rawMin * 0.9;
      maxPrice = rawMax * 1.1;
    }
    priceRange = maxPrice - minPrice;
  }

  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (chartHeight / gridLines) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    if (activePoints.length > 0) {
      const price = maxPrice - (priceRange / gridLines) * i;
      ctx.fillStyle = textColor;
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText('₹' + Math.round(price).toLocaleString('en-IN'), padding.left - 8, y);
    }
  }

  // Draw X-Axis Date Labels across the full timeline window
  const xLabelCount = range === '1m' ? 4 : range === '6m' ? 6 : 6;
  ctx.fillStyle = textColor;
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  for (let i = 0; i <= xLabelCount; i++) {
    const t = minTime + (timeRange / xLabelCount) * i;
    const x = padding.left + (chartWidth / xLabelCount) * i;
    const d = new Date(t);
    let label = '';
    if (range === '1m') {
      label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } else if (range === '6m') {
      label = d.toLocaleDateString('en-IN', { month: 'short' });
    } else {
      label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    }
    ctx.fillText(label, x, height - padding.bottom + 10);
  }

  if (activePoints.length === 0) {
    ctx.fillStyle = textColor;
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const periodName = range === '1m' ? 'past 1 month' : range === '6m' ? 'past 6 months' : 'past 1 year';
    ctx.fillText(`No price history recorded in the ${periodName}`, width / 2, height / 2);
    canvas._plottedData = [];
    return;
  }

  // Group active points by partner_id
  const partnerGroups = new Map();
  activePoints.forEach(p => {
    if (!partnerGroups.has(p.partner_id)) {
      partnerGroups.set(p.partner_id, []);
    }
    partnerGroups.get(p.partner_id).push(p);
  });

  const plottedData = [];

  partnerGroups.forEach((points, partnerId) => {
    points.sort((a, b) => new Date(a.date) - new Date(b.date));

    const partner = partnerMap.get ? partnerMap.get(partnerId) : partnerMap[partnerId];
    const partnerName = partner ? partner.name : `Partner #${partnerId}`;
    const color = (partner && partner.badge_color) ? partner.badge_color : '#1d8ba0';

    const coords = points.map(pt => {
      const ptTime = new Date(pt.date).getTime();
      const ratio = (ptTime - minTime) / timeRange;
      const x = padding.left + Math.max(0, Math.min(1, ratio)) * chartWidth;
      const y = padding.top + chartHeight - ((pt.price - minPrice) / priceRange) * chartHeight;
      const item = {
        partnerId,
        partnerName,
        color,
        date: pt.date,
        price: pt.price,
        x,
        y,
      };
      plottedData.push(item);
      return item;
    });

    // Draw line for multiple points
    if (coords.length > 1) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      coords.forEach((coord, i) => {
        if (i === 0) ctx.moveTo(coord.x, coord.y);
        else ctx.lineTo(coord.x, coord.y);
      });
      ctx.stroke();
    }

    // Draw marker dot for each point
    coords.forEach(coord => {
      ctx.beginPath();
      ctx.arc(coord.x, coord.y, coords.length === 1 ? 5.5 : 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    });
  });

  canvas._plottedData = plottedData;

  // Initialize hover listeners once
  if (!canvas._chartHoverAttached && !options._skipHoverCheck) {
    canvas._chartHoverAttached = true;

    canvas.addEventListener('mousemove', (e) => {
      const cRect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - cRect.left;
      const mouseY = e.clientY - cRect.top;

      const data = canvas._plottedData || [];
      let nearest = null;
      let minDist = 35; // 35px threshold

      for (const pt of data) {
        const dist = Math.hypot(pt.x - mouseX, pt.y - mouseY);
        if (dist < minDist) {
          minDist = dist;
          nearest = pt;
        }
      }

      if (nearest) {
        canvas.style.cursor = 'pointer';
        renderPriceChart(canvasId, priceHistory, { ...options, _skipHoverCheck: true });
        drawTooltip(canvas, nearest);
      } else {
        canvas.style.cursor = 'default';
        if (canvas._hasTooltip) {
          canvas._hasTooltip = false;
          renderPriceChart(canvasId, priceHistory, { ...options, _skipHoverCheck: true });
        }
      }
    });

    canvas.addEventListener('mouseleave', () => {
      canvas.style.cursor = 'default';
      if (canvas._hasTooltip) {
        canvas._hasTooltip = false;
        renderPriceChart(canvasId, priceHistory, { ...options, _skipHoverCheck: true });
      }
    });
  }
}

function drawTooltip(canvas, pt) {
  const ctx = canvas.getContext('2d');
  ctx.save();

  canvas._hasTooltip = true;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
                 document.body.getAttribute('data-theme') === 'dark';

  // Highlight selected point with a prominent circle
  ctx.beginPath();
  ctx.arc(pt.x, pt.y, 6.5, 0, Math.PI * 2);
  ctx.fillStyle = pt.color;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  const formattedDate = new Date(pt.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const formattedPrice = '₹' + Math.round(pt.price).toLocaleString('en-IN');
  const title = pt.partnerName;

  ctx.font = 'bold 12px Inter, sans-serif';
  const titleWidth = ctx.measureText(title).width;
  ctx.font = '11px Inter, sans-serif';
  const subtitleWidth = ctx.measureText(`${formattedPrice} · ${formattedDate}`).width;
  const contentWidth = Math.max(titleWidth + 18, subtitleWidth);

  const boxWidth = contentWidth + 24;
  const boxHeight = 50;

  const rect = canvas.getBoundingClientRect();
  let boxX = pt.x - boxWidth / 2;
  let boxY = pt.y - boxHeight - 12;

  if (boxX < 10) boxX = 10;
  if (boxX + boxWidth > rect.width - 10) boxX = rect.width - boxWidth - 10;
  if (boxY < 10) boxY = pt.y + 14;

  // Tooltip shadow and box
  ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 8);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = isDark ? '#475569' : '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Partner color dot
  ctx.beginPath();
  ctx.arc(boxX + 14, boxY + 16, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = pt.color;
  ctx.fill();

  // Partner name
  ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, boxX + 24, boxY + 16);

  // Price and date
  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.font = '11px Inter, sans-serif';
  ctx.fillText(`${formattedPrice} · ${formattedDate}`, boxX + 12, boxY + 35);

  ctx.restore();
}
