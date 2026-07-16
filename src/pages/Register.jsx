import { Psychology as BrainIcon } from '@mui/icons-material';
import RegisterForm from '../features/auth/RegisterForm';
import { Box, Typography } from '@mui/material';

export default function Register() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2, position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: '10%', right: '-5%', width: '35%', height: '35%', bgcolor: 'rgba(79, 70, 229, 0.2)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: '-5%', left: '-5%', width: '35%', height: '35%', bgcolor: 'rgba(147, 51, 234, 0.2)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none' }} />
      
      <Box sx={{ width: '100%', maxWidth: '28rem', py: 4, position: 'relative', zIndex: 10, animation: 'slideUp 0.5s ease-out' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 4, background: 'linear-gradient(to bottom right, #6366f1, #9333ea)', mb: 2, boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}>
            <BrainIcon sx={{ width: 32, height: 32, color: 'white' }} />
          </Box>
          <Typography variant="h4" component="h1" fontWeight="bold" color="text.primary" sx={{ mb: 1 }}>Create Account</Typography>
          <Typography variant="body1" color="text.secondary">Join EmotionSense to analyze facial emotions</Typography>
        </Box>
        <Box sx={{ bgcolor: 'background.paper', backdropFilter: 'blur(16px)', borderRadius: 6, p: 4, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <RegisterForm />
        </Box>
      </Box>
    </Box>
  );
}
