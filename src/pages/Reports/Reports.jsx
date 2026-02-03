import React, { useState, useEffect } from 'react';
import { Download, Calendar, Users, FileText, DollarSign, TrendingUp, AlertCircle, Filter, BarChart3 } from 'lucide-react';
import { clientsService, contractsService, installmentsService, transactionsService } from '../../firebase/services/firebaseServices/FirebaseServices';

const Reports = () => {
  const [clients, setClients] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('overview');
  const [filters, setFilters] = useState({
    period: 'month',
    clientId: 'all',
    status: 'all',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientsData, contractsData, transactionsData, installmentsData] = await Promise.all([
        clientsService.getAll(),
        contractsService.getAll(),
        transactionsService.getAll(),
        installmentsService.getAll()
      ]);
      setClients(clientsData);
      setContracts(contractsData);
      setTransactions(transactionsData);
      setInstallments(installmentsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados');
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

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const exportToPDF = () => {
    alert('Função de exportação para PDF será implementada em breve!');
  };

  const exportToCSV = () => {
    alert('Função de exportação para CSV será implementada em breve!');
  };

  // Cálculos gerais
  const totalReceived = contracts.reduce((sum, c) => sum + (c.paid || 0), 0);
  const totalReceivable = contracts.reduce((sum, c) => sum + (c.pending || 0), 0);
  const totalContracts = contracts.length;
  const activeContracts = contracts.filter(c => c.status === 'ativo').length;
  const completedContracts = contracts.filter(c => c.status === 'concluido').length;
  const overdueInstallments = installments.filter(i => {
    const dueDate = new Date(i.dueDate);
    return i.status === 'pendente' && dueDate < new Date();
  }).length;

  // Relatório por cliente
  const clientsReport = clients.map(client => {
    const clientContracts = contracts.filter(c => c.clientId === client.id);
    const totalValue = clientContracts.reduce((sum, c) => sum + c.value, 0);
    const totalPaid = clientContracts.reduce((sum, c) => sum + (c.paid || 0), 0);
    const totalPending = clientContracts.reduce((sum, c) => sum + (c.pending || 0), 0);
    
    return {
      ...client,
      contractsCount: clientContracts.length,
      totalValue,
      totalPaid,
      totalPending,
      paymentRate: totalValue > 0 ? (totalPaid / totalValue) * 100 : 0
    };
  }).sort((a, b) => b.totalValue - a.totalValue);

  // Relatório de inadimplência
  const defaultReport = installments.filter(i => {
    const dueDate = new Date(i.dueDate);
    return i.status === 'pendente' && dueDate < new Date();
  }).map(inst => {
    const contract = contracts.find(c => c.id === inst.contractId);
    const daysLate = Math.floor((new Date() - new Date(inst.dueDate)) / (1000 * 60 * 60 * 24));
    
    return {
      ...inst,
      contract,
      daysLate
    };
  }).sort((a, b) => b.daysLate - a.daysLate);

  // Receitas por mês
  const monthlyRevenue = transactions
    .filter(t => t.type === 'entrada')
    .reduce((acc, t) => {
      const month = new Date(t.date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
      acc[month] = (acc[month] || 0) + t.value;
      return acc;
    }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-dark-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Relatórios</h1>
        <div className="flex gap-2">
          <button 
            onClick={exportToCSV}
            className="px-4 py-2 border border-surface-medium text-gray-200 rounded-lg hover:bg-surface-dark transition flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Exportar CSV
          </button>
          <button 
            onClick={exportToPDF}
            className="px-4 py-2 bg-dark-600 text-white rounded-lg hover:bg-dark-700 transition flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Seletor de Tipo de Relatório */}
      <div className="bg-background-tertiary rounded-lg shadow p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setReportType('overview')}
            className={`p-4 rounded-lg border-2 transition ${
              reportType === 'overview' 
                ? 'border-dark-500 bg-dark-500/10' 
                : 'border-surface-medium hover:border-surface-light'
            }`}
          >
            <BarChart3 className="w-6 h-6 mx-auto mb-2 text-dark-600" />
            <span className="text-sm font-medium">Visão Geral</span>
          </button>

          <button
            onClick={() => setReportType('clients')}
            className={`p-4 rounded-lg border-2 transition ${
              reportType === 'clients' 
                ? 'border-dark-500 bg-dark-500/10' 
                : 'border-surface-medium hover:border-surface-light'
            }`}
          >
            <Users className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <span className="text-sm font-medium">Por Cliente</span>
          </button>

          <button
            onClick={() => setReportType('contracts')}
            className={`p-4 rounded-lg border-2 transition ${
              reportType === 'contracts' 
                ? 'border-dark-500 bg-dark-500/10' 
                : 'border-surface-medium hover:border-surface-light'
            }`}
          >
            <FileText className="w-6 h-6 mx-auto mb-2 text-green-300" />
            <span className="text-sm font-medium">Por Contrato</span>
          </button>

          <button
            onClick={() => setReportType('default')}
            className={`p-4 rounded-lg border-2 transition ${
              reportType === 'default' 
                ? 'border-dark-500 bg-dark-500/10' 
                : 'border-surface-medium hover:border-surface-light'
            }`}
          >
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-300" />
            <span className="text-sm font-medium">Inadimplência</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-background-tertiary rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-white">Filtros</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Período</label>
            <select
              name="period"
              value={filters.period}
              onChange={handleFilterChange}
              className="bg-surface-light w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent"
            >
              <option value="week">Esta semana</option>
              <option value="month">Este mês</option>
              <option value="quarter">Este trimestre</option>
              <option value="year">Este ano</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Cliente</label>
            <select
              name="clientId"
              value={filters.clientId}
              onChange={handleFilterChange}
              className="bg-surface-light w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent"
            >
              <option value="all">Todos os clientes</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="bg-surface-light w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="ativo">Ativo</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">&nbsp;</label>
            <button className="w-full px-4 py-2 bg-dark-600 text-white rounded-lg hover:bg-dark-700 transition">
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo do Relatório */}
      {reportType === 'overview' && (
        <div className="space-y-6">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-background-tertiary rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-green-250 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-300" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Recebido</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalReceived)}</p>
            </div>

            <div className="bg-background-tertiary rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-dark-100 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-dark-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">A Receber</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalReceivable)}</p>
            </div>

            <div className="bg-background-tertiary rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Total de Contratos</p>
              <p className="text-2xl font-bold text-white">{totalContracts}</p>
            </div>

            <div className="bg-background-tertiary rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-red-250 p-3 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-300" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Parcelas Vencidas</p>
              <p className="text-2xl font-bold text-white">{overdueInstallments}</p>
            </div>
          </div>

          {/* Status dos Contratos */}
          <div className="bg-background-tertiary rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Status dos Contratos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-green-250 flex items-center justify-center">
                  <span className="text-3xl font-bold text-green-300">{activeContracts}</span>
                </div>
                <p className="text-sm font-medium text-white">Contratos Ativos</p>
                <p className="text-xs text-gray-200 mt-1">
                  {totalContracts > 0 ? Math.round((activeContracts / totalContracts) * 100) : 0}% do total
                </p>
              </div>

              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-dark-100 flex items-center justify-center">
                  <span className="text-3xl font-bold text-dark-600">{completedContracts}</span>
                </div>
                <p className="text-sm font-medium text-white">Contratos Concluídos</p>
                <p className="text-xs text-gray-200 mt-1">
                  {totalContracts > 0 ? Math.round((completedContracts / totalContracts) * 100) : 0}% do total
                </p>
              </div>

              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-surface-medium flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-600">
                    {totalContracts - activeContracts - completedContracts}
                  </span>
                </div>
                <p className="text-sm font-medium text-white">Outros</p>
                <p className="text-xs text-gray-200 mt-1">Cancelados ou inativos</p>
              </div>
            </div>
          </div>

          {/* Receitas Mensais */}
          <div className="bg-background-tertiary rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Receitas Mensais</h3>
            <div className="space-y-3">
              {Object.entries(monthlyRevenue).slice(0, 6).map(([month, value]) => (
                <div key={month} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{month}</span>
                  <div className="flex items-center gap-3 flex-1 mx-4">
                    <div className="flex-1 bg-surface-dark rounded-full h-2">
                      <div 
                        className="bg-green-250 h-2 rounded-full"
                        style={{ 
                          width: `${Math.min((value / Math.max(...Object.values(monthlyRevenue))) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-white">{formatCurrency(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {reportType === 'clients' && (
        <div className="bg-background-tertiary rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-white">Relatório por Cliente</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-dark">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Contratos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Valor Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Pago</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Pendente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Taxa de Pagamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-dark">
                {clientsReport.map(client => (
                  <tr key={client.id} className="hover:bg-surface-dark">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-dark-600 to-dark-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white">{client.name}</p>
                          <p className="text-sm text-gray-200">{client.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white">{client.contractsCount}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-white">
                      {formatCurrency(client.totalValue)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-300">
                      {formatCurrency(client.totalPaid)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-orange-600">
                      {formatCurrency(client.totalPending)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-surface-dark rounded-full h-2 max-w-[100px]">
                          <div 
                            className="bg-green-250 h-2 rounded-full"
                            style={{ width: `${client.paymentRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-white">
                          {Math.round(client.paymentRate)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'contracts' && (
        <div className="bg-background-tertiary rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-white">Relatório por Contrato</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-dark">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Pago</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Progresso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-dark">
                {contracts.map(contract => (
                  <tr key={contract.id} className="hover:bg-surface-dark">
                    <td className="px-6 py-4 text-sm font-medium text-white">{contract.clientName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{contract.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{contract.type}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-white">
                      {formatCurrency(contract.value)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-300">
                      {formatCurrency(contract.paid || 0)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        contract.status === 'ativo' ? 'bg-green-250 text-green-200' :
                        contract.status === 'concluido' ? 'bg-dark-100 text-dark-800' :
                        'bg-surface-medium text-gray-800'
                      }`}>
                        {contract.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-surface-dark rounded-full h-2 max-w-[100px]">
                          <div 
                            className="bg-green-250 h-2 rounded-full"
                            style={{ width: `${((contract.paid || 0) / contract.value) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-white">
                          {Math.round(((contract.paid || 0) / contract.value) * 100)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'default' && (
        <div className="bg-background-tertiary rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Relatório de Inadimplência</h3>
              <span className="px-4 py-2 bg-red-250 text-red-400 text-sm font-medium rounded-full">
                {defaultReport.length} parcelas vencidas
              </span>
            </div>
          </div>
          {defaultReport.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">Nenhuma inadimplência!</p>
              <p className="text-gray-200 text-sm">Todos os pagamentos estão em dia</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-dark">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Contrato</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Parcela</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Vencimento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase">Dias em Atraso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-dark">
                  {defaultReport.map(item => (
                    <tr key={item.id} className="hover:bg-surface-dark">
                      <td className="px-6 py-4 text-sm font-medium text-white">
                        {item.contract?.clientName || 'Cliente'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.contract?.description || 'Contrato'}
                      </td>
                      <td className="px-6 py-4 text-sm text-white">Parcela {item.number}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-white">
                        {formatCurrency(item.value)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(item.dueDate)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          item.daysLate > 30 ? 'bg-red-250 text-red-400' :
                          item.daysLate > 15 ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-250 text-yellow-200'
                        }`}>
                          {item.daysLate} dias
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;