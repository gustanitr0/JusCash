import React, { useState, useEffect } from 'react';
import { BarChart3, Users, FileText, DollarSign, TrendingUp, X, Menu } from 'lucide-react';

const Sidebar = ({ currentView, setCurrentView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar tamanho da tela
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint do Tailwind
      
      // Fechar menu mobile ao redimensionar para desktop
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fechar menu ao trocar de página (mobile)
  const handleNavigation = (viewId) => {
    setCurrentView(viewId);
    setIsMobileMenuOpen(false);
  };

  // Fechar menu ao clicar fora (mobile)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isMobileMenuOpen && !e.target.closest('.mobile-menu') && !e.target.closest('.hamburger-btn')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Prevenir scroll quando menu mobile está aberto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const menuItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
    { id: 'clients', icon: Users, label: 'Clientes' },
    { id: 'contracts', icon: FileText, label: 'Empréstimos' },
    { id: 'financial', icon: DollarSign, label: 'Financeiro' },
    { id: 'reports', icon: TrendingUp, label: 'Relatórios' }
  ];

  const MenuItem = ({ item, onClick }) => {
    const Icon = item.icon;
    const isActive = currentView === item.id;

    return (
      <button
        onClick={() => onClick(item.id)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
          isActive 
            ? 'bg-gradient-purple text-white shadow-lg glow-purple' 
            : 'text-gray-400 hover:bg-surface-dark hover:text-white'
        }`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="font-medium">{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Botão Hambúrguer (Mobile) */}
      {isMobile && (
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="hamburger-btn fixed top-4 left-4 z-50 lg:hidden p-3 bg-background-tertiary border border-surface-dark rounded-lg shadow-lg text-gray-300 hover:text-white transition"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      )}

      {/* Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Desktop + Menu Mobile */}
      <aside
        className={`
          mobile-menu
          bg-background-secondary border-r border-surface-dark
          
          /* Desktop (lg+) */
          lg:w-64 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
          
          /* Mobile */
          fixed top-0 left-0 h-full w-72 z-50
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:block
        `}
      >
        <div className="p-6 h-full overflow-y-auto">
          {/* Logo (Mobile) */}
          {isMobile && (
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-surface-dark">
              <div className="bg-gradient-purple w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg glow-purple">
                J
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">JusCash</h1>
                <p className="text-xs text-gray-500">Gestão Jurídica</p>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <nav className="space-y-2">
            {menuItems.map(item => (
              <MenuItem 
                key={item.id} 
                item={item} 
                onClick={handleNavigation}
              />
            ))}
          </nav>

          {/* Informações Adicionais (Mobile) */}
          {isMobile && (
            <div className="mt-8 pt-6 border-t border-surface-dark">
              <div className="bg-surface-dark/50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Versão</p>
                <p className="text-sm font-semibold text-gray-300">1.0.0</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;