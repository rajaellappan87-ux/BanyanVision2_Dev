/**
 * BV_Plaza/frontend/plazaApi.js
 * API client functions for BV Plaza
 * Uses the same Axios instance pattern as the main app
 */
import axios from "axios";

const BASE = process.env.REACT_APP_API_URL || "/api";

const getHeaders = () => {
  const token = localStorage.getItem("bv_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const api = (method, url, data, params) =>
  axios({ method, url: `${BASE}/plaza${url}`, data, params, headers: getHeaders() });

// ─── Admin ────────────────────────────────────────────────────────────────────
export const apiPlazaGetSetting       = ()        => api("get",  "/admin/setting");
export const apiPlazaUpdateSetting    = (data)    => api("put",  "/admin/setting", data);
export const apiPlazaAdminGetStalls   = ()        => api("get",  "/admin/stalls");
export const apiPlazaAdminUpdateStall = (id, d)   => api("put",  `/admin/stalls/${id}`, d);
export const apiPlazaAdminWithdrawals = ()        => api("get",  "/admin/withdrawals");
export const apiPlazaAdminProcessWD   = (id, d)   => api("put",  `/admin/withdrawals/${id}`, d);

// ─── Public ───────────────────────────────────────────────────────────────────
export const apiPlazaPublicSetting    = ()        => api("get",  "/setting");
export const apiPlazaGetStalls        = (params)  => api("get",  "/stalls", null, params);
export const apiPlazaGetStall         = (id)      => api("get",  `/stalls/${id}`);
export const apiPlazaGetStallProducts = (id)      => api("get",  `/stalls/${id}/products`);

// ─── Shop Owner ───────────────────────────────────────────────────────────────
export const apiPlazaRegisterShop     = (data)    => api("post", "/shop/register", data);
export const apiPlazaGetMyStall       = ()        => api("get",  "/shop/me");
export const apiPlazaUpdateMyStall    = (data)    => api("put",  "/shop/me", data);
export const apiPlazaHeartbeat        = (online)  => api("post", "/shop/heartbeat", { isOnline: online });
export const apiPlazaSubscribe        = (data)    => api("post", "/shop/subscribe", data);

export const apiPlazaGetMyProducts    = ()        => api("get",  "/shop/products");
export const apiPlazaCreateProduct    = (data)    => api("post", "/shop/products", data);
export const apiPlazaUpdateProduct    = (id, d)   => api("put",  `/shop/products/${id}`, d);
export const apiPlazaDeleteProduct    = (id)      => api("delete",`/shop/products/${id}`);

// Image uploads (multipart/form-data)
const apiUpload = (url, file) => {
  const fd = new FormData();
  fd.append("image", file);
  return axios.post(`${BASE}/plaza${url}`, fd, { headers: { ...getHeaders(), "Content-Type": "multipart/form-data" } });
};
export const apiPlazaUploadProductImage = (file)      => apiUpload("/shop/upload/product-image", file);
export const apiPlazaDeleteProductImage = (public_id) => axios.delete(`${BASE}/plaza/shop/upload/product-image`, { data: { public_id }, headers: getHeaders() });
export const apiPlazaUploadLogo         = (file)      => apiUpload("/shop/upload/logo", file);

export const apiPlazaGetMyCoupons     = ()        => api("get",  "/shop/coupons");
export const apiPlazaCreateCoupon     = (data)    => api("post", "/shop/coupons", data);
export const apiPlazaDeleteCoupon     = (id)      => api("delete",`/shop/coupons/${id}`);

export const apiPlazaValidateCoupon   = (data)    => api("post", "/coupons/validate", data);

export const apiPlazaGetBankDetail    = ()        => api("get",  "/shop/bank");
export const apiPlazaSaveBankDetail   = (data)    => api("post", "/shop/bank", data);

export const apiPlazaGetWallet        = ()        => api("get",  "/shop/wallet");
export const apiPlazaWithdraw         = (amount)  => api("post", "/shop/wallet/withdraw", { amount });

export const apiPlazaGetShopOrders    = ()        => api("get",  "/shop/orders");
export const apiPlazaUpdateOrderStatus= (id, st)  => api("put",  `/shop/orders/${id}/status`, { status: st });

// ─── Buyer ────────────────────────────────────────────────────────────────────
export const apiPlazaCreatePayment    = (total)   => api("post", "/orders/create-payment", { total });
export const apiPlazaPlaceOrder       = (data)    => api("post", "/orders", data);
export const apiPlazaMyOrders         = ()        => api("get",  "/orders/my");

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const apiPlazaGetChat          = (stallId, sessionId) => api("get",  `/chat/${stallId}/${sessionId}`);
export const apiPlazaSendMessage      = (stallId, sessionId, data) => api("post", `/chat/${stallId}/${sessionId}`, data);
