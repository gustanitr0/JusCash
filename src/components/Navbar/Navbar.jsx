import React from 'react';
import { Bell, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/auth';

const Navbar = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (window.confirm('Deseja realmente sair?')) {
      await logout();
    }
  };

  return (
    <nav className="bg-background-secondary border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-dark-600 to-dark-900 text-dark-100 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl">
            J
          </div>
          <div>
            <h1 className="text-xl font-bold text-white-900">JusCash</h1>
            <p className="text-xs text-gray-500">Gestão de Emprestimos Inteligente</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-400 hover:text-white hover:bg-surface-dark rounded-lg transition">
            <Bell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-dark-500 rounded-full glow-purple-strong"></span>
          </button>
          
          <button className="p-2 text-gray-400 hover:text-white hover:bg-surface-dark rounded-lg transition">
            <Settings className="w-6 h-6" />
          </button>

          <button 
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-surface-dark rounded-lg transition"
            title="Sair"
          >
            <LogOut className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-medium text-white-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-dark-600 to-dark-900 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;