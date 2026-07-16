import { useState, useEffect } from 'react';
import { Person, Lock, Save } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { validatePassword, getPasswordStrength } from '../../utils/validators';
import { Box, Button, TextField, Typography, InputAdornment, LinearProgress, Divider } from '@mui/material';

export default function ProfileForm() {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({ fullName: '', currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [pwdStrength, setPwdStrength] = useState({ level: 0, label: '', color: '' });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => { if (user) setFormData(prev => ({ ...prev, fullName: user.full_name })); }, [user]);
  useEffect(() => { setPwdStrength(getPasswordStrength(formData.newPassword)); }, [formData.newPassword]);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmNewPassword) return toast.error('New passwords do not match');
      const pwdVal = validatePassword(formData.newPassword);
      if (!pwdVal.isValid) return toast.error(pwdVal.errors[0]);
    }
    
    setLoading(true);
    try {
      await updateProfile({
        full_name: formData.fullName !== user.full_name ? formData.fullName : undefined,
        current_password: formData.currentPassword || undefined,
        new_password: formData.newPassword || undefined
      });
      toast.success('Profile updated successfully');
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmNewPassword: '' }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 'sm', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6" sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>Personal Information</Typography>
        <TextField label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} required fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><Person /></InputAdornment> }} />
        <TextField label="Email Address" type="email" value={user?.email || ''} disabled fullWidth sx={{ opacity: 0.6 }} />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6" sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>Change Password (Optional)</Typography>
        <TextField label="Current Password" type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><Lock /></InputAdornment> }} />
        <Box>
          <TextField label="New Password" type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><Lock /></InputAdornment> }} />
          {formData.newPassword && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ flex: 1 }}>
                <LinearProgress variant="determinate" value={(pwdStrength.level / 5) * 100} sx={{ height: 6, borderRadius: 3, backgroundColor: 'grey.800', '& .MuiLinearProgress-bar': { backgroundColor: pwdStrength.color } }} />
              </Box>
              <Typography variant="caption" sx={{ color: pwdStrength.color }}>{pwdStrength.label}</Typography>
            </Box>
          )}
        </Box>
        <TextField label="Confirm New Password" type="password" name="confirmNewPassword" value={formData.confirmNewPassword} onChange={handleChange} fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><Lock /></InputAdornment> }} />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="submit" disabled={loading} variant="contained" startIcon={<Save />} sx={{ py: 1.5, px: 3 }}>
          Save Changes
        </Button>
      </Box>
    </Box>
  );
}
