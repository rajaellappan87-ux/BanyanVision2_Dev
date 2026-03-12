import axios from "axios";

// Auto-detect backend URL:
// - When accessed via VS Code port forwarding, the frontend URL looks like
//   https://XXXX-3000.githubpreview.dev — so backend is XXXX-5000.githubpreview.dev
// - When running locally, just use localhost:5000
const getBaseURL = () => {
  const h = window.location.hostname;
  if (h === "localhost" || h === "127.0.0.1") return "http://localhost:5000/api";
  // VS Code port forwarding — replace port 3000 with 5000 in the host
  const backendHost = window.location.origin
    .replace("-3000.", "-5000.")
    .replace(":3000", ":5000");
  return `${backendHost}/api`;
};

const API = axios.create({ baseURL: getBaseURL() });

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("bv_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const apiRegister  = (data)          => API.post("/auth/register", data);
export const apiLogin     = (data)          => API.post("/auth/login", data);
export const apiGetMe     = ()              => API.get("/auth/me");
export const apiUpdateProfile = (data)     => API.put("/auth/profile", data);

// ── Products ──────────────────────────────────────────────────────────────────
export const apiGetProducts   = (params)   => API.get("/products", { params });
export const apiGetProduct    = (id)       => API.get(`/products/${id}`);
export const apiCreateProduct = (formData) => API.post("/products", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const apiUpdateProduct = (id, fd)   => API.put(`/products/${id}`, fd,   { headers: { "Content-Type": "multipart/form-data" } });
export const apiDeleteProduct = (id)       => API.delete(`/products/${id}`);
export const apiDeleteProductImage = (productId, publicId) => API.delete(`/products/${productId}/images/${encodeURIComponent(publicId)}`);

// ── Reviews ───────────────────────────────────────────────────────────────────
export const apiCreateReview  = (data)     => API.post("/reviews", data);
export const apiMarkHelpful   = (id)       => API.put(`/reviews/${id}/helpful`);

// ── Orders ────────────────────────────────────────────────────────────────────
export const apiCreatePayment = (data)     => API.post("/orders/create-payment", data);
export const apiCreateOrder   = (data)     => API.post("/orders", data);
export const apiGetMyOrders   = ()         => API.get("/orders/my");
export const apiGetAllOrders  = ()         => API.get("/orders");
export const apiUpdateStatus  = (id, s)   => API.put(`/orders/${id}/status`, { status: s });

// ── Wishlist ──────────────────────────────────────────────────────────────────
export const apiToggleWishlist = (productId) => API.post("/wishlist/toggle", { productId });
export const apiGetWishlist    = ()           => API.get("/wishlist");

// ── Coupons ───────────────────────────────────────────────────────────────────
export const apiValidateCoupon = (code)    => API.post("/coupons/validate", { code });
export const apiGetCoupons     = ()        => API.get("/coupons");
export const apiCreateCoupon   = (data)   => API.post("/coupons", data);
export const apiDeleteCoupon   = (id)     => API.delete(`/coupons/${id}`);

// ── Admin ─────────────────────────────────────────────────────────────────────
export const apiAdminStats      = ()           => API.get("/admin/stats");
export const apiAdminUsers      = ()           => API.get("/admin/users");
export const apiAdminCreateUser = (data)       => API.post("/admin/users", data);
export const apiAdminToggleUser = (id)         => API.put(`/admin/users/${id}/toggle`);
export const apiAdminChangeRole = (id, role)   => API.put(`/admin/users/${id}/role`, { role });
export const apiAdminDeleteUser   = (id)         => API.delete(`/admin/users/${id}`);

// ── Inventory ─────────────────────────────────────────────────────────────────
export const apiAdminInventory      = ()              => API.get("/admin/inventory");
export const apiAdminStockUpdate    = (id, data)      => API.patch(`/admin/inventory/${id}`, data);
