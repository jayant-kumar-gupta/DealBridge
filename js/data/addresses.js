export const addresses = [
  {
    id: 1,
    userId: 1,
    name: 'Jayant Kumar',
    phone: '+91 98765 43210',
    addressLine1: '42, Green Valley Apartments',
    addressLine2: 'Near City Mall, MG Road',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560001',
    type: 'home',
    isDefault: true
  },
  {
    id: 2,
    userId: 1,
    name: 'Jayant Kumar',
    phone: '+91 98765 43210',
    addressLine1: 'Tech Park, Block B, Floor 5',
    addressLine2: 'Outer Ring Road, Marathahalli',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560037',
    type: 'work',
    isDefault: false
  },
  {
    id: 3,
    userId: 1,
    name: 'Jayant Kumar',
    phone: '+91 87654 32100',
    addressLine1: '15, Raj Nagar Colony',
    addressLine2: 'Sector 12',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    type: 'other',
    isDefault: false
  }
];
export function getAddressesByUser(userId) {
  return addresses.filter(a => a.userId === userId);
}
export function getDefaultAddress(userId) {
  return addresses.find(a => a.userId === userId && a.isDefault);
}
