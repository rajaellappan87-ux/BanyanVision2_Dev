import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiToggleWishlist, apiGetWishlist } from '../api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    if (user) {
      apiGetWishlist()
        .then(r => setWishlist(r.data.wishlist || []))
        .catch(() => {});
    } else {
      setWishlist([]);
    }
  }, [user?._id]);

  const toggle = useCallback(async (productId) => {
    if (!user) return false;
    try {
      const res = await apiToggleWishlist(productId);
      setWishlist(res.data.wishlist || []);
      return res.data.added;
    } catch { return false; }
  }, [user]);

  const isWished = useCallback(
    (id) => wishlist.some(p => (p._id || p) === id),
    [wishlist]
  );

  return (
    <WishlistContext.Provider value={{ wishlist, toggle, isWished }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
