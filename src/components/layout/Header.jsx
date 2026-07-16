import { useContext } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box, Avatar, useTheme } from '@mui/material';
import { Menu as MenuIcon, DarkMode, LightMode, Logout } from '@mui/icons-material';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';

export default function Header({ title, onMenuClick }) {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const { user, logout } = useAuth();
  const theme = useTheme();

  return (
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
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2, display: { lg: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" fontWeight="600">
            {title}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={toggleTheme} color="inherit">
            {isDark ? <LightMode /> : <DarkMode />}
          </IconButton>
          
          <Avatar 
            sx={{ 
              width: 35, 
              height: 35, 
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              fontSize: '0.875rem',
              fontWeight: 'bold'
            }}
          >
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
          
          <IconButton 
            onClick={logout} 
            color="error" 
            title="Logout"
            sx={{ '&:hover': { bgcolor: 'error.main', color: 'white' } }}
          >
            <Logout />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
