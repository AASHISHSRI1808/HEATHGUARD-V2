import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // App open hone pe token verify karo — expired/invalid ho to auto logout
  useEffect(() => {
    const token = localStorage.getItem('hg_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('hg_token');
        localStorage.removeItem('hg_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('hg_token', token);
    localStorage.setItem('hg_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    const { token, user } = res.data;
    localStorage.setItem('hg_token', token);
    localStorage.setItem('hg_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const registerDoctor = async (data) => {
    const res = await api.post('/auth/doctor-register', data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('hg_token');
    localStorage.removeItem('hg_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, registerDoctor, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);