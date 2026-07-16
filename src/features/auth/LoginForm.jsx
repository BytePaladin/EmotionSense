import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Mail, Lock } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Box, Button, TextField, Typography, InputAdornment, Link } from '@mui/material';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <TextField label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><Mail /></InputAdornment> }} />
      <TextField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><Lock /></InputAdornment> }} />
      <Button type="submit" disabled={loading} variant="contained" fullWidth sx={{ py: 1.5 }}>Sign In</Button>
      <Typography align="center" variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
        Don't have an account? <Link component={RouterLink} to="/register" sx={{ fontWeight: 'medium' }}>Create one</Link>
      </Typography>
    </Box>
  );
}
