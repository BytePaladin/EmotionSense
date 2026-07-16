import { Brain } from 'lucide-react';
import RegisterForm from '../features/auth/RegisterForm';

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 p-4 relative overflow-hidden">
      <div className="absolute top-[10%] right-[-5%] w-[35%] h-[35%] bg-primary-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[35%] h-[35%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md animate-slide-up relative z-10 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 mb-4 shadow-lg shadow-primary-500/30">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-dark-100 mb-2">Create Account</h1>
          <p className="text-dark-400">Join EmotionSense to analyze facial emotions</p>
        </div>
        <div className="glass rounded-3xl p-8 shadow-2xl">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
