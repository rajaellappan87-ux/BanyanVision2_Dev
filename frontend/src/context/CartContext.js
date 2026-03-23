import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { useSettings } from "../store/contentStore";

const CartContext = createContext();

// ── localStorage helpers ───────────────────────────────────────────────────────
const CART_KEY   = "bv_cart_v1";
const COUPON_KEY = "bv_coupon_v1";

const loadCart = () => {
  try {
    const s = localStorage.getItem(CART_KEY);
    const parsed = s ? JSON.parse(s) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

const saveCart = (cart) => {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
};

const loadCoupon = () => {
  try {
    const s = localStorage.getItem(COUPON_KEY);
    return s ? JSON.parse(s) : { code: "", info: null };
  } catch { return { code: "", info: null }; }
};

const saveCoupon = (code, info) => {
  try { localStorage.setItem(COUPON_KEY, JSON.stringify({ code, info })); } catch {}
};

const clearCouponStorage = () => {
  try { localStorage.removeItem(COUPON_KEY); } catch {}
};

export const CartProvider = ({ children }) => {
  // ── Initialise from localStorage so cart survives page refresh ──────────────
  const [cart, setCart]             = useState(() => loadCart());
  const [couponCode, setCouponCode] = useState(() => loadCoupon().code);
  const [couponInfo, setCouponInfo] = useState(() => loadCoupon().info);

  // ── Reactive settings ────────────────────────────────────────────────────────
  const st = useSettings();
  const shippingCharge    = st.shippingCharge    !== undefined ? Number(st.shippingCharge)    : 99;
  const freeShippingAbove = st.freeShippingAbove !== undefined ? Number(st.freeShippingAbove) : 2000;

  // ── Persist cart to localStorage whenever it changes ────────────────────────
  useEffect(() => { saveCart(cart); }, [cart]);

  // ── Persist coupon whenever it changes ──────────────────────────────────────
  useEffect(() => { saveCoupon(couponCode, couponInfo); }, [couponCode, couponInfo]);

  // ── Cart operations ──────────────────────────────────────────────────────────
  const addToCart = useCallback((product, qty = 1, size = "", color = "") => {
    setCart(prev => {
      const existing = prev.find(i =>
        i._id === product._id && i.size === size && i.color === color
      );
      if (existing) {
        return prev.map(i =>
          i._id === product._id && i.size === size && i.color === color
            ? { ...i, qty: Math.min(i.qty + qty, product.stock) }
            : i
        );
      }
      return [...prev, { ...product, qty, size, color }];
    });
  }, []);

  const updateCart = useCallback((id, qty, size, color) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i =>
        !(i._id === id && i.size === size && i.color === color)
      ));
    } else {
      setCart(prev => prev.map(i =>
        i._id === id && i.size === size && i.color === color ? { ...i, qty } : i
      ));
    }
  }, []);

  const removeFromCart = useCallback((id, size, color) => {
    setCart(prev => prev.filter(i =>
      !(i._id === id && i.size === size && i.color === color)
    ));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setCouponCode("");
    setCouponInfo(null);
    clearCouponStorage();
    saveCart([]);
  }, []);

  // ── Calculations ─────────────────────────────────────────────────────────────
  const subtotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.price * i.qty, 0),
    [cart]
  );

  const discountAmt = useMemo(() => {
    if (!couponInfo) return 0;
    return couponInfo.type === "percent"
      ? Math.round(subtotal * couponInfo.discount)
      : couponInfo.discount;
  }, [subtotal, couponInfo]);

  const afterDiscount = useMemo(
    () => subtotal - discountAmt,
    [subtotal, discountAmt]
  );

  const shipping = useMemo(() => {
    if (cart.length === 0)                  return 0;
    if (freeShippingAbove === 0)            return 0;
    if (afterDiscount >= freeShippingAbove) return 0;
    return shippingCharge;
  }, [cart.length, afterDiscount, shippingCharge, freeShippingAbove]);

  const total     = afterDiscount + shipping;
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, updateCart, removeFromCart, clearCart,
      subtotal, discountAmt, shipping, total, cartCount,
      couponCode, setCouponCode, couponInfo, setCouponInfo,
      shippingCharge,
      freeShippingAbove,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
