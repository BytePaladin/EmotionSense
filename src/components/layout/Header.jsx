import { useContext } from 'react';
import { Menu, LogOut, Moon, Sun } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';

export default function Header({ title, onMenuClick }) {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const { user, logout } = useAuth();

  return (
    <header className="glass border-b border-dark-700/50 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden text-dark-400 hover:text-dark-200"><Menu className="w-5 h-5" /></button>
        <h2 className="text-xl font-semibold text-dark-100">{title}</h2>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={toggleTheme} className="p-2 rounded-xl text-dark-400 hover:text-dark-200 hover:bg-dark-700/50 transition-all">
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
          <span className="text-xs font-bold text-white">{user?.full_name?.charAt(0)?.toUpperCase() || 'U'}</span>
        </div>
        <button onClick={logout} className="p-2 rounded-xl text-dark-400 hover:text-red-400 hover:bg-dark-700/50 transition-all" title="Logout">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
