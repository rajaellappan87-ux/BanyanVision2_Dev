import client from './client';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const apiLogin         = (data)   => client.post('/auth/login', data);
export const apiRegister      = (data)   => client.post('/auth/register', data);
export const apiGetMe         = ()       => client.get('/auth/me');
export const apiUpdateProfile = (data)   => client.put('/auth/profile', data);

// ── Products ──────────────────────────────────────────────────────────────────
export const apiGetProducts   = (params) => client.get('/products', { params });
export const apiGetProduct    = (id)     => client.get(`/products/${id}`);

// ── Reviews ───────────────────────────────────────────────────────────────────
export const apiCreateReview  = (data)        => client.post('/reviews', data);
export const apiMarkHelpful   = (id)          => client.put(`/reviews/${id}/helpful`);
export const apiGetTopReviews = (limit = 5)   => client.get('/reviews/top', { params: { limit } });

// ── Orders ────────────────────────────────────────────────────────────────────
export const apiCreatePayment = (data)   => client.post('/orders/create-payment', data);
export const apiCreateOrder   = (data)   => client.post('/orders', data);
export const apiGetMyOrders   = ()       => client.get('/orders/my');

// ── Wishlist ──────────────────────────────────────────────────────────────────
export const apiToggleWishlist = (productId) => client.post('/wishlist/toggle', { productId });
export const apiGetWishlist    = ()           => client.get('/wishlist');

// ── Coupons ───────────────────────────────────────────────────────────────────
export const apiValidateCoupon = (code) => client.post('/coupons/validate', { code });

// ── Config (site settings — same as website) ──────────────────────────────────
export const apiGetConfig = (key) => client.get(`/config/${key}`);
