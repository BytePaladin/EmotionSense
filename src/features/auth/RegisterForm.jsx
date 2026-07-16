import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { validatePassword, getPasswordStrength } from '../../utils/validators';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

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
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input label="Full Name" name="fullName" icon={User} value={formData.fullName} onChange={handleChange} placeholder="John Doe" required />
      <Input label="Email Address" type="email" name="email" icon={Mail} value={formData.email} onChange={handleChange} placeholder="john@example.com" required />
      <div>
        <Input label="Password" type="password" name="password" icon={Lock} value={formData.password} onChange={handleChange} placeholder="Create a strong password" required />
        {formData.password && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
              <div className="h-full transition-all duration-300" style={{ width: `${(pwdStrength.level / 5) * 100}%`, backgroundColor: pwdStrength.color }} />
            </div>
            <span className="text-xs" style={{ color: pwdStrength.color }}>{pwdStrength.label}</span>
          </div>
        )}
        <div className="mt-2 text-xs text-dark-400 space-y-1 pl-1">
          <p>Password must contain:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li className={formData.password.length >= 8 ? 'text-green-500' : ''}>At least 8 characters</li>
            <li className={/[A-Z]/.test(formData.password) ? 'text-green-500' : ''}>One uppercase letter</li>
            <li className={/[a-z]/.test(formData.password) ? 'text-green-500' : ''}>One lowercase letter</li>
            <li className={/[0-9]/.test(formData.password) ? 'text-green-500' : ''}>One digit</li>
            <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-green-500' : ''}>One special character</li>
          </ul>
        </div>
      </div>
      <Input label="Confirm Password" type="password" name="confirmPassword" icon={Lock} value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm your password" required />
      <Button type="submit" loading={loading} className="w-full mt-2">Create Account</Button>
      <p className="text-center text-dark-400 text-sm mt-6">
        Already have an account? <Link to="/login" className="text-primary-500 hover:text-primary-400 font-medium">Sign in</Link>
      </p>
    </form>
  );
}
