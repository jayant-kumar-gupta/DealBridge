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
  const padding = { top: 25, right: 30, bottom: 40, left: 65 };
  const chartWidth = Math.max(10, width - padding.left - padding.right);
  const chartHeight = Math.max(10, height - padding.top - padding.bottom);

  ctx.clearRect(0, 0, width, height);

  const style = getComputedStyle(document.documentElement);
  const textColor = style.getPropertyValue('--color-text-secondary').trim() || '#666';
  const borderColor = style.getPropertyValue('--color-border').trim() || '#eee';

  const partnerMap = options.partnerMap || new Map();
  const visiblePartnerIds = options.visiblePartnerIds || null;

  // Filter to visible partners
  const activePoints = (priceHistory || []).filter(p => {
    if (!visiblePartnerIds) return true;
    return visiblePartnerIds.has ? visiblePartnerIds.has(p.partner_id) : visiblePartnerIds.includes(p.partner_id);
  });

  if (activePoints.length === 0) {
    ctx.fillStyle = textColor;
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No price history available in this timeframe', width / 2, height / 2);
    canvas._plottedData = [];
    return;
  }

  // Min and Max prices across active points
  const allPrices = activePoints.map(p => p.price);
  let rawMin = Math.min(...allPrices);
  let rawMax = Math.max(...allPrices);

  let minPrice = rawMin * 0.95;
  let maxPrice = rawMax * 1.05;
  if (minPrice === maxPrice || maxPrice <= minPrice) {
    minPrice = minPrice * 0.9;
    maxPrice = maxPrice * 1.1;
  }
  const priceRange = maxPrice - minPrice;

  // Time range calculation
  const allTimes = activePoints.map(p => new Date(p.date).getTime());
  let minTime = Math.min(...allTimes);
  let maxTime = Math.max(...allTimes);
  if (minTime === maxTime) {
    minTime -= 86400000;
    maxTime += 86400000;
  }
  const timeRange = maxTime - minTime;

  // Draw Grid Lines & Y-Axis Labels
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 0.5;
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (chartHeight / gridLines) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    const price = maxPrice - (priceRange / gridLines) * i;
    ctx.fillStyle = textColor;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('₹' + Math.round(price).toLocaleString('en-IN'), padding.left - 8, y);
  }

  // Draw X-Axis Date Labels
  const xLabelCount = Math.min(5, Math.max(2, Math.floor(chartWidth / 90)));
  ctx.fillStyle = textColor;
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  for (let i = 0; i <= xLabelCount; i++) {
    const t = minTime + (timeRange / xLabelCount) * i;
    const x = padding.left + (chartWidth / xLabelCount) * i;
    const d = new Date(t);
    const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    ctx.fillText(label, x, height - padding.bottom + 10);
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
      const x = padding.left + ((ptTime - minTime) / timeRange) * chartWidth;
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

    // Draw line
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

    // Draw point markers
    coords.forEach(coord => {
      ctx.beginPath();
      ctx.arc(coord.x, coord.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
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

  // Highlight selected point
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
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 8);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Partner color dot
  ctx.beginPath();
  ctx.arc(boxX + 14, boxY + 16, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = pt.color;
  ctx.fill();

  // Partner name
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, boxX + 24, boxY + 16);

  // Price and date
  ctx.fillStyle = '#64748b';
  ctx.font = '11px Inter, sans-serif';
  ctx.fillText(`${formattedPrice} · ${formattedDate}`, boxX + 12, boxY + 35);

  ctx.restore();
}
