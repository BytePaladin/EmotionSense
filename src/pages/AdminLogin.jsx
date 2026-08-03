import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
  Link,
  CircularProgress,
  Chip,
  Alert
} from '@mui/material';
import {
  Mail,
  Lock,
  AdminPanelSettings,
  Shield,
  ArrowBack
} from '@mui/icons-material';
import { useAdmin } from '../context/AdminContext';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { adminLogin } = useAdmin();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await adminLogin(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Authentication failed. Verify your administrator credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background ambient glow */}
      <Box
        sx={{
          position: 'absolute',
          top: '-15%',
          left: '-10%',
          width: '45%',
          height: '45%',
          bgcolor: 'rgba(220, 38, 38, 0.15)',
          borderRadius: '50%',
          filter: 'blur(130px)',
          pointerEvents: 'none'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-15%',
          right: '-10%',
          width: '45%',
          height: '45%',
          bgcolor: 'rgba(153, 27, 27, 0.15)',
          borderRadius: '50%',
          filter: 'blur(130px)',
          pointerEvents: 'none'
        }}
      />

      <Box sx={{ width: '100%', maxWidth: '28rem', position: 'relative', zIndex: 10 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 72,
              height: 72,
              borderRadius: 4,
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              mb: 2,
              boxShadow: '0 12px 24px -4px rgba(220, 38, 38, 0.4)'
            }}
          >
            <AdminPanelSettings sx={{ width: 40, height: 40, color: 'white' }} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="h4" component="h1" fontWeight="bold" color="text.primary">
              Admin Portal
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Restricted administrative access & platform management
          </Typography>
        </Box>

        <Box
          sx={{
            bgcolor: 'background.paper',
            backdropFilter: 'blur(16px)',
            borderRadius: 5,
            p: 4,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            border: 1,
            borderColor: 'divider'
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Admin Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. emotionsense@gmail.com"
              required
              fullWidth
              autoComplete="username"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Mail color="action" />
                  </InputAdornment>
                )
              }}
            />

            <TextField
              label="Admin Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              fullWidth
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                )
              }}
            />

            <Button
              type="submit"
              disabled={loading}
              variant="contained"
              fullWidth
              sx={{
                py: 1.5,
                bgcolor: '#dc2626',
                '&:hover': { bgcolor: '#b91c1c' },
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 2.5,
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)'
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Authenticate as Admin'}
            </Button>

            <Box sx={{ pt: 1, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'center' }}>
              <Button
                component={RouterLink}
                to="/login"
                startIcon={<ArrowBack fontSize="small" />}
                size="small"
                sx={{ color: 'text.secondary', textTransform: 'none' }}
              >
                Return to User Login
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
