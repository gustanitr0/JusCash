import React, { useState } from 'react';
import Clients from '../Clients/Clients';
import Contracts from '../Contracts/Contracts';
import Financial from '../Financial/Financial';
import Reports from '../Reports/Reports';
import Navbar from '../../components/Navbar/Navbar';
import Sidebar from '../../components/Sidebar/Sidebar';
import Dashboard from '../Dashboard/Dashboard';

const MainApp = () => {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'clients':
        return <Clients />;
      case 'contracts':
        return <Contracts />;
      case 'financial':
        return <Financial />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background-primary">
      <Navbar />
      <div className="flex">
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-h-screen">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default MainApp;