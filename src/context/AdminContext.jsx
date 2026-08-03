import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export const AdminContext = createContext(null);

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    try {
      const saved = localStorage.getItem('emotionsense_admin');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [adminLoading, setAdminLoading] = useState(true);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return !!localStorage.getItem('emotionsense_admin_token');
  });

  const checkAdminSession = useCallback(async () => {
    const token = localStorage.getItem('emotionsense_admin_token');
    if (!token) {
      setAdmin(null);
      setIsAdminAuthenticated(false);
      setAdminLoading(false);
      return;
    }

    try {
      await api.get('/admin/stats');
      setIsAdminAuthenticated(true);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('emotionsense_admin_token');
        localStorage.removeItem('emotionsense_admin');
        setAdmin(null);
        setIsAdminAuthenticated(false);
      }
    } finally {
      setAdminLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAdminSession();
  }, [checkAdminSession]);

  const adminLogin = async (email, password) => {
    try {
      const res = await api.post('/admin/login', { email, password });
      const { token, admin: adminData } = res.data.data;
      localStorage.setItem('emotionsense_admin_token', token);
      localStorage.setItem('emotionsense_admin', JSON.stringify(adminData));
      setAdmin(adminData);
      setIsAdminAuthenticated(true);
      toast.success('Admin authentication verified');
      return res.data;
    } catch (error) {
      const msg = error.response?.data?.detail || error.response?.data?.message || 'Admin login failed';
      toast.error(msg);
      throw error;
    }
  };

  const adminLogout = () => {
    localStorage.removeItem('emotionsense_admin_token');
    localStorage.removeItem('emotionsense_admin');
    setAdmin(null);
    setIsAdminAuthenticated(false);
    toast.success('Admin logged out');
  };

  return (
    <AdminContext.Provider
      value={{
        admin,
        adminLoading,
        isAdminAuthenticated,
        adminLogin,
        adminLogout,
        refreshAdmin: checkAdminSession
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
