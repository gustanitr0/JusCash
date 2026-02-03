import React, { useState, useEffect } from 'react';
import { DollarSign, CreditCard, FileText, AlertCircle, TrendingUp, TrendingDown, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/auth';
import { contractsService, installmentsService, transactionsService } from '../../firebase/services/firebaseServices/FirebaseServices';

const Dashboard = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [contractsData, installmentsData, transactionsData] = await Promise.all([
        contractsService.getAll(),
        installmentsService.getAll(),
        transactionsService.getAll()
      ]);

      setContracts(contractsData);
      setInstallments(installmentsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // Cálculos
  const stats = {
    totalReceived: contracts.reduce((sum, c) => sum + (c.paid || 0), 0),
    totalReceivable: contracts.reduce((sum, c) => sum + (c.pending || 0), 0),
    activeContracts: contracts.filter(c => c.status === 'ativo').length,
    overdueInstallments: installments.filter(i => {
      const dueDate = new Date(i.dueDate);
      return i.status === 'pendente' && dueDate < new Date();
    }).length,
    balance: transactions.reduce((sum, t) => {
      return t.type === 'entrada' ? sum + t.value : sum - t.value;
    }, 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-dark-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Bem-vindo, {user?.name}!</h1>
          <p className="text-gray-300 mt-1">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-background-tertiary rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-500 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-sm text-gray-300 mb-1">Total Recebido</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalReceived)}</p>
        </div>

        <div className="bg-background-tertiary rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-dark-500 p-3 rounded-lg">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-dark-400" />
          </div>
          <p className="text-sm text-gray-300 mb-1">A Receber</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalReceivable)}</p>
        </div>

        <div className="bg-background-tertiary rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-300 mb-1">Empréstimos Ativos</p>
          <p className="text-2xl font-bold text-white">{stats.activeContracts}</p>
        </div>

        <div className="bg-background-tertiary rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-500 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-gray-300 mb-1">Parcelas Vencidas</p>
          <p className="text-2xl font-bold text-white">{stats.overdueInstallments}</p>
        </div>
      </div>

      {/* Próximos Vencimentos e Fluxo de Caixa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-background-tertiary rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-white">Próximos Vencimentos</h2>
          </div>
          <div className="p-6">
            {installments.filter(i => i.status === 'pendente').slice(0, 5).length > 0 ? (
              <div className="space-y-4">
                {installments.filter(i => i.status === 'pendente').slice(0, 5).map(inst => {
                  const contract = contracts.find(c => c.id === inst.contractId);
                  return (
                    <div key={inst.id} className="flex items-center justify-between p-4 bg-surface-dark rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-white">{contract?.clientName || 'Cliente'}</p>
                        <p className="text-sm text-gray-300">{contract?.description || 'Contrato'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">{formatCurrency(inst.value)}</p>
                        <p className="text-sm text-gray-300">{formatDate(inst.dueDate)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Nenhum vencimento próximo</p>
            )}
          </div>
        </div>

        <div className="bg-background-tertiary rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-white">Fluxo de Caixa</h2>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">Saldo Atual</span>
                <span className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(stats.balance)}
                </span>
              </div>
            </div>
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.slice(0, 5).map(trans => (
                  <div key={trans.id} className="flex items-center justify-between p-3 bg-surface-dark rounded">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded ${trans.type === 'entrada' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {trans.type === 'entrada' ? 
                          <TrendingUp className="w-4 h-4 text-green-400" /> : 
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{trans.description}</p>
                        <p className="text-xs text-gray-500">{formatDate(trans.date)}</p>
                      </div>
                    </div>
                    <span className={`font-semibold ${trans.type === 'entrada' ? 'text-green-400' : 'text-red-400'}`}>
                      {trans.type === 'entrada' ? '+' : '-'}{formatCurrency(trans.value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Nenhuma transação registrada</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;