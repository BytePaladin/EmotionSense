import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input label="Email Address" type="email" icon={Mail} value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
      <Input label="Password" type="password" icon={Lock} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
      <Button type="submit" loading={loading} className="w-full">Sign In</Button>
      <p className="text-center text-dark-400 text-sm mt-6">
        Don't have an account? <Link to="/register" className="text-primary-500 hover:text-primary-400 font-medium">Create one</Link>
      </p>
    </form>
  );
}
