import axios from "axios";

// ─── Backend URL detection ────────────────────────────────────────────────────
// Priority:
//   1. REACT_APP_API_URL env var  — set in Vercel for production
//   2. localhost:5000             — local dev
const getBaseURL = () => {
  // Vercel sets this during build from environment variables
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  const h = window.location.hostname;
  if (h === "localhost" || h === "127.0.0.1") {
    return "http://localhost:5000/api";
  }
  // VS Code port forwarding fallback
  const backendHost = window.location.origin
    .replace("-3000.", "-5000.")
    .replace(":3000", ":5000");
  return `${backendHost}/api`;
};

export const API = axios.create({ baseURL: getBaseURL() });

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("bv_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.metadata = { startTime: Date.now() };
  return config;
});

// Response logger — logs all API errors to backend
API.interceptors.response.use(
  (response) => {
    const duration = Date.now() - (response.config?.metadata?.startTime || Date.now());
    if (duration > 3000) {
      // Log slow API calls as warnings
      import("./utils/logger").then(({ default: log }) => {
        log.warn(`Slow API: ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`, { duration });
      });
    }
    return response;
  },
  (error) => {
    const duration = Date.now() - (error.config?.metadata?.startTime || Date.now());
    const status   = error.response?.status;
    const url      = error.config?.url || "";
    const method   = error.config?.method?.toUpperCase() || "";

    // Log to backend
    import("./utils/logger").then(({ default: log }) => {
      const level = status >= 500 ? "error" : "warn";
      log[level](`API ${method} ${url} → ${status || "NETWORK_ERROR"} (${duration}ms)`, {
        status,
        message: error.response?.data?.message || error.message,
        url, method, duration,
      }, error);
    });

    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const apiRegister      = (data)        => API.post("/auth/register", data);
export const apiLogin         = (data)        => API.post("/auth/login", data);
export const apiGetMe         = ()            => API.get("/auth/me");
export const apiUpdateProfile = (data)        => API.put("/auth/profile", data);

// ── Products ──────────────────────────────────────────────────────────────────
export const apiGetProducts        = (params) => API.get("/products", { params });
export const apiGetProduct         = (id)     => API.get(`/products/${id}`);
export const apiCreateProduct      = (fd)     => API.post("/products", fd, { headers: { "Content-Type": "multipart/form-data" } });
export const apiUpdateProduct      = (id, fd) => API.put(`/products/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
export const apiDeleteProduct      = (id)     => API.delete(`/products/${id}`);
export const apiDeleteProductImage = (pid, pubId) => API.delete(`/products/${pid}/images/${encodeURIComponent(pubId)}`);

// ── Reviews ───────────────────────────────────────────────────────────────────
export const apiCreateReview  = (data)         => API.post("/reviews", data);
export const apiMarkHelpful   = (id)           => API.put(`/reviews/${id}/helpful`);
export const apiGetTopReviews = (limit = 5)    => API.get("/reviews/top", { params: { limit } });

// ── Orders ────────────────────────────────────────────────────────────────────
export const apiCreatePayment     = (data)    => API.post("/orders/create-payment", data);
export const apiCreateOrder       = (data)    => API.post("/orders", data);
export const apiGetMyOrders       = ()        => API.get("/orders/my");
export const apiGetAllOrders      = ()        => API.get("/orders");
export const apiUpdateStatus      = (id, s)   => API.put(`/orders/${id}/status`, { status: s });
export const apiDeleteOrder       = (id)      => API.delete(`/orders/${id}`);
export const apiExportOrdersEmail = (data)    => API.post("/orders/export-email", data);

// ── Wishlist ──────────────────────────────────────────────────────────────────
export const apiToggleWishlist = (productId) => API.post("/wishlist/toggle", { productId });
export const apiGetWishlist    = ()           => API.get("/wishlist");

// ── Coupons ───────────────────────────────────────────────────────────────────
export const apiValidateCoupon = (code) => API.post("/coupons/validate", { code });
export const apiGetCoupons     = ()     => API.get("/coupons");
export const apiCreateCoupon   = (data) => API.post("/coupons", data);
export const apiDeleteCoupon   = (id)   => API.delete(`/coupons/${id}`);

// ── Admin ─────────────────────────────────────────────────────────────────────
export const apiAdminStats      = ()          => API.get("/admin/stats");
export const apiAdminUsers      = ()          => API.get("/admin/users");
export const apiAdminCreateUser = (data)      => API.post("/admin/users", data);
export const apiAdminToggleUser = (id)        => API.put(`/admin/users/${id}/toggle`);
export const apiAdminChangeRole = (id, role)  => API.put(`/admin/users/${id}/role`, { role });
export const apiAdminDeleteUser = (id)        => API.delete(`/admin/users/${id}`);

// ── Inventory ─────────────────────────────────────────────────────────────────
export const apiAdminInventory   = ()         => API.get("/admin/inventory");
export const apiAdminStockUpdate = (id, data) => API.patch(`/admin/inventory/${id}`, data);

// ── Site Config (saved permanently in MongoDB) ────────────────────────────────
export const apiGetConfig    = (key)         => API.get(`/config/${key}`);
export const apiSaveConfig   = (key, value)  => API.put(`/config/${key}`, { value });

// ── Logs (admin audit) ────────────────────────────────────────────────────────
export const apiGetLogs      = (params) => API.get("/logs",           { params });
export const apiGetLogStats  = ()       => API.get("/logs/stats");
export const apiClearLogs    = ()       => API.delete("/logs");

// ── Email Diagnostics ─────────────────────────────────────────────────────────
export const apiEmailCheck = ()     => API.get("/admin/email/check");
export const apiEmailTest  = (to)   => API.post("/admin/email/test", { to });

// ── DB Info ──────────────────────────────────────────────────────────────────
export const apiGetDbInfo = () => API.get("/db-info");
