import React, { useState } from 'react';
import { Bell, Settings, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/auth';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    if (window.confirm('Deseja realmente sair?')) {
      await logout();
    }
  };

  return (
    <nav className="bg-background-secondary border-b border-surface-dark px-4 lg:px-6 py-4 shadow-lg sticky top-0 z-30">
      <div className="flex items-center justify-between">
        {/* Logo (visivel apenas em desktop quando sidebar esta visivel) */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="bg-gradient-purple text-dark-100 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg glow-purple">
            J
          </div>
          <div>
            <h1 className="text-xl font-bold text-white-900">JusCash</h1>
            <p className="text-xs text-gray-500">Gestão de Emprestimos Inteligente</p>
          </div>
        </div>
        
        {/* Logo Mobile (centralizado) */}
        <div className='flex lg:hidden items-center gap-3 ml-14'>
          <div className='bg-gradient-purple w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg shadow-lg'>
            J
          </div>
          <h1 className='text-lg font-bold text-white'>JusCash</h1>
        </div>

        {/* Actions do usuario */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-400 hover:text-white hover:bg-surface-dark rounded-lg transition">
            <Bell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-dark-500 rounded-full glow-purple-strong"></span>
          </button>
          
          <button className="hidden sm:block p-2 text-gray-400 hover:text-white hover:bg-surface-dark rounded-lg transition">
            <Settings className="w-6 h-6" />
          </button>

          {/* Usuário */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 lg:gap-3 pl-2 lg:pl-4 border-l border-surface-dark hover:bg-surface-dark rounded-lg transition p-2"
            >
              {/* Nome - oculto em mobile */}
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              
              {/* Avatar */}
              <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-purple rounded-full flex items-center justify-center text-white font-semibold glow-purple text-sm lg:text-base">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-background-tertiary border border-surface-dark rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Nome (visível em mobile) */}
                <div className="sm:hidden p-3 border-b border-surface-dark">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>

                <button
                  onClick={() => {/* Perfil */}}
                  className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-surface-dark transition flex items-center gap-3"
                >
                  <Settings className="w-4 h-4" />
                  Configurações
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 transition flex items-center gap-3 border-t border-surface-dark"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;