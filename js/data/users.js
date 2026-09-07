export const users = [
  {
    id: 1,
    name: 'Jayant Kumar',
    email: 'jayant@example.com',
    phone: '+91 98765 43210',
    avatar: null,
    role: 'user',
    joinDate: '2025-06-15'
  },
  {
    id: 2,
    name: 'Admin User',
    email: 'admin@dealbridge.com',
    phone: '+91 99999 00000',
    avatar: null,
    role: 'admin',
    joinDate: '2025-01-01'
  }
];
export const demoCredentials = {
  user: { email: 'jayant@example.com', password: 'demo123' },
  admin: { email: 'admin@dealbridge.com', password: 'admin123' }
};
export function getUserById(id) {
  return users.find(u => u.id === id);
}
