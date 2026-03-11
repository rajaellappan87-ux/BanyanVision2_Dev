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

  const login = async (email, password) => {
    const res = await apiLogin({ email, password });
    localStorage.setItem("bv_token", res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (name, email, password) => {
    const res = await apiRegister({ name, email, password });
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
