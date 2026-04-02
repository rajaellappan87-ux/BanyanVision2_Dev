import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiLogin, apiRegister, apiGetMe } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on app start
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('bv_token');
        if (token) {
          const res = await apiGetMe();
          setUser(res.data.user);
        }
      } catch {
        await SecureStore.deleteItemAsync('bv_token');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await apiLogin({ email, password });
    await SecureStore.setItemAsync('bv_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await apiRegister({ name, email, password });
    await SecureStore.setItemAsync('bv_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync('bv_token');
    setUser(null);
  }, []);

  const updateUser = useCallback((updated) => {
    setUser(u => ({ ...u, ...updated }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
