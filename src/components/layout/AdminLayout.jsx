import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Button,
  Chip,
  useTheme
} from '@mui/material';
import {
  AdminPanelSettings,
  DarkMode,
  LightMode,
  Logout,
  OpenInNew
} from '@mui/icons-material';
import { ThemeContext } from '../../context/ThemeContext';
import { useAdmin } from '../../context/AdminContext';

export default function AdminLayout({ children }) {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const { admin, adminLogout } = useAdmin();
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          color: 'text.primary'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
              }}
            >
              <AdminPanelSettings />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                  EmotionSense
                </Typography>
                <Chip
                  label="ADMIN PORTAL"
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    bgcolor: 'error.main',
                    color: 'white',
                    height: 20
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Control & Monitoring Center
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              component={NavLink}
              to="/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              variant="outlined"
              endIcon={<OpenInNew sx={{ fontSize: 16 }} />}
              sx={{ display: { xs: 'none', sm: 'inline-flex' }, textTransform: 'none', borderRadius: 2 }}
            >
              User App
            </Button>

            <IconButton onClick={toggleTheme} color="inherit" title="Toggle Theme">
              {isDark ? <LightMode /> : <DarkMode />}
            </IconButton>

            <Chip
              label={admin?.email || 'admin@emotionsense.ai'}
              variant="outlined"
              size="small"
              sx={{ display: { xs: 'none', md: 'inline-flex' }, fontWeight: 500 }}
            />

            <IconButton
              onClick={adminLogout}
              color="error"
              title="Logout Admin"
              sx={{
                borderRadius: 2,
                border: 1,
                borderColor: 'error.light',
                '&:hover': { bgcolor: 'error.main', color: 'white' }
              }}
            >
              <Logout fontSize="small" />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          flex: 1,
          p: { xs: 2, sm: 3, md: 4 },
          bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#f8fafc'
        }}
      >
        <Box sx={{ maxWidth: 1350, mx: 'auto', animation: 'fadeIn 0.4s ease-out' }}>
          {children}
        </Box>
      </Box>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Box>
  );
}
