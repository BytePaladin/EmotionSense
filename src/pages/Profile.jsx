import ProfileForm from '../features/profile/ProfileForm';
import { Box, Typography, Card } from '@mui/material';
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { user } = useAuth();
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, animation: 'fadeIn 0.5s ease-in-out' }}>
      <Box>
        <Typography variant="h5" component="h2" fontWeight="bold" sx={{ color: '#f8fafc' }}>Profile Settings</Typography>
        <Typography variant="body2" sx={{ color: '#94a3b8' }}>Manage your account and preferences.</Typography>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 2fr' }, gap: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Card sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 3, bgcolor: '#1e293b' }}>
            <Box sx={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(to bottom right, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.25rem', fontWeight: 'bold', color: 'white', mb: 2, boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.2)' }}>
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </Box>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc' }}>{user?.full_name}</Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>{user?.email}</Typography>
            <Box sx={{ width: '100%', bgcolor: 'rgba(30, 41, 59, 0.5)', borderRadius: 3, p: 2, border: '1px solid rgba(51, 65, 85, 0.5)' }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>Member Since</Typography>
              <Typography variant="body2" fontWeight="medium" sx={{ color: '#e2e8f0' }}>{new Date(user?.created_at).toLocaleDateString()}</Typography>
            </Box>
          </Card>
        </Box>
        <Box>
          <Card sx={{ bgcolor: '#1e293b', p: 3 }}>
            <ProfileForm />
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
