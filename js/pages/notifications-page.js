import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { isLoggedIn, logout, getCurrentUser } from '../state/auth.js';
import { getNotificationsByUser, markAsRead, markAllAsRead } from '../data/notifications.js';
import { showToast } from '../components/toast.js';

document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initFooter();

    if (!isLoggedIn()) {
        window.location.href = '/login.html?redirect=/notifications.html';
        return;
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
            window.location.href = '/login.html';
        });
    }

    const container = document.getElementById('notifications-list');
    const emptyState = document.getElementById('empty-state');
    const markAllBtn = document.getElementById('mark-all-btn');

    function renderNotifications() {
        const user = getCurrentUser();
        const userNotifs = getNotificationsByUser(user.id);
        
        container.innerHTML = '';
        
        if (userNotifs.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            markAllBtn.style.display = 'none';
            return;
        }

        container.style.display = 'flex';
        emptyState.style.display = 'none';

        // Sort by date desc
        const sorted = [...userNotifs].sort((a, b) => new Date(b.date) - new Date(a.date));

        sorted.forEach(notif => {
            const card = document.createElement('div');
            card.className = `card notification-card ${notif.read ? '' : 'unread'}`;
            card.style.display = 'flex';
            card.style.gap = 'var(--spacing-md)';
            card.style.padding = 'var(--spacing-md)';
            card.style.cursor = 'pointer';
            card.style.transition = 'background-color 0.2s';
            card.style.borderLeft = notif.read ? 'none' : '4px solid var(--color-primary)';
            if (!notif.read) {
                card.style.backgroundColor = 'var(--color-primary-light)';
            }

            const timeAgo = getTimeAgo(new Date(notif.date));

            card.innerHTML = `
                <div style="font-size: 1.5rem;">${notif.icon}</div>
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                        <h4 style="margin: 0; font-weight: ${notif.read ? '500' : '700'};">${notif.title}</h4>
                        <span style="font-size: 0.8rem; color: var(--color-text-secondary); white-space: nowrap;">${timeAgo}</span>
                    </div>
                    <p style="margin: 0; font-size: 0.95rem; color: ${notif.read ? 'var(--color-text-secondary)' : 'var(--color-text)'}; line-height: 1.4;">
                        ${notif.message}
                    </p>
                </div>
            `;

            card.addEventListener('click', () => {
                if (!notif.read) {
                    markAsRead(notif.id);
                    renderNotifications();
                    // Update header badge
                    const event = new Event('notifications-updated');
                    document.dispatchEvent(event);
                }
                if (notif.link) {
                    window.location.href = notif.link;
                }
            });

            container.appendChild(card);
        });
    }

    function getTimeAgo(date) {
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + ' years ago';
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + ' months ago';
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + ' days ago';
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + ' hours ago';
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + ' minutes ago';
        return Math.floor(seconds) + ' seconds ago';
    }

    markAllBtn.addEventListener('click', () => {
        const user = getCurrentUser();
        markAllAsRead(user.id);
        renderNotifications();
        showToast('All notifications marked as read');
        const event = new Event('notifications-updated');
        document.dispatchEvent(event);
    });

    renderNotifications();
});
