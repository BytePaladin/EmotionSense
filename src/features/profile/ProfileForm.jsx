import { useState, useEffect } from 'react';
import { User, Lock, Save } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { validatePassword, getPasswordStrength } from '../../utils/validators';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-dark-100 border-b border-dark-700/50 pb-2">Personal Information</h3>
        <Input label="Full Name" name="fullName" icon={User} value={formData.fullName} onChange={handleChange} required />
        <Input label="Email Address" type="email" value={user?.email || ''} disabled className="opacity-60" />
      </div>
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-medium text-dark-100 border-b border-dark-700/50 pb-2">Change Password (Optional)</h3>
        <Input label="Current Password" type="password" name="currentPassword" icon={Lock} value={formData.currentPassword} onChange={handleChange} />
        <div>
          <Input label="New Password" type="password" name="newPassword" icon={Lock} value={formData.newPassword} onChange={handleChange} />
          {formData.newPassword && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                <div className="h-full transition-all duration-300" style={{ width: `${(pwdStrength.level / 5) * 100}%`, backgroundColor: pwdStrength.color }} />
              </div>
              <span className="text-xs" style={{ color: pwdStrength.color }}>{pwdStrength.label}</span>
            </div>
          )}
        </div>
        <Input label="Confirm New Password" type="password" name="confirmNewPassword" icon={Lock} value={formData.confirmNewPassword} onChange={handleChange} />
      </div>
      <div className="pt-4 flex justify-end">
        <Button type="submit" loading={loading}><Save className="w-4 h-4 mr-2" /> Save Changes</Button>
      </div>
    </form>
  );
}
