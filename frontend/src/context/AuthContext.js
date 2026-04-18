import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiLogin, apiRegister, apiGetMe } from "../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("bv_token");
    if (token) {
      apiGetMe()
        .then(res => setUser(res.data.user))
        .catch(() => localStorage.removeItem("bv_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (identifier, password) => {
    const isPhone = /^[6-9]\d{9}$/.test((identifier || "").replace(/\s+/g, ""));
    const payload = isPhone
      ? { phone: identifier.replace(/\s+/g, ""), password }
      : { email: identifier.trim().toLowerCase(), password };
    const res = await apiLogin(payload);
    localStorage.setItem("bv_token", res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (name, email, password, phone) => {
    const res = await apiRegister({ name, email: email || undefined, phone: phone || undefined, password });
    localStorage.setItem("bv_token", res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = useCallback(() => {
    localStorage.removeItem("bv_token");
    setUser(null);
  }, []);

  const updateUser = (updated) => setUser(prev => ({ ...prev, ...updated }));

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
