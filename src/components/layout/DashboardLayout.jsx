import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles = { '/dashboard': 'Dashboard', '/upload': 'Upload Media', '/history': 'Upload History', '/profile': 'Profile' };

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const getTitle = () => {
    if (location.pathname.startsWith('/analysis/')) return 'Analysis';
    return pageTitles[location.pathname] || 'EmotionSense';
  };

  return (
    <div className="flex h-screen bg-dark-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={getTitle()} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 bg-dark-950/50">
          <div className="max-w-7xl mx-auto animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
