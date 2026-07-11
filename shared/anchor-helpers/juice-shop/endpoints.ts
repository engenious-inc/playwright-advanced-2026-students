export const JuiceShopEndpoints = {
  baseUrl: process.env.JUICE_SHOP_BASE_URL ?? 'http://localhost:3000',
  apiBaseUrl: (process.env.JUICE_SHOP_BASE_URL ?? 'http://localhost:3000') + '/api',
  rest: {
    login: '/rest/user/login',
    whoami: '/rest/user/whoami',
    products: '/api/Products',
    feedback: '/api/Feedbacks',
    basket: (basketId: number) => `/api/Baskets/${basketId}`,
  },
} as const;

export const JuiceShopFixtures = {
  defaultAdmin: {
    email: 'admin@juice-sh.op',
    password: 'admin123',
  },
} as const;
