import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FileText,
  DollarSign,
  Calendar,
  TrendingUp,
} from "lucide-react";
import {
  clientsService,
  contractsService,
  installmentsService,
  transactionsService,
} from "../../firebase/services/firebaseServices/FirebaseServices";
import { useAuth } from "../../contexts/auth";
import Modal from "../../components/Modal/Modal";
import LoanSimulator from "../../components/LoanSimulator";

const Contracts = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [formData, setFormData] = useState({
    clientId: "",
    clientName: "",
    description: "",
    value: "", // Valor total
    interestRate: "", // Taxa de juros (%)
    type: "parcelado",
    interestType: "simples", // simples, composto
    installments: "1", // Número de parcelas
    totalInterest: 0, // Juros total (calculado)
    installmentValue: 0, // Valor da parcela (calculado)
    totalReceivable: 0, // Total a receber (calculado)
    lateFeeEnabled: false, // Juros diário por atraso
    lateFeeRate: "", // Taxa de juros diário (%)
    startDate: new Date().toISOString().split("T")[0], // Data do contrato
    firstInstallmentDate: new Date().toISOString().split("T")[0], // Data da primeira parcela
    frequency: "mensal",
    status: "ativo",
  });
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('form');
  const [installments, setInstallments] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedContractForAction, setSelectedContractForAction] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [contractsData, clientsData, installmentsData] = await Promise.all([
        contractsService.getAll(),
        clientsService.getAll(),
        installmentsService.getAll()
      ]);
      setContracts(contractsData);
      setClients(clientsData);
      setInstallments(installmentsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      alert("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (contract = null) => {
    if (contract) {
      setSelectedContract(contract);
      setFormData({
        clientId: contract.clientId,
        clientName: contract.clientName,
        description: contract.description,
        value: contract.value.toString(),
        type: contract.type,
        installments: contract.installments?.toString() || "1",
        frequency: contract.frequency || "mensal",
        startDate: contract.startDate,
        status: contract.status,
      });
    } else {
      setSelectedContract(null);
      setFormData({
        clientId: "",
        clientName: "",
        description: "",
        value: "",
        type: "unico",
        installments: "1",
        frequency: "mensal",
        startDate: new Date().toISOString().split("T")[0],
        status: "ativo",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedContract(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "clientId") {
      const selectedClient = clients.find((c) => c.id === value);
      setFormData((prev) => ({
        ...prev,
        clientId: value,
        clientName: selectedClient?.name || "",
      }));
    } else if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const generateInstallments = async (contractId, contractData) => {
    const numInstallments = parseInt(formData.installments);
    const installmentValue = parseFloat(formData.value) / numInstallments;
    const startDate = new Date(formData.startDate);

    const frequencyDays = {
      diaria: 1,
      semanal: 7,
      quinzenal: 15,
      mensal: 30,
      trimestral: 90,
    };

    const daysToAdd = frequencyDays[formData.frequency] || 30;

    for (let i = 0; i < numInstallments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + daysToAdd * i);

      await installmentsService.add({
        contractId: contractId,
        number: i + 1,
        value: installmentValue,
        dueDate: dueDate.toISOString().split("T")[0],
        status: "pendente",
      });
    }
  };

  // Função para calcular juros simples
  const calculateSimpleInterest = (principal, rate, periods) => {
    return principal * (rate / 100) * periods;
  };

  // Função para calcular juros compostos
  const calculateCompoundInterest = (principal, rate, periods) => {
    return principal * (Math.pow(1 + rate / 100, periods) - 1);
  };

  // Função para calcular todos os valores financeiros
  const calculateFinancialValues = (
    value,
    interestRate,
    installments,
    interestType,
  ) => {
    const principal = parseFloat(value) || 0;
    const rate = parseFloat(interestRate) || 0;
    const periods = parseInt(installments) || 1;

    if (principal === 0 || periods === 0) {
      return {
        totalInterest: 0,
        installmentValue: 0,
        totalReceivable: 0,
      };
    }

    let totalInterest = 0;
    let totalReceivable = 0;
    let installmentValue = 0;

    if (interestType === "simples") {
      // Juros Simples: J = P * i * n
      totalInterest = calculateSimpleInterest(principal, rate, periods);
      totalReceivable = principal + totalInterest;
      installmentValue = totalReceivable / periods;
    } else {
      // Juros Compostos: M = P * (1 + i)^n
      totalReceivable = principal * Math.pow(1 + rate / 100, periods);
      totalInterest = totalReceivable - principal;
      installmentValue = totalReceivable / periods;
    }

    return {
      totalInterest: parseFloat(totalInterest.toFixed(2)),
      installmentValue: parseFloat(installmentValue.toFixed(2)),
      totalReceivable: parseFloat(totalReceivable.toFixed(2)),
    };
  };

  // useEffect para recalcular automaticamente quando os campos mudarem
  useEffect(() => {
    if (formData.value && formData.interestRate && formData.installments) {
      const calculations = calculateFinancialValues(
        formData.value,
        formData.interestRate,
        formData.installments,
        formData.interestType,
      );

      setFormData((prev) => ({
        ...prev,
        totalInterest: calculations.totalInterest,
        installmentValue: calculations.installmentValue,
        totalReceivable: calculations.totalReceivable,
      }));
    }
  }, [
    formData.value,
    formData.interestRate,
    formData.installments,
    formData.interestType,
  ]);

  const generateInstallmentsWithInterest = async (contractId, contractData) => {
    const numInstallments = parseInt(contractData.installments);
    const installmentValue = contractData.installmentValue;
    const startDate = new Date(contractData.firstInstallmentDate);

    const frequencyDays = {
      diaria: 1,
      semanal: 7,
      quinzenal: 15,
      mensal: 30,
      trimestral: 90,
    };

    const daysToAdd = frequencyDays[contractData.frequency] || 30;

    for (let i = 0; i < numInstallments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + daysToAdd * i);

      await installmentsService.add({
        contractId: contractId,
        number: i + 1,
        value: installmentValue,
        dueDate: dueDate.toISOString().split("T")[0],
        status: "pendente",
        lateFeeRate: contractData.lateFeeEnabled ? contractData.lateFeeRate : 0,
        lateFeeEnabled: contractData.lateFeeEnabled,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const value = parseFloat(formData.value);
      const contractData = {
        clientId: formData.clientId,
        clientName: formData.clientName,
        description: formData.description,
        value: value,
        interestRate: parseFloat(formData.interestRate),
        interestType: formData.interestType,
        type: formData.type,
        installments: parseInt(formData.installments),
        frequency: formData.frequency,
        startDate: formData.startDate,
        firstInstallmentDate: formData.firstInstallmentDate,
        status: formData.status,
        // Valores calculados
        totalInterest: formData.totalInterest,
        installmentValue: formData.installmentValue,
        totalReceivable: formData.totalReceivable,
        // Juros por atraso
        lateFeeEnabled: formData.lateFeeEnabled,
        lateFeeRate: formData.lateFeeEnabled
          ? parseFloat(formData.lateFeeRate)
          : 0,
        // Controle de pagamento
        paid: 0,
        pending: formData.totalReceivable,
        createdBy: user.uid,
      };

      if (selectedContract) {
        await contractsService.update(selectedContract.id, contractData);
        alert("Empréstimo atualizado com sucesso!");
      } else {
        const newContract = await contractsService.add(contractData);

        // Gerar parcelas automaticamente com valores corretos
        await generateInstallmentsWithInterest(newContract.id, contractData);

        alert("Empréstimo cadastrado com sucesso!");
      }

      handleCloseModal();
      loadData();
    } catch (error) {
      console.error("Erro ao salvar empréstimo:", error);
      alert("Erro ao salvar empréstimo");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja realmente excluir este empréstimo?")) return;

    try {
      await contractsService.delete(id);
      alert("empréstimo excluído com sucesso!");
      loadData();
    } catch (error) {
      console.error("Erro ao excluir empréstimo:", error);
      alert("Erro ao excluir empréstimo");
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusColor = (status) => {
    const colors = {
      ativo: "bg-green-500 text-green-400",
      concluido: "bg-dark-500 text-dark-400",
      cancelado: "bg-red-500 text-red-400",
    };
    return colors[status] || "bg-surface-medium text-gray-800";
  };

  const getTypeLabel = (type) => {
    const labels = {
      unico: "Pagamento Único",
      parcelado: "Parcelado",
      recorrente: "Recorrente",
    };
    return labels[type] || type;
  };

  // Abrir modal de pagamento
const handleOpenPaymentModal = (contract) => {
  setSelectedContractForAction(contract);
  setPaymentAmount('');
  setShowPaymentModal(true);
};

// Pagar apenas juros
const handlePayInterestOnly = (contract) => {
  setSelectedContractForAction(contract);
  setPaymentAmount(contract.totalInterest?.toString() || '0');
  setShowInterestModal(true);
};

// Ver histórico de pagamentos
const handleViewHistory = (contract) => {
  setSelectedContractForAction(contract);
  setShowHistoryModal(true);
};

// Processar pagamento
const handleProcessPayment = async (e) => {
  e.preventDefault();
  
  if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
    alert('Informe um valor válido');
    return;
  }

  try {
    const amount = parseFloat(paymentAmount);
    const contract = selectedContractForAction;
    
    // Atualizar valores do contrato
    const newPaid = (contract.paid || 0) + amount;
    const newPending = contract.totalReceivable - newPaid;
    
    await contractsService.update(contract.id, {
      ...contract,
      paid: newPaid,
      pending: newPending,
      status: newPending <= 0 ? 'concluido' : contract.status
    });

    // Registrar transação
    await transactionsService.add({
      type: 'entrada',
      description: `Pagamento - ${contract.clientName}`,
      value: amount,
      date: new Date().toISOString().split('T')[0],
      category: 'honorario',
      paymentMethod: 'pix',
      contractId: contract.id,
      createdBy: user.uid
    });

    alert('Pagamento registrado com sucesso!');
    setShowPaymentModal(false);
    setShowInterestModal(false);
    loadData();
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    alert('Erro ao processar pagamento');
  }
};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-dark-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Carregando empréstimos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Empréstimos</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-dark-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-dark-700 transition"
        >
          <Plus className="w-5 h-5" />
          Novo Empréstimo
        </button>
      </div>

      {contracts.length === 0 ? (
        <div className="bg-background-tertiary rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-300 text-lg mb-2">
            Nenhum empréstimo cadastrado
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Comece criando seu primeiro empréstimo
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="bg-dark-600 text-white px-6 py-2 rounded-lg hover:bg-dark-700 transition"
          >
            Criar empréstimo
          </button>
        </div>
      ) : (

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
  {contracts.map((contract) => {
    // Calcular informações adicionais
    const profit = (contract.totalInterest || 0);
    const paidInstallments = installments.filter(
      i => i.contractId === contract.id && i.status === 'pago'
    ).length;
    const totalInstallments = contract.installments || 0;
    const nextDueDate = installments
      .filter(i => i.contractId === contract.id && i.status === 'pendente')
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0]?.dueDate;

    return (
      <div
        key={contract.id}
        className="bg-background-tertiary rounded-lg shadow-lg hover:shadow-xl transition-all border border-surface-dark overflow-hidden"
      >
        {/* Header do Card */}
        <div className="bg-gradient-to-r from-dark-600/20 to-dark-500/20 p-4 border-b border-surface-dark">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-bold text-white text-lg mb-1">
                {contract.clientName}
              </h3>
              <p className="text-sm text-gray-400 line-clamp-1">
                {contract.description || 'Empréstimo'}
              </p>
            </div>
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(contract.status)}`}
            >
              {contract.status}
            </span>
          </div>

          {/* Badges de Informação */}
          <div className="flex items-center gap-2 mt-3">
            <span className="px-2 py-1 bg-surface-dark text-gray-300 text-xs rounded flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {getTypeLabel(contract.type)}
            </span>
            {contract.type !== "unico" && (
              <span className="px-2 py-1 bg-surface-dark text-gray-300 text-xs rounded flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {contract.installments}x - {contract.frequency}
              </span>
            )}
          </div>
        </div>

        {/* Corpo do Card - Valores Principais */}
        <div className="p-5 space-y-4">
          {/* Grid de Valores */}
          <div className="grid grid-cols-2 gap-3">
            {/* Valor Emprestado */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  Emprestado
                </span>
              </div>
              <p className="text-lg font-bold text-blue-400">
                {formatCurrency(contract.value)}
              </p>
            </div>

            {/* Total a Receber */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  A Receber
                </span>
              </div>
              <p className="text-lg font-bold text-green-400">
                {formatCurrency(contract.totalReceivable || contract.value)}
              </p>
            </div>

            {/* Lucro (Juros) */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  Lucro (Juros)
                </span>
              </div>
              <p className="text-lg font-bold text-yellow-400">
                {formatCurrency(profit)}
              </p>
            </div>

            {/* Próximo Vencimento */}
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  Vencimento
                </span>
              </div>
              <p className="text-sm font-bold text-purple-400">
                {nextDueDate 
                  ? new Date(nextDueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                  : 'Quitado'
                }
              </p>
            </div>
          </div>

          {/* Quantidade Paga */}
          <div className="bg-surface-dark rounded-lg p-3 border border-surface-medium">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Parcelas Pagas</span>
              <span className="text-sm font-bold text-white">
                {paidInstallments} / {totalInstallments}
              </span>
            </div>
            <div className="w-full bg-surface-medium rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-dark-600 to-dark-500 h-2 rounded-full transition-all"
                style={{
                  width: `${totalInstallments > 0 ? (paidInstallments / totalInstallments) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Valores Recebido vs Pendente */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-surface-dark">
            <div>
              <span className="text-xs text-gray-500">Recebido</span>
              <p className="text-base font-bold text-green-400 mt-1">
                {formatCurrency(contract.paid || 0)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500">Pendente</span>
              <p className="text-base font-bold text-orange-400 mt-1">
                {formatCurrency(contract.pending || contract.totalReceivable)}
              </p>
            </div>
          </div>

          {/* Barra de Progresso Geral */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Progresso Geral</span>
              <span className="text-xs font-bold text-white">
                {Math.round(((contract.paid || 0) / (contract.totalReceivable || contract.value)) * 100)}%
              </span>
            </div>
            <div className="w-full bg-surface-medium rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all shadow-lg"
                style={{
                  width: `${((contract.paid || 0) / (contract.totalReceivable || contract.value)) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer com Botões de Ação */}
        <div className="p-4 bg-surface-dark/50 border-t border-surface-dark">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => handleOpenPaymentModal(contract)}
              className="px-3 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white text-sm font-medium rounded-lg hover:from-green-500 hover:to-green-400 transition-all shadow-lg hover:shadow-green-500/20 flex items-center justify-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Registrar Pagamento
            </button>

            <button
              onClick={() => handlePayInterestOnly(contract)}
              className="px-3 py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white text-sm font-medium rounded-lg hover:from-yellow-500 hover:to-yellow-400 transition-all shadow-lg hover:shadow-yellow-500/20 flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Pagar Juros
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleViewHistory(contract)}
              className="px-3 py-2 border border-surface-medium text-gray-300 text-xs font-medium rounded-lg hover:bg-surface-medium transition-all flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              Histórico
            </button>

            <button
              onClick={() => handleOpenModal(contract)}
              className="px-3 py-2 border border-surface-medium text-gray-300 text-xs font-medium rounded-lg hover:bg-surface-medium transition-all flex items-center justify-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" />
              Editar
            </button>

            <button
              onClick={() => handleDelete(contract.id)}
              className="px-3 py-2 border border-red-500/30 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/10 transition-all flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir
            </button>
          </div>
        </div>
      </div>
    );
  })}
</div>

      )}

{/* Modal de Cadastro/Edição */}
{showModal && (
  <Modal 
    title={selectedContract ? 'Editar Empréstimo' : 'Novo Empréstimo'}
    onClose={handleCloseModal}
    size="large"
  >
    {/* Tabs */}
    <div className="flex gap-2 mb-6 border-b border-surface-dark">
      <button
        type="button"
        onClick={() => setActiveTab('form')}
        className={`px-6 py-3 font-medium transition-all relative ${
          activeTab === 'form'
            ? 'text-dark-400 border-b-2 border-dark-500'
            : 'text-gray-400 hover:text-gray-300'
        }`}
      >
        Formulário
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('simulation')}
        className={`px-6 py-3 font-medium transition-all relative ${
          activeTab === 'simulation'
            ? 'text-dark-400 border-b-2 border-dark-500'
            : 'text-gray-400 hover:text-gray-300'
        }`}
        disabled={!formData.value || !formData.interestRate || !formData.installments}
      >
        Simulação
        {(!formData.value || !formData.interestRate || !formData.installments) && (
          <span className="ml-2 px-2 py-0.5 bg-gray-600 text-gray-300 text-xs rounded">
            Preencha o formulário
          </span>
        )}
      </button>
    </div>

    {/* Conteúdo das Tabs */}
    {activeTab === 'form' ? (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seção 1: Dados Básicos */}
        <div className="bg-surface-dark p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-dark-400 mb-4 uppercase tracking-wide">
            Dados Básicos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cliente *
              </label>
              <select
                name="clientId"
                value={formData.clientId}
                onChange={handleChange}
                className="input-dark w-full"
                required
              >
                <option value="">Selecione um cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descrição do Empréstimo
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="2"
                placeholder="Ex: Empréstimo pessoal, Capital de giro..."
                className="input-dark w-full resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data do Contrato *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="input-dark w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data da Primeira Parcela *
              </label>
              <input
                type="date"
                name="firstInstallmentDate"
                value={formData.firstInstallmentDate}
                onChange={handleChange}
                className="input-dark w-full"
                required
              />
            </div>
          </div>
        </div>

        {/* Seção 2: Valores e Juros */}
        <div className="bg-surface-dark p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-dark-400 mb-4 uppercase tracking-wide">
            Valores e Juros
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Valor Total (R$) *
              </label>
              <input
                type="number"
                name="value"
                value={formData.value}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="input-dark w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Taxa de Juros (%) *
              </label>
              <input
                type="number"
                name="interestRate"
                value={formData.interestRate}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="input-dark w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipo de Juros *
              </label>
              <select
                name="interestType"
                value={formData.interestType}
                onChange={handleChange}
                className="input-dark w-full"
                required
              >
                <option value="simples">Juros Simples</option>
                <option value="composto">Juros Compostos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Número de Parcelas *
              </label>
              <input
                type="number"
                name="installments"
                value={formData.installments}
                onChange={handleChange}
                min="1"
                className="input-dark w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Frequência *
              </label>
              <select
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                className="input-dark w-full"
                required
              >
                <option value="diaria">Diária</option>
                <option value="semanal">Semanal</option>
                <option value="quinzenal">Quinzenal</option>
                <option value="mensal">Mensal</option>
                <option value="trimestral">Trimestral</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input-dark w-full"
                required
              >
                <option value="ativo">Ativo</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Seção 3: Valores Calculados */}
        <div className="bg-gradient-to-br from-dark-600/20 to-dark-500/20 border border-dark-500/30 p-6 rounded-lg">
          <h3 className="text-sm font-semibold text-dark-400 mb-4 uppercase tracking-wide flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Cálculos Automáticos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-dark p-4 rounded-lg">
              <label className="block text-xs text-gray-400 mb-1">
                Juros Total
              </label>
              <p className="text-2xl font-bold text-yellow-400">
                {formatCurrency(formData.totalInterest)}
              </p>
            </div>

            <div className="bg-surface-dark p-4 rounded-lg">
              <label className="block text-xs text-gray-400 mb-1">
                Valor da Parcela
              </label>
              <p className="text-2xl font-bold text-dark-400">
                {formatCurrency(formData.installmentValue)}
              </p>
            </div>

            <div className="bg-surface-dark p-4 rounded-lg">
              <label className="block text-xs text-gray-400 mb-1">
                Total a Receber
              </label>
              <p className="text-2xl font-bold text-green-400">
                {formatCurrency(formData.totalReceivable)}
              </p>
            </div>
          </div>

          {/* Fórmula explicativa */}
          <div className="mt-4 p-3 bg-surface-dark/50 rounded border border-surface-medium">
            <p className="text-xs text-gray-400">
              <span className="font-semibold text-gray-300">
                Fórmula usada:
              </span>{" "}
              {formData.interestType === "simples" ? (
                <>Juros Simples - J = P × i × n | M = P + J</>
              ) : (
                <>Juros Compostos - M = P × (1 + i)^n</>
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              P = Principal (
              {formatCurrency(parseFloat(formData.value) || 0)}), i = Taxa (
              {formData.interestRate}%), n = Parcelas (
              {formData.installments})
            </p>
          </div>
        </div>

        {/* Seção 4: Juros por Atraso */}
        <div className="bg-surface-dark p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="lateFeeEnabled"
              name="lateFeeEnabled"
              checked={formData.lateFeeEnabled}
              onChange={handleChange}
              className="mt-1 w-4 h-4 rounded bg-surface-medium border-surface-light text-dark-600 focus:ring-2 focus:ring-dark-500"
            />
            <div className="flex-1">
              <label
                htmlFor="lateFeeEnabled"
                className="text-sm font-medium text-gray-300 cursor-pointer"
              >
                Aplicar juros diários em caso de atraso
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Ativa a cobrança de juros adicionais sobre parcelas vencidas
              </p>
            </div>
          </div>

          {formData.lateFeeEnabled && (
            <div className="mt-4 pl-7 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Taxa de Juros Diário (%) *
              </label>
              <input
                type="number"
                name="lateFeeRate"
                value={formData.lateFeeRate}
                onChange={handleChange}
                placeholder="Ex: 0.033 (equivale a 1% ao mês)"
                step="0.001"
                min="0"
                className="input-dark w-full md:w-64"
                required={formData.lateFeeEnabled}
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 Dica: 1% ao mês ≈ 0.033% ao dia
              </p>
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3 pt-4 border-t border-surface-dark">
          <button
            type="button"
            onClick={handleCloseModal}
            className="btn-secondary-dark flex-1"
            disabled={submitting}
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('simulation')}
            className="btn-secondary-dark flex-1"
            disabled={!formData.value || !formData.interestRate || !formData.installments}
          >
            Ver Simulação
          </button>
          
          <button
            type="submit"
            className="btn-primary-dark flex-1"
            disabled={submitting}
          >
            {submitting ? 'Salvando...' : selectedContract ? 'Atualizar Empréstimo' : 'Criar Empréstimo'}
          </button>
        </div>
      </form>
    ) : (
      <div>
        <LoanSimulator 
          formData={formData}
          formatCurrency={formatCurrency}
          formatDate={(date) => new Date(date).toLocaleDateString('pt-BR')}
        />
        
        {/* Botões de Ação */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-surface-dark">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className="btn-secondary-dark flex-1"
          >
            Voltar ao Formulário
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary-dark flex-1"
            disabled={submitting}
          >
            {submitting ? 'Salvando...' : 'Confirmar e Criar Empréstimo'}
          </button>
        </div>
      </div>
    )}
  </Modal>
)}

  {/* Modal de Pagamento */}
{showPaymentModal && (
  <Modal
    title="Registrar Pagamento"
    onClose={() => setShowPaymentModal(false)}
    size="default"
  >
    <form onSubmit={handleProcessPayment} className="space-y-4">
      <div className="bg-dark-500/10 border border-dark-500/30 rounded-lg p-4">
        <p className="text-sm text-gray-400 mb-2">Empréstimo para:</p>
        <p className="text-lg font-bold text-white">{selectedContractForAction?.clientName}</p>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-xs text-gray-500">Total a Receber</p>
            <p className="text-base font-bold text-green-400">
              {formatCurrency(selectedContractForAction?.totalReceivable || 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Pendente</p>
            <p className="text-base font-bold text-orange-400">
              {formatCurrency(selectedContractForAction?.pending || 0)}
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Valor do Pagamento (R$) *
        </label>
        <input
          type="number"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0"
          max={selectedContractForAction?.pending || 0}
          className="input-dark w-full"
          required
        />
        <p className="text-xs text-gray-500 mt-2">
          Máximo: {formatCurrency(selectedContractForAction?.pending || 0)}
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={() => setShowPaymentModal(false)}
          className="btn-secondary-dark flex-1"
        >
          Cancelar
        </button>
        <button type="submit" className="btn-primary-dark flex-1">
          Confirmar Pagamento
        </button>
      </div>
    </form>
  </Modal>
)}

{/* Modal de Pagar Juros */}
{showInterestModal && (
  <Modal
    title="Pagar Somente Juros"
    onClose={() => setShowInterestModal(false)}
    size="default"
  >
    <form onSubmit={handleProcessPayment} className="space-y-4">
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <p className="text-sm text-gray-400 mb-2">Pagamento de juros para:</p>
        <p className="text-lg font-bold text-white">{selectedContractForAction?.clientName}</p>
        <div className="mt-4">
          <p className="text-xs text-gray-500">Total de Juros</p>
          <p className="text-2xl font-bold text-yellow-400">
            {formatCurrency(selectedContractForAction?.totalInterest || 0)}
          </p>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
        <p className="text-xs text-blue-300 flex items-start gap-2">
          <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5" />
          O pagamento de juros reduzirá o saldo devedor sem afetar o principal emprestado.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Valor do Pagamento (R$) *
        </label>
        <input
          type="number"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0"
          className="input-dark w-full"
          required
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={() => setShowInterestModal(false)}
          className="btn-secondary-dark flex-1"
        >
          Cancelar
        </button>
        <button type="submit" className="btn-primary-dark flex-1">
          Confirmar Pagamento
        </button>
      </div>
    </form>
  </Modal>
)}

{/* Modal de Histórico */}
{showHistoryModal && (
  <Modal
    title="Histórico de Pagamentos"
    onClose={() => setShowHistoryModal(false)}
    size="large"
  >
    <div className="space-y-4">
      <div className="bg-dark-500/10 border border-dark-500/30 rounded-lg p-4">
        <p className="text-sm text-gray-400 mb-2">Empréstimo de:</p>
        <p className="text-lg font-bold text-white">{selectedContractForAction?.clientName}</p>
      </div>

      <div className="space-y-3">
        {installments
          .filter(i => i.contractId === selectedContractForAction?.id)
          .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
          .map(inst => (
            <div key={inst.id} className="bg-surface-dark p-4 rounded-lg border border-surface-medium">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Parcela {inst.number}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Vencimento: {new Date(inst.dueDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-white">
                    {formatCurrency(inst.value)}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    inst.status === 'pago' ? 'bg-green-500/20 text-green-400' :
                    inst.status === 'vencido' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {inst.status}
                  </span>
                </div>
              </div>
              {inst.status === 'pago' && inst.paidDate && (
                <p className="text-xs text-green-400 mt-2">
                  Pago em: {new Date(inst.paidDate).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          ))}
      </div>

      <button
        onClick={() => setShowHistoryModal(false)}
        className="btn-secondary-dark w-full mt-4"
      >
        Fechar
      </button>
    </div>
  </Modal>
)}

  </div>
  );
};

export default Contracts;