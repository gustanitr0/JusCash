import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/auth'
import { TrendingUp, TrendingDown, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import {
  contractsService,
  installmentsService,
  transactionsService,
} from '../../services/FirebaseServices'
import Modal from '../../components/Modal/Modal'
import {
  getDaysLate,
  getInstallmentPaymentBreakdown,
  getPendingInstallmentsTotal,
} from '../../utils/installmentCalculations'

const PAYMENT_TYPE_OPTIONS = [
  {
    value: 'installment',
    label: 'Valor da parcela',
    description: 'Quita apenas o principal da parcela.',
  },
  {
    value: 'interest',
    label: 'Juros diários',
    description: 'Paga somente os juros acumulados por atraso.',
  },
  {
    value: 'total',
    label: 'Valor total',
    description: 'Quita principal e juros acumulados.',
  },
]

const Financial = () => {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [installments, setInstallments] = useState([])
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedInstallment, setSelectedInstallment] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [paymentData, setPaymentData] = useState({
    paymentType: 'total',
    paidValue: '',
    paidDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'pix',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user?.uid) {
      loadData()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)

      if (!user?.uid) {
        console.error('user.uid não disponivel')
        return
      }

      const [transactionsData, installmentsData, contractsData] = await Promise.all([
        transactionsService.getAll(user.uid),
        installmentsService.getAll(user.uid),
        contractsService.getAll(user.uid),
      ])
      setTransactions(transactionsData)
      setInstallments(installmentsData)
      setContracts(contractsData)
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error)
      alert('Erro ao carregar dados financeiros')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)

  const formatDate = (date) => new Date(date).toLocaleDateString('pt-BR')

  const getStatusColor = (status) => {
    const colors = {
      pago: 'bg-green-500 text-white',
      parcial: 'bg-blue-500 text-white',
      pendente: 'bg-yellow-500 text-white',
      vencido: 'bg-red-500 text-white',
    }
    return colors[status] || 'bg-surface-medium text-gray-800'
  }

  const getStatusIcon = (status) => {
    const icons = {
      pago: <CheckCircle className="w-4 h-4" />,
      parcial: <Clock className="w-4 h-4" />,
      pendente: <Clock className="w-4 h-4" />,
      vencido: <AlertCircle className="w-4 h-4" />,
    }
    return icons[status] || <Clock className="w-4 h-4" />
  }

  const getInstallmentDetails = (installment, referenceDate = new Date()) => {
    if (!installment) return null

    const contract = contracts.find((item) => item.id === installment.contractId)
    const daysLate = getDaysLate(installment.dueDate, referenceDate)
    const { principalBalance, lateFeeBalance, totalBalance } = getInstallmentPaymentBreakdown(
      installment,
      referenceDate
    )

    return {
      ...installment,
      contract,
      daysLate,
      isOverdue: daysLate > 0,
      principalBalance,
      lateFeeBalance,
      totalBalance,
      status:
        installment.status === 'pago'
          ? 'pago'
          : daysLate > 0
            ? 'vencido'
            : installment.status || 'pendente',
    }
  }

  const getPaymentTypeAmount = (installment, paymentType, referenceDate = paymentData.paidDate) => {
    const details = getInstallmentDetails(installment, referenceDate)

    if (!details) return 0
    if (paymentType === 'interest') return details.lateFeeBalance
    if (paymentType === 'installment') return details.principalBalance
    return details.totalBalance
  }

  const handleOpenPaymentModal = (installment) => {
    const today = new Date().toISOString().split('T')[0]
    const details = getInstallmentDetails(installment, today)
    const paymentType = details?.lateFeeBalance > 0 ? 'total' : 'installment'
    const amount = getPaymentTypeAmount(installment, paymentType, today)

    setSelectedInstallment(installment)
    setPaymentData({
      paymentType,
      paidValue: amount > 0 ? amount.toFixed(2) : '',
      paidDate: today,
      paymentMethod: 'pix',
      notes: '',
    })
    setShowPaymentModal(true)
  }

  const handleCloseModal = () => {
    setShowPaymentModal(false)
    setSelectedInstallment(null)
  }

  const handlePaymentChange = (e) => {
    const { name, value } = e.target
    setPaymentData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  useEffect(() => {
    if (!selectedInstallment) return

    const amount = getPaymentTypeAmount(
      selectedInstallment,
      paymentData.paymentType,
      paymentData.paidDate
    )

    setPaymentData((prev) => ({
      ...prev,
      paidValue: amount > 0 ? amount.toFixed(2) : '',
    }))
  }, [selectedInstallment, paymentData.paymentType, paymentData.paidDate])

  const applyPaymentToInstallment = (installment, paidValue, paymentType, paidDate) => {
    const details = getInstallmentDetails(installment, paidDate)

    if (!details) {
      throw new Error('Parcela não encontrada')
    }

    const maxAllowed = getPaymentTypeAmount(installment, paymentType, paidDate)

    if (!paidValue || paidValue <= 0) {
      throw new Error('Informe um valor válido para o pagamento.')
    }

    if (paidValue > maxAllowed) {
      throw new Error('O valor informado é maior do que o permitido para a opção selecionada.')
    }

    let principalIncrement = 0
    let lateFeeIncrement = 0

    if (paymentType === 'installment') {
      principalIncrement = paidValue
    } else if (paymentType === 'interest') {
      lateFeeIncrement = paidValue
    } else {
      principalIncrement = details.principalBalance
      lateFeeIncrement = Number((paidValue - principalIncrement).toFixed(2))
    }

    const principalPaid = Number(((installment.principalPaid || 0) + principalIncrement).toFixed(2))
    const lateFeePaid = Number(((installment.lateFeePaid || 0) + lateFeeIncrement).toFixed(2))
    const remainingPrincipal = Number(
      Math.max(0, details.principalBalance - principalIncrement).toFixed(2)
    )
    const remainingLateFee = Number(
      Math.max(0, details.lateFeeBalance - lateFeeIncrement).toFixed(2)
    )

    return {
      ...installment,
      principalPaid,
      lateFeePaid,
      paidValue: Number((principalPaid + lateFeePaid).toFixed(2)),
      paidDate,
      status: remainingPrincipal <= 0 && remainingLateFee <= 0 ? 'pago' : 'parcial',
    }
  }

  const handleSubmitPayment = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const paidValue = parseFloat(paymentData.paidValue)
      const updatedInstallment = applyPaymentToInstallment(
        selectedInstallment,
        paidValue,
        paymentData.paymentType,
        paymentData.paidDate
      )

      await installmentsService.update(user.uid, selectedInstallment.id, updatedInstallment)

      const contract = contracts.find((item) => item.id === selectedInstallment.contractId)
      await transactionsService.add(user.uid, {
        type: 'entrada',
        description: `Parcela ${selectedInstallment.number} - ${contract?.clientName || 'Cliente'}`,
        value: paidValue,
        date: paymentData.paidDate,
        category: 'honorario',
        paymentMethod: paymentData.paymentMethod,
        createdBy: user.uid,
      })

      if (contract) {
        const updatedInstallments = installments.map((installmentItem) =>
          installmentItem.id === selectedInstallment.id ? updatedInstallment : installmentItem
        )
        const contractInstallments = updatedInstallments.filter(
          (installmentItem) => installmentItem.contractId === selectedInstallment.contractId
        )
        const newPending = getPendingInstallmentsTotal(contractInstallments, paymentData.paidDate)
        const newPaid = Number(((contract.paid || 0) + paidValue).toFixed(2))

        await contractsService.update(user.uid, contract.id, {
          ...contract,
          paid: newPaid,
          pending: newPending,
          status: newPending <= 0 ? 'concluido' : contract.status,
        })
      }

      alert('Pagamento registrado com sucesso!')
      handleCloseModal()
      loadData()
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error)
      alert(error.message || 'Erro ao registrar pagamento')
    } finally {
      setSubmitting(false)
    }
  }

  const totalEntradas = transactions
    .filter((transaction) => transaction.type === 'entrada')
    .reduce((sum, transaction) => sum + transaction.value, 0)
  const totalSaidas = transactions
    .filter((transaction) => transaction.type === 'saida')
    .reduce((sum, transaction) => sum + transaction.value, 0)
  const saldoAtual = totalEntradas - totalSaidas

  const pendingInstallments = useMemo(
    () =>
      installments
        .filter((installment) => installment.status !== 'pago')
        .map((installment) => getInstallmentDetails(installment))
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
    [installments, contracts]
  )

  const filteredTransactions = transactions.filter((transaction) => {
    if (filterType !== 'all' && transaction.type !== filterType) return false
    return true
  })

  const selectedInstallmentDetails = selectedInstallment
    ? getInstallmentDetails(selectedInstallment, paymentData.paidDate)
    : null
  const selectedPaymentLimit = selectedInstallment
    ? getPaymentTypeAmount(selectedInstallment, paymentData.paymentType, paymentData.paidDate)
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Carregando dados financeiros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Financeiro</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-4 sm:p-6 text-white min-w-0">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="text-sm font-medium opacity-90">Total de Entradas</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold break-words">
            {formatCurrency(totalEntradas)}
          </p>
          <p className="text-xs sm:text-sm opacity-75 mt-2">
            {transactions.filter((transaction) => transaction.type === 'entrada').length} transações
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-4 sm:p-6 text-white min-w-0">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <TrendingDown className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="text-sm font-medium opacity-90">Total de Saídas</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold break-words">
            {formatCurrency(totalSaidas)}
          </p>
          <p className="text-xs sm:text-sm opacity-75 mt-2">
            {transactions.filter((transaction) => transaction.type === 'saida').length} transações
          </p>
        </div>

        <div className="bg-gradient-to-br from-dark-600 to-dark-500 rounded-lg shadow-lg p-4 sm:p-6 text-white min-w-0">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <DollarSign className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="text-sm font-medium opacity-90">Saldo em Caixa</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold break-words">{formatCurrency(saldoAtual)}</p>
          <p className="text-xs sm:text-sm opacity-75 mt-2">Atualizado agora</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-background-tertiary rounded-lg shadow overflow-hidden">
          <div className="p-4 sm:p-6 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-white">Parcelas Pendentes</h2>
              <span className="self-start sm:self-auto px-3 py-1 bg-orange-100 text-orange-800 text-xs sm:text-sm font-medium rounded-full">
                {pendingInstallments.length}
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-6 max-h-96 overflow-y-auto">
            {pendingInstallments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhuma parcela pendente</p>
            ) : (
              <div className="space-y-3">
                {pendingInstallments.map((installment) => (
                  <div
                    key={installment.id}
                    className={`p-3 sm:p-4 rounded-lg border-l-4 min-w-0 ${
                      installment.isOverdue
                        ? 'bg-surface-dark border-red-500'
                        : installment.status === 'parcial'
                          ? 'bg-surface-dark border-blue-500'
                          : 'bg-surface-dark border-surface-medium'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">
                          {installment.contract?.clientName || 'Cliente'}
                        </p>
                        <p className="text-sm text-gray-300">Parcela {installment.number}</p>
                      </div>

                      <span
                        className={`self-start px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(
                          installment.status
                        )}`}
                      >
                        {getStatusIcon(installment.status)}
                        {installment.status === 'parcial'
                          ? 'Parcial'
                          : installment.isOverdue
                            ? 'Vencida'
                            : 'Pendente'}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
                      <div>
                        <p className="text-lg font-bold text-white break-words">
                          {formatCurrency(installment.totalBalance)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Vencimento: {formatDate(installment.dueDate)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Parcela: {formatCurrency(installment.principalBalance)}
                        </p>
                        {installment.lateFeeBalance > 0 && (
                          <p className="text-xs text-red-400">
                            Juros por atraso: {formatCurrency(installment.lateFeeBalance)} (
                            {installment.daysLate} dias)
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleOpenPaymentModal(installment)}
                        className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
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

        <div className="bg-background-tertiary rounded-lg shadow overflow-hidden">
          <div className="p-4 sm:p-6 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-base sm:text-lg font-semibold text-white">
                Histórico de Transações
              </h2>
              <div className="w-full sm:w-auto">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full sm:w-auto bg-background-primary px-3 py-2 text-sm border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent"
                >
                  <option value="all">Todas</option>
                  <option value="entrada">Entradas</option>
                  <option value="saida">Saídas</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 max-h-96 overflow-y-auto">
            {filteredTransactions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhuma transação registrada</p>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-3 bg-surface-dark rounded-lg hover:bg-surface-medium transition min-w-0"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`p-2 rounded flex-shrink-0 ${
                            transaction.type === 'entrada' ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        >
                          {transaction.type === 'entrada' ? (
                            <TrendingUp className="w-4 h-4 text-white" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(transaction.date)} • {transaction.category}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-sm sm:text-base font-semibold self-start sm:self-auto ${
                          transaction.type === 'entrada' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'entrada' ? '+' : '-'}
                        {formatCurrency(transaction.value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-background-tertiary rounded-lg shadow overflow-hidden">
        <div className="p-4 sm:p-6 border-b">
          <h2 className="text-base sm:text-lg font-semibold text-white">Todas as Transações</h2>
        </div>
        <div className="space-y-3 p-4 md:hidden">
          {filteredTransactions.length === 0 ? (
            <p className="py-8 text-center text-gray-500">Nenhuma transação registrada</p>
          ) : (
            filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="space-y-3 rounded-lg bg-surface-dark p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium text-white">
                      {transaction.description}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{formatDate(transaction.date)}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                      transaction.type === 'entrada'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {transaction.type === 'entrada' ? 'Entrada' : 'Saída'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-xs uppercase text-gray-500">Categoria</p>
                    <p className="break-words capitalize text-gray-300">{transaction.category}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase text-gray-500">Método</p>
                    <p className="break-words capitalize text-gray-300">
                      {transaction.paymentMethod}
                    </p>
                  </div>
                </div>
                <div className="border-t border-surface-medium pt-3">
                  <p className="text-xs uppercase text-gray-500">Valor</p>
                  <p
                    className={`text-base font-semibold ${
                      transaction.type === 'entrada' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'entrada' ? '+' : '-'}
                    {formatCurrency(transaction.value)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="hidden max-w-full overflow-x-auto md:block">
          <table className="w-full min-w-[700px]">
            <thead className="bg-surface-dark">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Data
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Categoria
                </th>
                <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Método
                </th>
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-dark">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-surface-dark">
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-white whitespace-nowrap">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span
                      className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-full ${
                        transaction.type === 'entrada'
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {transaction.type === 'entrada' ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-white max-w-[200px] truncate">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300 capitalize">
                    {transaction.category}
                  </td>
                  <td className="hidden lg:table-cell px-6 py-4 text-sm text-gray-300 capitalize">
                    {transaction.paymentMethod}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-right whitespace-nowrap">
                    <span
                      className={`font-semibold ${
                        transaction.type === 'entrada' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'entrada' ? '+' : '-'}
                      {formatCurrency(transaction.value)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showPaymentModal && selectedInstallment && selectedInstallmentDetails && (
        <Modal title="Registrar Pagamento" onClose={handleCloseModal}>
          <form onSubmit={handleSubmitPayment} className="space-y-4">
            <div className="bg-dark-500/10 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-white font-medium mb-2">Informações da Parcela</p>
              <div className="space-y-1 text-sm text-dark-200">
                <p>
                  <span className="font-medium">Cliente:</span>{' '}
                  {selectedInstallmentDetails.contract?.clientName}
                </p>
                <p>
                  <span className="font-medium">Parcela:</span> {selectedInstallmentDetails.number}
                </p>
                <p>
                  <span className="font-medium">Saldo da parcela:</span>{' '}
                  {formatCurrency(selectedInstallmentDetails.principalBalance)}
                </p>
                <p>
                  <span className="font-medium">Juros diários:</span>{' '}
                  {formatCurrency(selectedInstallmentDetails.lateFeeBalance)}
                </p>
                <p>
                  <span className="font-medium">Total em aberto:</span>{' '}
                  {formatCurrency(selectedInstallmentDetails.totalBalance)}
                </p>
                <p>
                  <span className="font-medium">Vencimento:</span>{' '}
                  {formatDate(selectedInstallmentDetails.dueDate)}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-200">Tipo de baixa *</label>
              <div className="grid grid-cols-1 gap-3">
                {PAYMENT_TYPE_OPTIONS.map((option) => {
                  const optionAmount = getPaymentTypeAmount(
                    selectedInstallment,
                    option.value,
                    paymentData.paidDate
                  )
                  const disabled = optionAmount <= 0

                  return (
                    <label
                      key={option.value}
                      className={`rounded-lg border p-3 transition ${
                        paymentData.paymentType === option.value
                          ? 'border-dark-500 bg-dark-500/10'
                          : 'border-surface-medium bg-background-tertiary'
                      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <input
                        type="radio"
                        name="paymentType"
                        value={option.value}
                        checked={paymentData.paymentType === option.value}
                        onChange={handlePaymentChange}
                        disabled={disabled}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">{option.label}</p>
                          <p className="text-xs text-gray-400">{option.description}</p>
                        </div>
                        <span className="text-sm font-semibold text-green-400">
                          {formatCurrency(optionAmount)}
                        </span>
                      </div>
                    </label>
                  )
                })}
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
                  max={selectedPaymentLimit}
                  className="w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent bg-background-tertiary"
                  required
                />
                <p className="mt-2 text-xs text-gray-500">
                  Máximo para esta opção: {formatCurrency(selectedPaymentLimit)}
                </p>
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
                  className="w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent bg-background-tertiary"
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
                  className="w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent bg-background-tertiary"
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
                <label className="block text-sm font-medium text-gray-200 mb-2">Observações</label>
                <textarea
                  name="notes"
                  value={paymentData.notes}
                  onChange={handlePaymentChange}
                  rows="3"
                  placeholder="Informações adicionais sobre o pagamento..."
                  className="w-full px-4 py-2 border border-surface-medium rounded-lg focus:ring-2 focus:ring-dark-500 focus:border-transparent bg-background-tertiary"
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
                disabled={submitting || selectedPaymentLimit <= 0}
              >
                {submitting ? 'Processando...' : 'Confirmar Pagamento'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default Financial
