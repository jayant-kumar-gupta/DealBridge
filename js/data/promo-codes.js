export const promoCodes = [
  {
    id: 1,
    code: 'DEAL-XK9M-2026',
    discount: 1500,
    discountType: 'flat',
    applicableProductId: 1,
    applicablePartner: 'MegaMart',
    expiryDate: '2026-09-10',
    status: 'used',
    orderId: 'ORD-2026-001',
    minOrderValue: 5000
  },
  {
    id: 2,
    code: 'DEAL-PL2Q-2026',
    discount: 500,
    discountType: 'flat',
    applicableProductId: 10,
    applicablePartner: 'Amazon',
    expiryDate: '2026-09-15',
    status: 'available',
    orderId: 'ORD-2026-002',
    minOrderValue: 2000
  },
  {
    id: 3,
    code: 'DEAL-MZ5T-2026',
    discount: 10,
    discountType: 'percentage',
    applicableProductId: 5,
    applicablePartner: 'TechBay',
    expiryDate: '2026-08-01',
    status: 'expired',
    orderId: 'ORD-2026-003',
    minOrderValue: 50000
  },
  {
    id: 4,
    code: 'DEAL-WN7Y-2026',
    discount: 2500,
    discountType: 'flat',
    applicableProductId: 16,
    applicablePartner: 'ValueStore',
    expiryDate: '2026-10-01',
    status: 'available',
    orderId: null,
    minOrderValue: 10000
  },
  {
    id: 5,
    code: 'DEAL-JR4V-2026',
    discount: 15,
    discountType: 'percentage',
    applicableProductId: 8,
    applicablePartner: 'QuickShop',
    expiryDate: '2026-09-30',
    status: 'used',
    orderId: 'ORD-2026-004',
    minOrderValue: 30000
  },
  {
    id: 6,
    code: 'DEAL-KB9C-2026',
    discount: 200,
    discountType: 'flat',
    applicableProductId: 20,
    applicablePartner: 'PrimeDeals',
    expiryDate: '2026-12-31',
    status: 'available',
    orderId: null,
    minOrderValue: 1000
  }
];

export const availableCheckoutCodes = [
  { code: 'SAVE10', discount: 10, discountType: 'percentage', minOrderValue: 2000, description: '10% off on orders above ₹2,000' },
  { code: 'FLAT500', discount: 500, discountType: 'flat', minOrderValue: 5000, description: 'Flat ₹500 off on orders above ₹5,000' },
  { code: 'NEWUSER', discount: 15, discountType: 'percentage', minOrderValue: 1000, description: '15% off for new users' }
];

export function getPromoCodesByUser(userId) {
  // In a real app this would filter by user, for mock we just return all
  return promoCodes;
}

export function validateCheckoutCode(code, orderTotal) {
  const promo = availableCheckoutCodes.find(c => c.code.toUpperCase() === code.toUpperCase());
  if (!promo) {
    return { valid: false, discount: 0, message: 'Invalid promo code' };
  }
  if (orderTotal < promo.minOrderValue) {
    return { valid: false, discount: 0, message: `Minimum order value of ₹${promo.minOrderValue} required` };
  }
  
  let discountAmt = 0;
  if (promo.discountType === 'percentage') {
    discountAmt = (orderTotal * promo.discount) / 100;
  } else {
    discountAmt = promo.discount;
  }
  
  return { valid: true, discount: discountAmt, message: 'Promo code applied successfully!' };
}
