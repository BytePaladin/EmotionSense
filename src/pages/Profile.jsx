import ProfileForm from '../features/profile/ProfileForm';
import { Box, Typography, Card } from '@mui/material';
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { user } = useAuth();
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, animation: 'fadeIn 0.5s ease-in-out' }}>
      <Box>
        <Typography variant="h5" component="h2" fontWeight="bold" color="text.primary">Profile Settings</Typography>
        <Typography variant="body2" color="text.secondary">Manage your account and preferences.</Typography>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 2fr' }, gap: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Card sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 3, bgcolor: 'background.paper' }}>
            <Box sx={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(to bottom right, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.25rem', fontWeight: 'bold', color: 'white', mb: 2, boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.2)' }}>
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </Box>
            <Typography variant="h6" fontWeight="bold" color="text.primary">{user?.full_name}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{user?.email}</Typography>
            <Box sx={{ width: '100%', bgcolor: 'action.hover', borderRadius: 3, p: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Member Since</Typography>
              <Typography variant="body2" fontWeight="medium" color="text.primary">{new Date(user?.created_at).toLocaleDateString()}</Typography>
            </Box>
          </Card>
        </Box>
        <Box>
          <Card sx={{ bgcolor: 'background.paper', p: 3 }}>
            <ProfileForm />
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
