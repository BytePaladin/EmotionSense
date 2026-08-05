import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './hooks/useAuth';
import { PageLoader } from './components/ui/LoadingSpinner';

import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import History from './pages/History';
import Analysis from './pages/Analysis';
import Profile from './pages/Profile';
import LiveCamera from './pages/LiveCamera';
import Compare from './pages/Compare';

import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminLayout from './components/layout/AdminLayout';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;
  return isAuthenticated ? <DashboardLayout>{children}</DashboardLayout> : <Navigate to="/login" replace />;
};

const AuthRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

const AdminProtectedRoute = ({ children }) => {
  const { isAdminAuthenticated, adminLoading } = useAdmin();
  if (adminLoading) return <PageLoader />;
  return isAdminAuthenticated ? <AdminLayout>{children}</AdminLayout> : <Navigate to="/admin/login" replace />;
};

const AdminAuthRoute = ({ children }) => {
  const { isAdminAuthenticated, adminLoading } = useAdmin();
  if (adminLoading) return <PageLoader />;
  return isAdminAuthenticated ? <Navigate to="/admin/dashboard" replace /> : children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminProvider>
          <Router>
            <Routes>
              {/* User Routes */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
              <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
              
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/live" element={<ProtectedRoute><LiveCamera /></ProtectedRoute>} />
              <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
              <Route path="/compare" element={<ProtectedRoute><Compare /></ProtectedRoute>} />
              <Route path="/analysis/:id" element={<ProtectedRoute><Analysis /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/login" element={<AdminAuthRoute><AdminLogin /></AdminAuthRoute>} />
              <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
              
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
          <Toaster position="top-right" />
        </AdminProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
