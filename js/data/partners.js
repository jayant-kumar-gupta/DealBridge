export const partners = [
  { id: 1, name: 'MegaMart', description: 'India\'s largest online marketplace offering a vast selection of products at unbeatable prices.', logo: null, color: '#E85D3A', status: 'active', productCount: 18, activeDealCount: 12, website: 'megamart.example.com' },
  { id: 2, name: 'QuickShop', description: 'Lightning-fast deliveries and exclusive deals on top brands.', logo: null, color: '#4A90D9', status: 'active', productCount: 15, activeDealCount: 8, website: 'quickshop.example.com' },
  { id: 3, name: 'PrimeDeals', description: 'Premium shopping experience with guaranteed authentic products.', logo: null, color: '#7B61FF', status: 'active', productCount: 20, activeDealCount: 15, website: 'primedeals.example.com' },
  { id: 4, name: 'ValueStore', description: 'Your destination for budget-friendly shopping and massive discounts.', logo: null, color: '#2ECC71', status: 'active', productCount: 22, activeDealCount: 18, website: 'valuestore.example.com' },
  { id: 5, name: 'TechBay', description: 'Specialized retailer for electronics, gadgets, and tech accessories.', logo: null, color: '#F39C12', status: 'active', productCount: 12, activeDealCount: 10, website: 'techbay.example.com' },
  { id: 6, name: 'Amazon', description: 'World\'s largest online retailer providing A to Z products.', logo: null, color: '#FF9900', status: 'active', productCount: 24, activeDealCount: 20, website: 'amazon.in' }
];

export function getPartnerById(id) {
  return partners.find(p => p.id === id);
}
