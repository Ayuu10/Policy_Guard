import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  UploadCloud, 
  LogOut, 
  Sun, 
  Moon, 
  Menu, 
  X,
  User as UserIcon
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', String(next));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationItems = [
    { name: 'Dashboard', path: '/', icon: BarChart3 },
    { name: 'Document Analysis', path: '/analysis', icon: UploadCloud },
    { name: 'Regulatory Chat', path: '/chat', icon: MessageSquare },
    { name: 'Reports', path: '/reports', icon: ShieldAlert },
    ...(user?.username === 'admin' ? [{ name: 'Admin Console', path: '/admin', icon: BarChart3 }] : []),
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-primary-700 text-white p-4 shadow-md">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-accent-blue" />
          <span className="font-bold text-lg tracking-wide">PolicyGuard AI</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-primary-600 rounded">
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-primary-900 text-slate-100 flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto md:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Title */}
        <div className="p-6 hidden md:flex items-center gap-3 border-b border-primary-800">
          <ShieldAlert className="h-8 w-8 text-accent-blue" />
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wide text-white">PolicyGuard AI</h1>
            <p className="text-xs text-primary-100 font-medium">Compliance Platform</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-700/50 translate-x-1' 
                  : 'text-slate-300 hover:bg-primary-800 hover:text-white hover:translate-x-0.5'}
              `}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User Card & Settings */}
        <div className="p-4 border-t border-primary-800 space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3 px-3 py-2 bg-primary-800/40 rounded-lg">
            <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold shadow">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-white">{user?.username || 'User'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || 'user@policyguard.ai'}</p>
            </div>
          </div>

          <div className="flex items-center justify-between px-2">
            {/* Theme Toggle */}
            <button 
              onClick={toggleDarkMode}
              className="p-2 hover:bg-primary-800 text-slate-300 hover:text-white rounded-lg transition-colors"
              title="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Logout */}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 p-2 hover:bg-primary-800 text-rose-400 hover:text-rose-300 rounded-lg transition-colors font-medium text-sm"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <div className="flex-1 p-6 md:p-8 space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
};
