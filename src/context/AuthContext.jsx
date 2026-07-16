import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('emotionsense_token');
    if (!token) { setLoading(false); return; }
    try {
      const res = await api.get('/profile');
      setUser(res.data.data);
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem('emotionsense_token');
      localStorage.removeItem('emotionsense_user');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const res = await api.post('/login', { email, password });
    const { token, user: userData } = res.data.data;
    localStorage.setItem('emotionsense_token', token);
    localStorage.setItem('emotionsense_user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    return res.data;
  };

  const register = async (fullName, email, password, confirmPassword) => {
    const res = await api.post('/register', {
      full_name: fullName, email, password, confirm_password: confirmPassword
    });
    return res.data;
  };

  const logout = async () => {
    try { await api.post('/logout'); } catch {}
    localStorage.removeItem('emotionsense_token');
    localStorage.removeItem('emotionsense_user');
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (data) => {
    const res = await api.put('/profile', data);
    setUser(res.data.data);
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, register, logout, updateProfile, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};
