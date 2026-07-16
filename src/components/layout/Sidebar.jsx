import { NavLink, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  CloudUpload as UploadIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Psychology as BrainIcon
} from '@mui/icons-material';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { to: '/upload', label: 'Upload', icon: UploadIcon },
  { to: '/history', label: 'History', icon: HistoryIcon },
  { to: '/profile', label: 'Profile', icon: PersonIcon }
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const theme = useTheme();
  const isLgUp = useMediaQuery(theme.breakpoints.up('lg'));

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}
          >
            <BrainIcon />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">EmotionSense</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>AI Analytics</Typography>
          </Box>
        </Box>
        {!isLgUp && (
          <IconButton onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <List sx={{ px: 2, py: 3, flex: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
          return (
            <ListItem key={item.to} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component={NavLink}
                to={item.to}
                onClick={() => !isLgUp && onClose()}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  ...(isActive && {
                    bgcolor: (theme) => `${theme.palette.primary.main}20`,
                    borderLeft: 4,
                    borderColor: 'primary.main',
                  }),
                  '&.Mui-selected': {
                    bgcolor: (theme) => `${theme.palette.primary.main}20`,
                  },
                  '&.Mui-selected:hover': {
                    bgcolor: (theme) => `${theme.palette.primary.main}30`,
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: isActive ? 'primary.main' : 'inherit' }}>
                  <item.icon />
                </ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{ 
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'primary.main' : 'inherit'
                  }} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">EmotionSense v1.0</Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={isLgUp ? 'permanent' : 'temporary'}
      open={isOpen}
      onClose={onClose}
      sx={{
        width: 280,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          borderRight: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
