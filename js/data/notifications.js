export const notifications = [
  {
    id: 1,
    userId: 1,
    type: 'order',
    title: 'Order Delivered',
    message: 'Your order ORD-2026-001 has been delivered successfully.',
    icon: '📦',
    read: true,
    date: '2026-08-14T11:00:00',
    link: '/order-detail.html?id=ORD-2026-001'
  },
  {
    id: 2,
    userId: 1,
    type: 'promo',
    title: 'New Promo Code Available!',
    message: 'You have a new partner promo code ready to be redeemed.',
    icon: '🎟️',
    read: false,
    date: '2026-08-15T09:30:00',
    link: '/profile.html?tab=promos'
  },
  {
    id: 3,
    userId: 1,
    type: 'price-drop',
    title: 'Price Drop Alert',
    message: 'Sony WH-1000XM5 from your wishlist is now 17% off!',
    icon: '📉',
    read: false,
    date: '2026-08-16T10:15:00',
    link: '/product.html?id=1'
  },
  {
    id: 4,
    userId: 1,
    type: 'system',
    title: 'Welcome to DealBridge',
    message: 'Thank you for joining our platform. Start exploring the best deals today!',
    icon: '👋',
    read: true,
    date: '2025-06-15T14:20:00',
    link: '/'
  },
  {
    id: 5,
    userId: 1,
    type: 'order',
    title: 'Order Shipped',
    message: 'Your order ORD-2026-002 is on the way.',
    icon: '🚚',
    read: true,
    date: '2026-08-12T16:45:00',
    link: '/order-detail.html?id=ORD-2026-002'
  },
  {
    id: 6,
    userId: 1,
    type: 'promo',
    title: 'Promo Code Expiring',
    message: 'Your 15% off TechBay code is expiring in 2 days.',
    icon: '⏳',
    read: false,
    date: '2026-08-16T12:00:00',
    link: '/profile.html?tab=promos'
  },
  {
    id: 7,
    userId: 1,
    type: 'order',
    title: 'Order Cancelled',
    message: 'Your order ORD-2026-003 has been cancelled as requested.',
    icon: '❌',
    read: true,
    date: '2026-07-28T08:10:00',
    link: '/order-detail.html?id=ORD-2026-003'
  },
  {
    id: 8,
    userId: 1,
    type: 'price-drop',
    title: 'Flash Sale Starting',
    message: 'Up to 50% off on top Fashion brands. Sale starts in 1 hour!',
    icon: '⚡',
    read: false,
    date: '2026-08-16T13:00:00',
    link: '/category.html?id=4'
  },
  {
    id: 9,
    userId: 1,
    type: 'order',
    title: 'Payment Successful',
    message: 'We received your payment of ₹1,04,999 for order ORD-2026-004.',
    icon: '💳',
    read: true,
    date: '2026-08-15T18:05:00',
    link: '/order-detail.html?id=ORD-2026-004'
  },
  {
    id: 10,
    userId: 1,
    type: 'system',
    title: 'Profile Updated',
    message: 'Your shipping address was successfully updated.',
    icon: '✅',
    read: true,
    date: '2026-08-01T09:12:00',
    link: '/profile.html'
  }
];

export function getNotificationsByUser(userId) {
  return notifications.filter(n => n.userId === userId).sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getUnreadCount(userId) {
  return notifications.filter(n => n.userId === userId && !n.read).length;
}

export function markAsRead(notificationId) {
  const notif = notifications.find(n => n.id === notificationId);
  if (notif) notif.read = true;
}

export function markAllAsRead(userId) {
  notifications.forEach(n => {
    if (n.userId === userId) n.read = true;
  });
}
