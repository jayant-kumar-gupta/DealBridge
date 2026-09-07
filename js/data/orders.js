export const orders = [
  {
    id: 'ORD-2026-001',
    userId: 1,
    date: '2026-08-10T10:30:00',
    items: [{ productId: 1, quantity: 1, price: 24999 }],
    subtotal: 24999,
    discount: 1500,
    total: 23499,
    status: 'delivered',
    paymentMethod: 'Credit Card',
    partnerId: 1,
    partnerName: 'MegaMart',
    promoCode: 'DEAL-XK9M-2026',
    redemptionStatus: 'redeemed',
    shippingAddress: {
      name: 'Jayant Kumar',
      addressLine1: '42, Green Valley Apartments',
      addressLine2: 'Near City Mall, MG Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001'
    },
    timeline: [
      { status: 'Order Placed', date: '2026-08-10 10:30 AM', completed: true },
      { status: 'Payment Successful', date: '2026-08-10 10:31 AM', completed: true },
      { status: 'Promo Code Generated', date: '2026-08-10 10:32 AM', completed: true },
      { status: 'Partner Redemption', date: '2026-08-11 02:15 PM', completed: true },
      { status: 'Delivered', date: '2026-08-14 11:00 AM', completed: true }
    ]
  },
  {
    id: 'ORD-2026-002',
    userId: 1,
    date: '2026-08-11T14:45:00',
    items: [{ productId: 10, quantity: 1, price: 9995 }],
    subtotal: 9995,
    discount: 500,
    total: 9495,
    status: 'delivered',
    paymentMethod: 'UPI',
    partnerId: 4,
    partnerName: 'ValueStore',
    promoCode: 'DEAL-PL2Q-2026',
    redemptionStatus: 'redeemed',
    shippingAddress: {
      name: 'Jayant Kumar',
      addressLine1: 'Tech Park, Block B, Floor 5',
      addressLine2: 'Outer Ring Road, Marathahalli',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560037'
    },
    timeline: [
      { status: 'Order Placed', date: '2026-08-11 02:45 PM', completed: true },
      { status: 'Payment Successful', date: '2026-08-11 02:46 PM', completed: true },
      { status: 'Promo Code Generated', date: '2026-08-11 02:48 PM', completed: true },
      { status: 'Partner Redemption', date: '2026-08-12 10:15 AM', completed: true },
      { status: 'Delivered', date: '2026-08-15 03:30 PM', completed: true }
    ]
  },
  {
    id: 'ORD-2026-003',
    userId: 1,
    date: '2026-08-15T09:15:00',
    items: [
      { productId: 19, quantity: 1, price: 19999 },
      { productId: 21, quantity: 1, price: 3299 }
    ],
    subtotal: 23298,
    discount: 0,
    total: 23298,
    status: 'active',
    paymentMethod: 'Net Banking',
    partnerId: 6,
    partnerName: 'Amazon',
    promoCode: null,
    redemptionStatus: 'generated',
    shippingAddress: {
      name: 'Jayant Kumar',
      addressLine1: '42, Green Valley Apartments',
      addressLine2: 'Near City Mall, MG Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001'
    },
    timeline: [
      { status: 'Order Placed', date: '2026-08-15 09:15 AM', completed: true },
      { status: 'Payment Successful', date: '2026-08-15 09:17 AM', completed: true },
      { status: 'Promo Code Generated', date: '2026-08-15 09:20 AM', completed: true },
      { status: 'Partner Redemption', date: 'Pending', completed: false },
      { status: 'Delivered', date: 'Pending', completed: false }
    ]
  },
  {
    id: 'ORD-2026-004',
    userId: 1,
    date: '2026-08-16T11:00:00',
    items: [{ productId: 4, quantity: 1, price: 104990 }],
    subtotal: 104990,
    discount: 5000,
    total: 99990,
    status: 'active',
    paymentMethod: 'Credit Card EMI',
    partnerId: 3,
    partnerName: 'PrimeDeals',
    promoCode: 'DEAL-MAC3-2026',
    redemptionStatus: 'generated',
    shippingAddress: {
      name: 'Jayant Kumar',
      addressLine1: 'Tech Park, Block B, Floor 5',
      addressLine2: 'Outer Ring Road, Marathahalli',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560037'
    },
    timeline: [
      { status: 'Order Placed', date: '2026-08-16 11:00 AM', completed: true },
      { status: 'Payment Successful', date: '2026-08-16 11:05 AM', completed: true },
      { status: 'Promo Code Generated', date: '2026-08-16 11:10 AM', completed: true },
      { status: 'Partner Redemption', date: 'Pending', completed: false },
      { status: 'Delivered', date: 'Pending', completed: false }
    ]
  },
  {
    id: 'ORD-2026-005',
    userId: 1,
    date: '2026-07-25T16:20:00',
    items: [{ productId: 12, quantity: 1, price: 7290 }],
    subtotal: 7290,
    discount: 0,
    total: 7290,
    status: 'cancelled',
    paymentMethod: 'UPI',
    partnerId: 6,
    partnerName: 'Amazon',
    promoCode: null,
    redemptionStatus: 'expired',
    shippingAddress: {
      name: 'Jayant Kumar',
      addressLine1: '42, Green Valley Apartments',
      addressLine2: 'Near City Mall, MG Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001'
    },
    timeline: [
      { status: 'Order Placed', date: '2026-07-25 04:20 PM', completed: true },
      { status: 'Payment Successful', date: '2026-07-25 04:22 PM', completed: true },
      { status: 'Cancelled by User', date: '2026-07-25 05:30 PM', completed: true },
      { status: 'Refund Initiated', date: '2026-07-26 10:00 AM', completed: true },
      { status: 'Refund Completed', date: '2026-07-28 02:15 PM', completed: true }
    ]
  },
  {
    id: 'ORD-2026-006',
    userId: 1,
    date: '2026-08-16T13:45:00',
    items: [{ productId: 24, quantity: 2, price: 1650 }],
    subtotal: 3300,
    discount: 330,
    total: 2970,
    status: 'active',
    paymentMethod: 'Wallet',
    partnerId: 4,
    partnerName: 'ValueStore',
    promoCode: 'DEAL-ORDN-2026',
    redemptionStatus: 'generated',
    shippingAddress: {
      name: 'Jayant Kumar',
      addressLine1: '15, Raj Nagar Colony',
      addressLine2: 'Sector 12',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201301'
    },
    timeline: [
      { status: 'Order Placed', date: '2026-08-16 01:45 PM', completed: true },
      { status: 'Payment Successful', date: '2026-08-16 01:46 PM', completed: true },
      { status: 'Promo Code Generated', date: '2026-08-16 01:50 PM', completed: true },
      { status: 'Partner Redemption', date: 'Pending', completed: false },
      { status: 'Delivered', date: 'Pending', completed: false }
    ]
  }
];

export function getOrderById(id) {
  return orders.find(o => o.id === id);
}

export function getOrdersByUser(userId) {
  return orders.filter(o => o.userId === userId).sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getOrdersByStatus(status) {
  return orders.filter(o => o.status === status);
}
