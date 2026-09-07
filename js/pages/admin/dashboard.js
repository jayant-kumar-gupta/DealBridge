import { initAdminLayout } from '../../components/admin-layout.js';
import { users } from '../../data/users.js';
import { orders } from '../../data/orders.js';
import { products } from '../../data/products.js';
import { partners } from '../../data/partners.js';
import { formatPrice, formatDate } from '../../utils/helpers.js';

document.addEventListener('DOMContentLoaded', () => {
    initAdminLayout();
    
    // Calculate Stats
    const totalUsers = users.length;
    const totalOrders = orders.length;
    const revenue = orders.reduce((sum, order) => sum + order.total, 0);
    const activeProducts = products.length;
    const activeDeals = products.filter(p => p.discount > 15).length;
    const partnerCount = partners.length;

    // Render Stats
    const statsContainer = document.getElementById('dashboard-stats');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-card__label">Total Users</div>
                <div class="stat-card__value">${totalUsers}</div>
                <div class="stat-card__change positive">↑ 12% from last month</div>
            </div>
            <div class="stat-card">
                <div class="stat-card__label">Total Orders</div>
                <div class="stat-card__value">${totalOrders}</div>
                <div class="stat-card__change positive">↑ 8% from last month</div>
            </div>
            <div class="stat-card">
                <div class="stat-card__label">Revenue</div>
                <div class="stat-card__value">${formatPrice(revenue)}</div>
                <div class="stat-card__change positive">↑ 15% from last month</div>
            </div>
            <div class="stat-card">
                <div class="stat-card__label">Active Products</div>
                <div class="stat-card__value">${activeProducts}</div>
                <div class="stat-card__change">Stable</div>
            </div>
            <div class="stat-card">
                <div class="stat-card__label">Active Deals (>15%)</div>
                <div class="stat-card__value">${activeDeals}</div>
                <div class="stat-card__change positive">↑ 2 new this week</div>
            </div>
            <div class="stat-card">
                <div class="stat-card__label">Partners</div>
                <div class="stat-card__value">${partnerCount}</div>
                <div class="stat-card__change">Stable</div>
            </div>
        `;
    }

    // Render Recent Orders
    const ordersBody = document.getElementById('recent-orders-body');
    if (ordersBody) {
        const recent = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
        ordersBody.innerHTML = recent.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>${formatDate(order.date)}</td>
                <td>User ID: ${order.userId}</td>
                <td>${formatPrice(order.total)}</td>
                <td><span class="badge ${order.status}">${order.status}</span></td>
            </tr>
        `).join('');
    }

    // Draw Charts (Mock Data)
    drawRevenueChart();
    drawOrdersChart();
});

function drawRevenueChart() {
    const canvas = document.getElementById('revenueChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set actual canvas size
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 300;
    
    const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const data = [120000, 150000, 140000, 180000, 220000, 250000];
    const maxData = Math.max(...data);
    
    const padding = 40;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = '#cbd5e1'; // border color
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Draw bars
    const barWidth = width / data.length - 20;
    ctx.fillStyle = '#1e90ff'; // Primary colorish
    
    data.forEach((val, i) => {
        const barHeight = (val / maxData) * height;
        const x = padding + 10 + i * (width / data.length);
        const y = canvas.height - padding - barHeight;
        
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Label
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText(months[i], x + barWidth / 2, canvas.height - padding + 20);
        ctx.fillStyle = '#1e90ff';
    });
}

function drawOrdersChart() {
    const canvas = document.getElementById('ordersChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 300;
    
    const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const data = [45, 60, 55, 80, 110, 130];
    const maxData = Math.max(...data);
    
    const padding = 40;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Axes
    ctx.beginPath();
    ctx.strokeStyle = '#cbd5e1';
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Line
    ctx.beginPath();
    ctx.strokeStyle = '#f59e0b'; // Accent color
    ctx.lineWidth = 3;
    
    data.forEach((val, i) => {
        const x = padding + (i * (width / (data.length - 1)));
        const y = canvas.height - padding - ((val / maxData) * height);
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Points & Labels
    data.forEach((val, i) => {
        const x = padding + (i * (width / (data.length - 1)));
        const y = canvas.height - padding - ((val / maxData) * height);
        
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText(months[i], x, canvas.height - padding + 20);
    });
}
