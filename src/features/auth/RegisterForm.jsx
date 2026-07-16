import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Mail, Lock, Person } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { validatePassword, getPasswordStrength } from '../../utils/validators';
import { Box, Button, TextField, Typography, InputAdornment, Link, LinearProgress } from '@mui/material';

export default function RegisterForm() {
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [pwdStrength, setPwdStrength] = useState({ level: 0, label: '', color: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => { setPwdStrength(getPasswordStrength(formData.password)); }, [formData.password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match');
    const pwdVal = validatePassword(formData.password);
    if (!pwdVal.isValid) return toast.error(pwdVal.errors[0]);

    setLoading(true);
    try {
      await register(formData.fullName, formData.email, formData.password, formData.confirmPassword);
      toast.success('Registration successful. Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <TextField label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="John Doe" required fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><Person /></InputAdornment> }} />
      <TextField label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" required fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><Mail /></InputAdornment> }} />
      <Box>
        <TextField label="Password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create a strong password" required fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><Lock /></InputAdornment> }} />
        {formData.password && (
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ flex: 1 }}>
              <LinearProgress variant="determinate" value={(pwdStrength.level / 5) * 100} sx={{ height: 6, borderRadius: 3, backgroundColor: 'grey.800', '& .MuiLinearProgress-bar': { backgroundColor: pwdStrength.color } }} />
            </Box>
            <Typography variant="caption" sx={{ color: pwdStrength.color }}>{pwdStrength.label}</Typography>
          </Box>
        )}
        <Box sx={{ mt: 1, pl: 1 }}>
          <Typography variant="caption" color="text.secondary">Password must contain:</Typography>
          <Box component="ul" sx={{ pl: 2, m: 0, '& li': { fontSize: '0.75rem' } }}>
            <Box component="li" sx={{ color: formData.password.length >= 8 ? 'success.main' : 'text.secondary' }}>At least 8 characters</Box>
            <Box component="li" sx={{ color: /[A-Z]/.test(formData.password) ? 'success.main' : 'text.secondary' }}>One uppercase letter</Box>
            <Box component="li" sx={{ color: /[a-z]/.test(formData.password) ? 'success.main' : 'text.secondary' }}>One lowercase letter</Box>
            <Box component="li" sx={{ color: /[0-9]/.test(formData.password) ? 'success.main' : 'text.secondary' }}>One digit</Box>
            <Box component="li" sx={{ color: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'success.main' : 'text.secondary' }}>One special character</Box>
          </Box>
        </Box>
      </Box>
      <TextField label="Confirm Password" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm your password" required fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><Lock /></InputAdornment> }} />
      <Button type="submit" disabled={loading} variant="contained" fullWidth sx={{ mt: 1, py: 1.5 }}>Create Account</Button>
      <Typography align="center" variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
        Already have an account? <Link component={RouterLink} to="/login" sx={{ fontWeight: 'medium' }}>Sign in</Link>
      </Typography>
    </Box>
  );
}
