import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { useSettings } from "../store/contentStore";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart]             = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponInfo, setCouponInfo] = useState(null);

  // ── Reactive settings — re-renders whenever admin saves new values ──────────
  const st = useSettings();
  const shippingCharge    = typeof st.shippingCharge    === "number" ? st.shippingCharge    : 99;
  const freeShippingAbove = typeof st.freeShippingAbove === "number" ? st.freeShippingAbove : 2000;

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
  }, []);

  // ── Calculations — recalculate whenever cart, coupon OR settings change ─────
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

  const afterDiscount = subtotal - discountAmt;

  // Shipping logic — fully driven by admin settings
  const shipping = useMemo(() => {
    if (cart.length === 0)          return 0; // empty cart — no charge
    if (freeShippingAbove === 0)    return 0; // admin set always free
    if (afterDiscount >= freeShippingAbove) return 0; // above threshold — free
    return shippingCharge;                    // below threshold — charge
  }, [cart.length, afterDiscount, shippingCharge, freeShippingAbove]);

  const total     = afterDiscount + shipping;
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, updateCart, removeFromCart, clearCart,
      subtotal, discountAmt, shipping, total, cartCount,
      couponCode, setCouponCode, couponInfo, setCouponInfo,
      // expose raw settings for components that display them
      shippingCharge,
      freeShippingAbove,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
