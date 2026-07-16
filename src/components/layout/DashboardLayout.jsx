import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles = { 
  '/dashboard': 'Dashboard', 
  '/upload': 'Upload Media', 
  '/history': 'Upload History', 
  '/profile': 'Profile' 
};

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  const theme = useTheme();
  const isLgUp = useMediaQuery(theme.breakpoints.up('lg'));

  const getTitle = () => {
    if (location.pathname.startsWith('/analysis/')) return 'Analysis';
    return pageTitles[location.pathname] || 'EmotionSense';
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header title={getTitle()} onMenuClick={() => setSidebarOpen(true)} />
        
        <Box 
          component="main" 
          sx={{ 
            flex: 1, 
            overflowY: 'auto', 
            p: { xs: 2, sm: 3, md: 4 },
            bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#f1f5f9'
          }}
        >
          <Box sx={{ maxWidth: 1200, mx: 'auto', animation: 'fadeIn 0.5s ease-out' }}>
            {children}
          </Box>
        </Box>
      </Box>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Box>
  );
}
