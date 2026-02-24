"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "@/lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined); // undefined = not checked yet
  const [loading, setLoading] = useState(true); // initial loading
  const [authActionLoading, setAuthActionLoading] = useState(false);

  useEffect(() => {
    authAPI
      .getMe()
      .then((res) => setUser(res.data || null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    setAuthActionLoading(true);
    try {
      const res = await authAPI.login(credentials);
      setUser(res.data);
      return res.data;
    } finally {
      setAuthActionLoading(false);
    }
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, authActionLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
