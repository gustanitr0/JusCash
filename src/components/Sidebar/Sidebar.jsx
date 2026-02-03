import React from 'react';
import { BarChart3, Users, FileText, DollarSign, TrendingUp } from 'lucide-react';

const Sidebar = ({ currentView, setCurrentView }) => {
  const menuItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
    { id: 'clients', icon: Users, label: 'Clientes' },
    { id: 'contracts', icon: FileText, label: 'Empréstimos' },
    { id: 'financial', icon: DollarSign, label: 'Financeiro' },
    { id: 'reports', icon: TrendingUp, label: 'Relatórios' }
  ];

  return (
    <aside className="w-64 bg-background-secondary border-r border-surface-dark min-h-screen sticky top-0">
      <div className="p-6">
        <div className="space-y-2">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive 
                    ? 'bg-gradient-purple text-white font-medium shadow-lg glow-purple' 
                    : 'text-gray-400 hover:bg-surface-dark hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;