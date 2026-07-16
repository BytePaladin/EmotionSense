import { Psychology as BrainIcon } from '@mui/icons-material';
import LoginForm from '../features/auth/LoginForm';
import { Box, Typography } from '@mui/material';

export default function Login() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#020617', p: 2, position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', bgcolor: 'rgba(79, 70, 229, 0.2)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', bgcolor: 'rgba(147, 51, 234, 0.2)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none' }} />
      
      <Box sx={{ width: '100%', maxWidth: '28rem', position: 'relative', zIndex: 10, animation: 'fadeIn 0.5s ease-in-out' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 4, background: 'linear-gradient(to bottom right, #6366f1, #9333ea)', mb: 2, boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}>
            <BrainIcon sx={{ width: 32, height: 32, color: 'white' }} />
          </Box>
          <Typography variant="h4" component="h1" fontWeight="bold" sx={{ color: '#f8fafc', mb: 1 }}>Welcome Back</Typography>
          <Typography variant="body1" sx={{ color: '#94a3b8' }}>Enter your credentials to access your account</Typography>
        </Box>
        <Box sx={{ bgcolor: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(16px)', borderRadius: 6, p: 4, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <LoginForm />
        </Box>
      </Box>
    </Box>
  );
}
