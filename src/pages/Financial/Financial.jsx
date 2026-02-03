import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/auth";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Filter,
  Calendar,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { contractsService, installmentsService, transactionsService } from "../../firebase/services/firebaseServices/FirebaseServices";
import Modal from "../../components/Modal/Modal";

const Financial = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("transaction"); // 'transaction' ou 'payment'
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("month");
  const [formData, setFormData] = useState({
    type: "entrada",
    description: "",
    value: "",
    date: new Date().toISOString().split("T")[0],
    category: "honorario",
    paymentMethod: "pix",
  });
  const [paymentData, setPaymentData] = useState({
    paidValue: "",
    paidDate: new Date().toISOString().split("T")[0],
    paymentMethod: "pix",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, installmentsData, contractsData] =
        await Promise.all([
          transactionsService.getAll(),
          installmentsService.getAll(),
          contractsService.getAll(),
        ]);
      setTransactions(transactionsData);
      setInstallments(installmentsData);
      setContracts(contractsData);
    } catch (error) {
      console.error("Erro ao carregar dados financeiros:", error);
      alert("Erro ao carregar dados financeiros");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTransactionModal = () => {
    setModalType("transaction");
    setFormData({
      type: "entrada",
      description: "",
      value: "",
      date: new Date().toISOString().split("T")[0],
      category: "honorario",
      paymentMethod: "pix",
    });
    setShowModal(true);
  };

  const handleOpenPaymentModal = (installment) => {
    setModalType("payment");
    setSelectedInstallment(installment);
    setPaymentData({
      paidValue: installment.value.toString(),
      paidDate: new Date().toISOString().split("T")[0],
      paymentMethod: "pix",
      notes: "",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalType("transaction");
    setSelectedInstallment(null);
  };

  const handleTransactionChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePaymentChange = (e) => {
    setPaymentData({
      ...paymentData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const transactionData = {
        type: formData.type,
        description: formData.description,
        value: parseFloat(formData.value),
        date: formData.date,
        category: formData.category,
        paymentMethod: formData.paymentMethod,
        createdBy: user.uid,
      };

      await transactionsService.add(transactionData);
      alert("Transação registrada com sucesso!");
      handleCloseModal();
      loadData();
    } catch (error) {
      console.error("Erro ao registrar transação:", error);
      alert("Erro ao registrar transação");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const paidValue = parseFloat(paymentData.paidValue);

      // Atualizar parcela
      await installmentsService.markAsPaid(
        selectedInstallment.id,
        paidValue,
        paymentData.paidDate
      );

      // Registrar transação
      const contract = contracts.find(
        (c) => c.id === selectedInstallment.contractId
      );
      await transactionsService.add({
        type: "entrada",
        description: `Parcela ${selectedInstallment.number} - ${
          contract?.clientName || "Cliente"
        }`,
        value: paidValue,
        date: paymentData.paidDate,
        category: "honorario",
        paymentMethod: paymentData.paymentMethod,
        contractId: selectedInstallment.contractId,
        installmentId: selectedInstallment.id,
        createdBy: user.uid,
      });

      // Atualizar valores do contrato
      if (contract) {
        const newPaid = (contract.paid || 0) + paidValue;
        const newPending = contract.value - newPaid;
        await contractsService.update(contract.id, {
          ...contract,
          paid: newPaid,
          pending: newPending,
        });
      }

      alert("Pagamento registrado com sucesso!");
      handleCloseModal();
      loadData();
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
      alert("Erro ao registrar pagamento");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm("Deseja realmente excluir esta transação?")) return;

    try {
      await transactionsService.delete(id);
      alert("Transação excluída com sucesso!");
      loadData();
    } catch (error) {
      console.error("Erro ao excluir transação:", error);
      alert("Erro ao excluir transação");
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getStatusColor = (status) => {
    const colors = {
      pago: "bg-green-500 text-green-400",
      pendente: "bg-yellow-500 text-yellow-400",
      vencido: "bg-red-500 text-red-400",
    };
    return colors[status] || "bg-surface-medium text-gray-800";
  };

  const getStatusIcon = (status) => {
    const icons = {
      pago: <CheckCircle className="w-4 h-4" />,
      pendente: <Clock className="w-4 h-4" />,
      vencido: <AlertCircle className="w-4 h-4" />,
    };
    return icons[status] || <Clock className="w-4 h-4" />;
  };

  // Cálculos
  const totalEntradas = transactions
    .filter((t) => t.type === "entrada")
    .reduce((sum, t) => sum + t.value, 0);
  const totalSaidas = transactions
    .filter((t) => t.type === "saida")
    .reduce((sum, t) => sum + t.value, 0);
  const saldoAtual = totalEntradas - totalSaidas;

  // Parcelas pendentes
  const pendingInstallments = installments
    .filter((i) => i.status === "pendente")
    .map((inst) => {
      const contract = contracts.find((c) => c.id === inst.contractId);
      const dueDate = new Date(inst.dueDate);
      const today = new Date();
      const isOverdue = dueDate < today;

      return {
        ...inst,
        contract,
        isOverdue,
        status: isOverdue ? "vencido" : "pendente",
      };
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  // Filtrar transações
  const filteredTransactions = transactions.filter((t) => {
    if (filterType !== "all" && t.type !== filterType) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Financeiro</h1>
        <button
          onClick={handleOpenTransactionModal}
          className="bg-dark-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-dark-700 transition"
        >
          <Plus className="w-5 h-5" />
          Nova Transação
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8" />
            <span className="text-sm font-medium opacity-90">
              Total de Entradas
            </span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totalEntradas)}</p>
          <p className="text-sm opacity-75 mt-2">
            {transactions.filter((t) => t.type === "entrada").length} transações
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <TrendingDown className="w-8 h-8" />
            <span className="text-sm font-medium opacity-90">
              Total de Saídas
            </span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totalSaidas)}</p>
          <p className="text-sm opacity-75 mt-2">
            {transactions.filter((t) => t.type === "saida").length} transações
          </p>
        </div>

        <div className="bg-gradient-to-br from-dark-600 to-dark-500 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-8 h-8" />
            <span className="text-sm font-medium opacity-90">
              Saldo em Caixa
            </span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(saldoAtual)}</p>
          <p className="text-sm opacity-75 mt-2">Atualizado agora</p>
        </div>
      </div>

      {/* Parcelas Pendentes e Histórico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parcelas Pendentes */}
        <div className="bg-background-tertiary rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Parcelas Pendentes
              </h2>
              <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                {pendingInstallments.length}
              </span>
            </div>
          </div>
          <div className="p-6 max-h-96 overflow-y-auto">
            {pendingInstallments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Nenhuma parcela pendente
              </p>
            ) : (
              <div className="space-y-3">
                {pendingInstallments.map((inst) => (
                  <div
                    key={inst.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      inst.isOverdue
                        ? "bg-red-50 border-red-500"
                        : "bg-surface-dark border-surface-medium"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-white">
                          {inst.contract?.clientName || "Cliente"}
                        </p>
                        <p className="text-sm text-gray-300">
                          Parcela {inst.number}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(
                          inst.status
                        )}`}
                      >
                        {getStatusIcon(inst.status)}
                        {inst.isOverdue ? "Vencida" : "Pendente"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <p className="text-lg font-bold text-white">
                          {formatCurrency(inst.value)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Vencimento: {formatDate(inst.dueDate)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleOpenPaymentModal(inst)}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                      >
                        Dar Baixa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Histórico de Transações */}
        <div className="bg-background-tertiary rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Histórico de Transações
              </h2>
              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-background-primary px-3 py-1 text-sm border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent"
                >
                  <option value="all">Todas</option>
                  <option value="entrada">Entradas</option>
                  <option value="saida">Saídas</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-6 max-h-96 overflow-y-auto">
            {filteredTransactions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Nenhuma transação registrada
              </p>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((trans) => (
                  <div
                    key={trans.id}
                    className="flex items-center justify-between p-3 bg-surface-dark rounded-lg hover:bg-surface-medium transition"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`p-2 rounded ${
                          trans.type === "entrada"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      >
                        {trans.type === "entrada" ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">
                          {trans.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(trans.date)} • {trans.category}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-semibold ${
                        trans.type === "entrada"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {trans.type === "entrada" ? "+" : "-"}
                      {formatCurrency(trans.value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabela Detalhada */}
      <div className="bg-background-tertiary rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-white">
            Todas as Transações
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-dark">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Método
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-dark">
              {filteredTransactions.map((trans) => (
                <tr key={trans.id} className="hover:bg-surface-dark">
                  <td className="px-6 py-4 text-sm text-white">
                    {formatDate(trans.date)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        trans.type === "entrada"
                          ? "bg-green-500 text-green-400"
                          : "bg-red-500 text-red-400"
                      }`}
                    >
                      {trans.type === "entrada" ? "Entrada" : "Saída"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-white">
                    {trans.description}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300 capitalize">
                    {trans.category}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300 capitalize">
                    {trans.paymentMethod}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <span
                      className={`font-semibold ${
                        trans.type === "entrada"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {trans.type === "entrada" ? "+" : "-"}
                      {formatCurrency(trans.value)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Transação */}
      {showModal && modalType === "transaction" && (
        <Modal title="Nova Transação" onClose={handleCloseModal}>
          <form onSubmit={handleSubmitTransaction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Tipo *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, type: "entrada" })
                    }
                    className={`px-4 py-3 rounded-lg border-2 transition ${
                      formData.type === "entrada"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-surface-medium hover:border-gray-400"
                    }`}
                  >
                    <TrendingUp className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm font-medium">Entrada</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "saida" })}
                    className={`px-4 py-3 rounded-lg border-2 transition ${
                      formData.type === "saida"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-surface-medium hover:border-gray-400"
                    }`}
                  >
                    <TrendingDown className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm font-medium">Saída</span>
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Descrição *
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleTransactionChange}
                  placeholder="Ex: Pagamento de honorários, Despesas cartório..."
                  className="w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Valor (R$) *
                </label>
                <input
                  type="number"
                  name="value"
                  value={formData.value}
                  onChange={handleTransactionChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Data *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleTransactionChange}
                  className="w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Categoria *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleTransactionChange}
                  className="w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent"
                  required
                >
                  <option value="honorario">Honorário</option>
                  <option value="despesa">Despesa</option>
                  <option value="antecipacao">Antecipação</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Método de Pagamento *
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleTransactionChange}
                  className="w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent"
                  required
                >
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao">Cartão</option>
                  <option value="transferencia">Transferência</option>
                  <option value="boleto">Boleto</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 px-6 py-3 border border-surface-medium text-gray-200 rounded-lg hover:bg-surface-dark transition font-medium"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-dark-600 text-white rounded-lg hover:bg-dark-700 transition font-medium disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? "Salvando..." : "Registrar"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal de Baixa de Pagamento */}
      {showModal && modalType === "payment" && selectedInstallment && (
        <Modal title="Registrar Pagamento" onClose={handleCloseModal}>
          <form onSubmit={handleSubmitPayment} className="space-y-4">
            <div className="bg-dark-500/10 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-dark-800 font-medium mb-2">
                Informações da Parcela
              </p>
              <div className="space-y-1 text-sm text-dark-700">
                <p>
                  <span className="font-medium">Cliente:</span>{" "}
                  {selectedInstallment.contract?.clientName}
                </p>
                <p>
                  <span className="font-medium">Parcela:</span>{" "}
                  {selectedInstallment.number}
                </p>
                <p>
                  <span className="font-medium">Valor:</span>{" "}
                  {formatCurrency(selectedInstallment.value)}
                </p>
                <p>
                  <span className="font-medium">Vencimento:</span>{" "}
                  {formatDate(selectedInstallment.dueDate)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Valor Pago (R$) *
                </label>
                <input
                  type="number"
                  name="paidValue"
                  value={paymentData.paidValue}
                  onChange={handlePaymentChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Data do Pagamento *
                </label>
                <input
                  type="date"
                  name="paidDate"
                  value={paymentData.paidDate}
                  onChange={handlePaymentChange}
                  className="w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Método de Pagamento *
                </label>
                <select
                  name="paymentMethod"
                  value={paymentData.paymentMethod}
                  onChange={handlePaymentChange}
                  className="w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent"
                  required
                >
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao">Cartão</option>
                  <option value="transferencia">Transferência</option>
                  <option value="boleto">Boleto</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Observações
                </label>
                <textarea
                  name="notes"
                  value={paymentData.notes}
                  onChange={handlePaymentChange}
                  rows="3"
                  placeholder="Informações adicionais sobre o pagamento..."
                  className="w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 px-6 py-3 border border-surface-medium text-gray-200 rounded-lg hover:bg-surface-dark transition font-medium"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? "Processando..." : "Confirmar Pagamento"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
export default Financial;
