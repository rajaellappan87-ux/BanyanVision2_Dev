import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext(null);

const CART_KEY   = 'bv_mobile_cart_v1';
const COUPON_KEY = 'bv_mobile_coupon_v1';

export const CartProvider = ({ children }) => {
  const [cart,       setCart]       = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponInfo, setCouponInfo] = useState(null);
  const [settings,   setSettings]  = useState({ shippingCharge: 99, freeShippingAbove: 2000 });

  // Load persisted cart on mount
  useEffect(() => {
    (async () => {
      try {
        const [cartStr, couponStr] = await Promise.all([
          AsyncStorage.getItem(CART_KEY),
          AsyncStorage.getItem(COUPON_KEY),
        ]);
        if (cartStr)   setCart(JSON.parse(cartStr));
        if (couponStr) { const c = JSON.parse(couponStr); setCouponCode(c.code||''); setCouponInfo(c.info||null); }
      } catch {}
    })();
  }, []);

  // Persist cart
  useEffect(() => {
    AsyncStorage.setItem(CART_KEY, JSON.stringify(cart)).catch(() => {});
  }, [cart]);

  // Persist coupon
  useEffect(() => {
    AsyncStorage.setItem(COUPON_KEY, JSON.stringify({ code: couponCode, info: couponInfo })).catch(() => {});
  }, [couponCode, couponInfo]);

  const setShippingSettings = useCallback((s) => setSettings(s), []);

  const addToCart = useCallback((product, qty = 1, size = '', color = '') => {
    setCart(prev => {
      const existing = prev.find(i => i._id === product._id && i.size === size && i.color === color);
      if (existing) {
        return prev.map(i =>
          i._id === product._id && i.size === size && i.color === color
            ? { ...i, qty: Math.min(i.qty + qty, product.stock || 999) }
            : i
        );
      }
      return [...prev, { ...product, qty, size, color }];
    });
  }, []);

  const updateCart = useCallback((id, qty, size, color) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => !(i._id === id && i.size === size && i.color === color)));
    } else {
      setCart(prev => prev.map(i =>
        i._id === id && i.size === size && i.color === color ? { ...i, qty } : i
      ));
    }
  }, []);

  const removeFromCart = useCallback((id, size, color) => {
    setCart(prev => prev.filter(i => !(i._id === id && i.size === size && i.color === color)));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setCouponCode('');
    setCouponInfo(null);
    AsyncStorage.multiRemove([CART_KEY, COUPON_KEY]).catch(() => {});
  }, []);

  const subtotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.price * i.qty, 0),
    [cart]
  );

  const discountAmt = useMemo(() => {
    if (!couponInfo) return 0;
    return couponInfo.type === 'percent'
      ? Math.round(subtotal * couponInfo.discount)
      : couponInfo.discount;
  }, [subtotal, couponInfo]);

  const afterDiscount = useMemo(() => subtotal - discountAmt, [subtotal, discountAmt]);

  const shippingCharge    = settings.shippingCharge    !== undefined ? Number(settings.shippingCharge)    : 99;
  const freeShippingAbove = settings.freeShippingAbove !== undefined ? Number(settings.freeShippingAbove) : 2000;

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
      shippingCharge, freeShippingAbove, setShippingSettings,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
