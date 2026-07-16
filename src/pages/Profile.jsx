import ProfileForm from '../features/profile/ProfileForm';
import Card from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-dark-100">Profile Settings</h2>
        <p className="text-dark-400">Manage your account and preferences.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-4xl font-bold text-white mb-4 shadow-lg shadow-primary-500/20">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <h3 className="text-xl font-bold text-dark-100">{user?.full_name}</h3>
            <p className="text-dark-400 text-sm mb-4">{user?.email}</p>
            <div className="w-full bg-dark-800/50 rounded-xl p-4 border border-dark-700/50">
              <p className="text-xs text-dark-400 mb-1">Member Since</p>
              <p className="text-sm text-dark-200 font-medium">{new Date(user?.created_at).toLocaleDateString()}</p>
            </div>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <ProfileForm />
          </Card>
        </div>
      </div>
    </div>
  );
}
