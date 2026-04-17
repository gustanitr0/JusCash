import React, { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FileText,
  DollarSign,
  Calendar,
  TrendingUp,
} from 'lucide-react'
import {
  clientsService,
  contractsService,
  installmentsService,
  transactionsService,
} from '../../services/FirebaseServices'
import { useAuth } from '../../contexts/auth'
import Modal from '../../components/Modal/Modal'
import LoanSimulator from '../../components/LoanSimulator'
import {
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
    label: 'Juros diÃ¡rios',
    description: 'Paga somente os juros acumulados por atraso.',
  },
  {
    value: 'total',
    label: 'Valor total',
    description: 'Quita principal e juros acumulados.',
  },
]

const Contracts = () => {
  const { user } = useAuth()
  const [contracts, setContracts] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedContract, setSelectedContract] = useState(null)
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    description: '',
    value: '', // Valor total
    interestRate: '', // Taxa de juros (%)
    type: 'parcelado',
    interestType: 'simples', // simples, composto
    installments: '1', // NÃºmero de parcelas
    totalInterest: 0, // Juros total (calculado)
    installmentValue: 0, // Valor da parcela (calculado)
    totalReceivable: 0, // Total a receber (calculado)
    lateFeeEnabled: false, // Juros diÃ¡rio por atraso
    lateFeeRate: '', // Taxa de juros diÃ¡rio (%)
    startDate: new Date().toISOString().split('T')[0], // Data do contrato
    firstInstallmentDate: new Date().toISOString().split('T')[0], // Data da primeira parcela
    frequency: 'mensal',
    status: 'ativo',
  })
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('form')
  const [installments, setInstallments] = useState([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedContractForAction, setSelectedContractForAction] = useState(null)
  const [selectedInstallmentId, setSelectedInstallmentId] = useState('')
  const [paymentData, setPaymentData] = useState({
    paymentType: 'total',
    paidValue: '',
    paidDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'pix',
  })

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
        console.error('user.uid nÃ£o disponivel')
        return
      }

      const [contractsData, clientsData, installmentsData] = await Promise.all([
        contractsService.getAll(user.uid),
        clientsService.getAll(user.uid),
        installmentsService.getAll(user.uid),
      ])
      setContracts(contractsData)
      setClients(clientsData)
      setInstallments(installmentsData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      alert('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (contract = null) => {
    if (contract) {
      setSelectedContract(contract)
      setFormData({
        clientId: contract.clientId,
        clientName: contract.clientName,
        description: contract.description,
        value: contract.value.toString(),
        type: contract.type,
        installments: contract.installments?.toString() || '1',
        frequency: contract.frequency || 'mensal',
        startDate: contract.startDate,
        status: contract.status,
      })
    } else {
      setSelectedContract(null)
      setFormData({
        clientId: '',
        clientName: '',
        description: '',
        value: '',
        type: 'unico',
        installments: '1',
        frequency: 'mensal',
        startDate: new Date().toISOString().split('T')[0],
        status: 'ativo',
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedContract(null)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    if (name === 'clientId') {
      const selectedClient = clients.find((c) => c.id === value)
      setFormData((prev) => ({
        ...prev,
        clientId: value,
        clientName: selectedClient?.name || '',
      }))
    } else if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const generateInstallments = async (contractId, contractData) => {
    const numInstallments = parseInt(formData.installments)
    const installmentValue = parseFloat(formData.value) / numInstallments
    const startDate = new Date(formData.startDate)

    const frequencyDays = {
      diaria: 1,
      semanal: 7,
      quinzenal: 15,
      mensal: 30,
      trimestral: 90,
    }

    const daysToAdd = frequencyDays[formData.frequency] || 30

    for (let i = 0; i < numInstallments; i++) {
      const dueDate = new Date(startDate)
      dueDate.setDate(dueDate.getDate() + daysToAdd * i)

      await installmentsService.add(user.uid, {
        contractId: contractId,
        number: i + 1,
        value: installmentValue,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'pendente',
      })
    }
  }

  // FunÃ§Ã£o para calcular juros simples
  const calculateSimpleInterest = (principal, rate, periods) => {
    return principal * (rate / 100) * periods
  }

  // FunÃ§Ã£o para calcular juros compostos
  const calculateCompoundInterest = (principal, rate, periods) => {
    return principal * (Math.pow(1 + rate / 100, periods) - 1)
  }

  // FunÃ§Ã£o para calcular todos os valores financeiros
  const calculateFinancialValues = (value, interestRate, installments, interestType) => {
    const principal = parseFloat(value) || 0
    const rate = parseFloat(interestRate) || 0
    const periods = parseInt(installments) || 1

    if (principal === 0 || periods === 0) {
      return {
        totalInterest: 0,
        installmentValue: 0,
        totalReceivable: 0,
      }
    }

    let totalInterest = 0
    let totalReceivable = 0
    let installmentValue = 0

    if (interestType === 'simples') {
      // Juros Simples: J = P * i * n
      totalInterest = calculateSimpleInterest(principal, rate, periods)
      totalReceivable = principal + totalInterest
      installmentValue = totalReceivable / periods
    } else {
      // Juros Compostos: M = P * (1 + i)^n
      totalReceivable = principal * Math.pow(1 + rate / 100, periods)
      totalInterest = totalReceivable - principal
      installmentValue = totalReceivable / periods
    }

    return {
      totalInterest: parseFloat(totalInterest.toFixed(2)),
      installmentValue: parseFloat(installmentValue.toFixed(2)),
      totalReceivable: parseFloat(totalReceivable.toFixed(2)),
    }
  }

  // useEffect para recalcular automaticamente quando os campos mudarem
  useEffect(() => {
    if (formData.value && formData.interestRate && formData.installments) {
      const calculations = calculateFinancialValues(
        formData.value,
        formData.interestRate,
        formData.installments,
        formData.interestType
      )

      setFormData((prev) => ({
        ...prev,
        totalInterest: calculations.totalInterest,
        installmentValue: calculations.installmentValue,
        totalReceivable: calculations.totalReceivable,
      }))
    }
  }, [formData.value, formData.interestRate, formData.installments, formData.interestType])

  const generateInstallmentsWithInterest = async (contractId, contractData) => {
    const numInstallments = parseInt(contractData.installments)
    const installmentValue = contractData.installmentValue
    const startDate = new Date(contractData.firstInstallmentDate)

    const frequencyDays = {
      diaria: 1,
      semanal: 7,
      quinzenal: 15,
      mensal: 30,
      trimestral: 90,
    }

    const daysToAdd = frequencyDays[contractData.frequency] || 30

    for (let i = 0; i < numInstallments; i++) {
      const dueDate = new Date(startDate)
      dueDate.setDate(dueDate.getDate() + daysToAdd * i)

      await installmentsService.add(user.uid, {
        contractId: contractId,
        number: i + 1,
        value: installmentValue,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'pendente',
        lateFeeRate: contractData.lateFeeEnabled ? contractData.lateFeeRate : 0,
        lateFeeEnabled: contractData.lateFeeEnabled,
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const value = parseFloat(formData.value)
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
        lateFeeRate: formData.lateFeeEnabled ? parseFloat(formData.lateFeeRate) : 0,
        // Controle de pagamento
        paid: 0,
        pending: formData.totalReceivable,
        createdBy: user.uid,
      }

      if (selectedContract) {
        await contractsService.update(user.uid, selectedContract.id, contractData)
        alert('EmprÃ©stimo atualizado com sucesso!')
      } else {
        const newContract = await contractsService.add(user.uid, contractData)

        // Gerar parcelas automaticamente com valores corretos
        await generateInstallmentsWithInterest(newContract.id, contractData)

        alert('EmprÃ©stimo cadastrado com sucesso!')
      }

      handleCloseModal()
      loadData()
    } catch (error) {
      console.error('Erro ao salvar emprÃ©stimo:', error)
      alert('Erro ao salvar emprÃ©stimo')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir este emprÃ©stimo?')) return

    try {
      await contractsService.delete(user.uid, id)
      alert('emprÃ©stimo excluÃ­do com sucesso!')
      loadData()
    } catch (error) {
      console.error('Erro ao excluir emprÃ©stimo:', error)
      alert('Erro ao excluir emprÃ©stimo')
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const getContractInstallments = (contractId) =>
    installments.filter((installment) => installment.contractId === contractId)

  const getContractPendingAmount = (contractId) =>
    getPendingInstallmentsTotal(getContractInstallments(contractId))

  const getContractCurrentTotal = (contract) =>
    Number(((contract.paid || 0) + getContractPendingAmount(contract.id)).toFixed(2))

  const getStatusColor = (status) => {
    const colors = {
      ativo: 'bg-green-500 text-white',
      concluido: 'bg-dark-500 text-white',
      cancelado: 'bg-red-500 text-white',
    }
    return colors[status] || 'bg-surface-medium text-gray-800'
  }

  const getTypeLabel = (type) => {
    const labels = {
      unico: 'Pagamento Ãšnico',
      parcelado: 'Parcelado',
      recorrente: 'Recorrente',
    }
    return labels[type] || type
  }

  const getInstallmentDetails = (installment, referenceDate = new Date()) => {
    if (!installment) return null

    const { principalBalance, lateFeeBalance, totalBalance } = getInstallmentPaymentBreakdown(
      installment,
      referenceDate
    )

    return {
      ...installment,
      principalBalance,
      lateFeeBalance,
      totalBalance,
    }
  }

  const getSelectedInstallment = () =>
    installments.find((installment) => installment.id === selectedInstallmentId)

  const getSelectedInstallmentDetails = () =>
    getInstallmentDetails(getSelectedInstallment(), paymentData.paidDate)

  const getPaymentTypeAmount = (installment, paymentType, referenceDate = paymentData.paidDate) => {
    const details = getInstallmentDetails(installment, referenceDate)

    if (!details) return 0
    if (paymentType === 'interest') return details.lateFeeBalance
    if (paymentType === 'installment') return details.principalBalance
    return details.totalBalance
  }

  const handleOpenPaymentModal = (contract) => {
    const contractInstallments = getContractInstallments(contract.id)
      .filter((installment) => installment.status !== 'pago')
      .sort((a, b) => a.number - b.number)
    const firstInstallment = contractInstallments[0]
    const today = new Date().toISOString().split('T')[0]
    const firstDetails = getInstallmentDetails(firstInstallment, today)
    const paymentType = firstDetails?.lateFeeBalance > 0 ? 'total' : 'installment'

    setSelectedContractForAction(contract)
    setSelectedInstallmentId(firstInstallment?.id || '')
    setPaymentData({
      paymentType,
      paidValue: firstInstallment
        ? getPaymentTypeAmount(firstInstallment, paymentType, today).toFixed(2)
        : '',
      paidDate: today,
      paymentMethod: 'pix',
    })
    setShowPaymentModal(true)
  }

  // Ver histÃ³rico de pagamentos
  const handleViewHistory = (contract) => {
    setSelectedContractForAction(contract)
    setShowHistoryModal(true)
  }

  const handlePaymentChange = (e) => {
    const { name, value } = e.target
    setPaymentData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  useEffect(() => {
    const selectedInstallment = getSelectedInstallment()

    if (!selectedInstallment || !showPaymentModal) return

    const amount = getPaymentTypeAmount(
      selectedInstallment,
      paymentData.paymentType,
      paymentData.paidDate
    )

    setPaymentData((prev) => ({
      ...prev,
      paidValue: amount > 0 ? amount.toFixed(2) : '',
    }))
  }, [selectedInstallmentId, paymentData.paymentType, paymentData.paidDate, showPaymentModal])

  const applyPaymentToInstallment = (installment, paidValue, paymentType, paidDate) => {
    const details = getInstallmentDetails(installment, paidDate)

    if (!details) {
      throw new Error('Selecione uma parcela vÃ¡lida.')
    }

    const maxAllowed = getPaymentTypeAmount(installment, paymentType, paidDate)

    if (!paidValue || paidValue <= 0) {
      throw new Error('Informe um valor vÃ¡lido para o pagamento.')
    }

    if (paidValue > maxAllowed) {
      throw new Error('O valor informado Ã© maior do que o permitido para a opÃ§Ã£o selecionada.')
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

  const paymentAmount = paymentData.paidValue

  // Processar pagamento
  const handleProcessPayment = async (e) => {
    e.preventDefault()

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('Informe um valor vÃ¡lido')
      return
    }

    try {
      const selectedInstallment = getSelectedInstallment()
      const amount = parseFloat(paymentData.paidValue)
      const contract = selectedContractForAction
      const updatedInstallment = applyPaymentToInstallment(
        selectedInstallment,
        amount,
        paymentData.paymentType,
        paymentData.paidDate
      )
      const updatedInstallments = installments.map((installment) =>
        installment.id === selectedInstallment.id ? updatedInstallment : installment
      )
      const contractInstallments = updatedInstallments.filter(
        (installment) => installment.contractId === contract.id
      )
      const newPaid = Number(((contract.paid || 0) + amount).toFixed(2))
      const newPending = getPendingInstallmentsTotal(contractInstallments, paymentData.paidDate)

      await installmentsService.update(user.uid, selectedInstallment.id, updatedInstallment)

      await contractsService.update(user.uid, contract.id, {
        ...contract,
        paid: newPaid,
        pending: newPending,
        status: newPending <= 0 ? 'concluido' : contract.status,
      })

      // Registrar transaÃ§Ã£o
      await transactionsService.add(user.uid, {
        type: 'entrada',
        description: `Parcela ${selectedInstallment.number} - ${contract.clientName}`,
        value: amount,
        date: paymentData.paidDate,
        category: 'honorario',
        paymentMethod: paymentData.paymentMethod,
        createdBy: user.uid,
      })

      alert('Pagamento registrado com sucesso!')
      setShowPaymentModal(false)
      setSelectedInstallmentId('')
      loadData()
    } catch (error) {
      console.error('Erro ao processar pagamento:', error)
      alert(error.message || 'Erro ao processar pagamento')
    }
  }

  const paymentContractInstallments = selectedContractForAction
    ? getContractInstallments(selectedContractForAction.id)
        .filter((installment) => installment.status !== 'pago')
        .sort((a, b) => a.number - b.number)
    : []
  const selectedInstallmentDetails = getSelectedInstallmentDetails()
  const selectedPaymentLimit = getPaymentTypeAmount(
    getSelectedInstallment(),
    paymentData.paymentType,
    paymentData.paidDate
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-dark-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Carregando emprÃ©stimos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">EmprÃ©stimos</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-dark-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-dark-700 transition"
        >
          <Plus className="w-5 h-5" />
          Novo EmprÃ©stimo
        </button>
      </div>

      {contracts.length === 0 ? (
        <div className="bg-background-tertiary rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-300 text-lg mb-2">Nenhum emprÃ©stimo cadastrado</p>
          <p className="text-gray-500 text-sm mb-6">Comece criando seu primeiro emprÃ©stimo</p>
          <button
            onClick={() => handleOpenModal()}
            className="bg-dark-600 text-white px-6 py-2 rounded-lg hover:bg-dark-700 transition"
          >
            Criar emprÃ©stimo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {contracts.map((contract) => {
            // Calcular informaÃ§Ãµes adicionais
            const profit = contract.totalInterest || 0
            const contractInstallments = getContractInstallments(contract.id)
            const paidInstallments = contractInstallments.filter((i) => i.status === 'pago').length
            const totalInstallments = contract.installments || 0
            const currentPending = getContractPendingAmount(contract.id)
            const currentTotalReceivable = getContractCurrentTotal(contract)
            const progressBase =
              currentTotalReceivable > 0 ? currentTotalReceivable : contract.value || 1
            const nextDueDate = contractInstallments
              .filter((i) => i.status === 'pendente')
              .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0]?.dueDate

            return (
              <div
                key={contract.id}
                className="bg-background-tertiary rounded-lg shadow-lg hover:shadow-xl transition-all border border-surface-dark overflow-hidden"
              >
                {/* Header do Card */}
                <div className="bg-gradient-to-r from-dark-600/20 to-dark-500/20 p-4 border-b border-surface-dark">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg mb-1">{contract.clientName}</h3>
                      <p className="text-sm text-gray-400 line-clamp-1">
                        {contract.description || 'EmprÃ©stimo'}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(contract.status)}`}
                    >
                      {contract.status}
                    </span>
                  </div>

                  {/* Badges de InformaÃ§Ã£o */}
                  <div className="flex items-center gap-2 mt-3">
                    <span className="px-2 py-1 bg-surface-dark text-gray-300 text-xs rounded flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {getTypeLabel(contract.type)}
                    </span>
                    {contract.type !== 'unico' && (
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
                        {formatCurrency(currentTotalReceivable)}
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
                      <p className="text-lg font-bold text-yellow-400">{formatCurrency(profit)}</p>
                    </div>

                    {/* PrÃ³ximo Vencimento */}
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-gray-400 uppercase tracking-wide">
                          Vencimento
                        </span>
                      </div>
                      <p className="text-sm font-bold text-purple-400">
                        {nextDueDate
                          ? new Date(nextDueDate).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                            })
                          : 'Quitado'}
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
                        {formatCurrency(currentPending)}
                      </p>
                    </div>
                  </div>

                  {/* Barra de Progresso Geral */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Progresso Geral</span>
                      <span className="text-xs font-bold text-white">
                        {Math.round(((contract.paid || 0) / progressBase) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-surface-medium rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all shadow-lg"
                        style={{
                          width: `${((contract.paid || 0) / progressBase) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer com BotÃµes de AÃ§Ã£o */}
                <div className="p-4 bg-surface-dark/50 border-t border-surface-dark">
                  <div className="flex justify-center gap-2 mb-3">
                    <button
                      onClick={() => handleOpenPaymentModal(contract)}
                      className="px-3 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white text-sm font-medium rounded-lg hover:from-green-500 hover:to-green-400 transition-all shadow-lg hover:shadow-green-500/20 flex items-center justify-center gap-2"
                    >
                      <DollarSign className="w-4 h-4" />
                      Registrar Pagamento
                    </button>

                    {/*<button
                      onClick={() => handlePayInterestOnly(contract)}
                      className="px-3 py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white text-sm font-medium rounded-lg hover:from-yellow-500 hover:to-yellow-400 transition-all shadow-lg hover:shadow-yellow-500/20 flex items-center justify-center gap-2"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Pagar Juros
                    </button> */}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleViewHistory(contract)}
                      className="px-3 py-2 border border-surface-medium text-gray-300 text-xs font-medium rounded-lg hover:bg-surface-medium transition-all flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      HistÃ³rico
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
            )
          })}
        </div>
      )}

      {/* Modal de Cadastro/EdiÃ§Ã£o */}
      {showModal && (
        <Modal
          title={selectedContract ? 'Editar EmprÃ©stimo' : 'Novo EmprÃ©stimo'}
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
              FormulÃ¡rio
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
              SimulaÃ§Ã£o
              {(!formData.value || !formData.interestRate || !formData.installments) && (
                <span className="ml-2 px-2 py-0.5 bg-gray-600 text-gray-300 text-xs rounded">
                  Preencha o formulÃ¡rio
                </span>
              )}
            </button>
          </div>

          {/* ConteÃºdo das Tabs */}
          {activeTab === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* SeÃ§Ã£o 1: Dados BÃ¡sicos */}
              <div className="bg-surface-dark p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-dark-400 mb-4 uppercase tracking-wide">
                  Dados BÃ¡sicos
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
                      DescriÃ§Ã£o do EmprÃ©stimo
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="2"
                      placeholder="Ex: EmprÃ©stimo pessoal, Capital de giro..."
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

              {/* SeÃ§Ã£o 2: Valores e Juros */}
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
                      NÃºmero de Parcelas *
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
                      FrequÃªncia *
                    </label>
                    <select
                      name="frequency"
                      value={formData.frequency}
                      onChange={handleChange}
                      className="input-dark w-full"
                      required
                    >
                      <option value="diaria">DiÃ¡ria</option>
                      <option value="semanal">Semanal</option>
                      <option value="quinzenal">Quinzenal</option>
                      <option value="mensal">Mensal</option>
                      <option value="trimestral">Trimestral</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status *</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="input-dark w-full"
                      required
                    >
                      <option value="ativo">Ativo</option>
                      <option value="concluido">ConcluÃ­do</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SeÃ§Ã£o 3: Valores Calculados */}
              <div className="bg-gradient-to-br from-dark-600/20 to-dark-500/20 border border-dark-500/30 p-6 rounded-lg">
                <h3 className="text-sm font-semibold text-dark-400 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  CÃ¡lculos AutomÃ¡ticos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-surface-dark p-4 rounded-lg">
                    <label className="block text-xs text-gray-400 mb-1">Juros Total</label>
                    <p className="text-2xl font-bold text-yellow-400">
                      {formatCurrency(formData.totalInterest)}
                    </p>
                  </div>

                  <div className="bg-surface-dark p-4 rounded-lg">
                    <label className="block text-xs text-gray-400 mb-1">Valor da Parcela</label>
                    <p className="text-2xl font-bold text-dark-400">
                      {formatCurrency(formData.installmentValue)}
                    </p>
                  </div>

                  <div className="bg-surface-dark p-4 rounded-lg">
                    <label className="block text-xs text-gray-400 mb-1">Total a Receber</label>
                    <p className="text-2xl font-bold text-green-400">
                      {formatCurrency(formData.totalReceivable)}
                    </p>
                  </div>
                </div>

                {/* FÃ³rmula explicativa */}
                <div className="mt-4 p-3 bg-surface-dark/50 rounded border border-surface-medium">
                  <p className="text-xs text-gray-400">
                    <span className="font-semibold text-gray-300">FÃ³rmula usada:</span>{' '}
                    {formData.interestType === 'simples' ? (
                      <>Juros Simples - J = P Ã— i Ã— n | M = P + J</>
                    ) : (
                      <>Juros Compostos - M = P Ã— (1 + i)^n</>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    P = Principal ({formatCurrency(parseFloat(formData.value) || 0)}), i = Taxa (
                    {formData.interestRate}%), n = Parcelas ({formData.installments})
                  </p>
                </div>
              </div>

              {/* SeÃ§Ã£o 4: Juros por Atraso */}
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
                      Aplicar juros diÃ¡rios em caso de atraso
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Ativa a cobranÃ§a de juros adicionais sobre parcelas vencidas
                    </p>
                  </div>
                </div>

                {formData.lateFeeEnabled && (
                  <div className="mt-4 pl-7 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Taxa de Juros DiÃ¡rio (%) *
                    </label>
                    <input
                      type="number"
                      name="lateFeeRate"
                      value={formData.lateFeeRate}
                      onChange={handleChange}
                      placeholder="Ex: 0.033 (equivale a 1% ao mÃªs)"
                      step="0.001"
                      min="0"
                      className="input-dark w-full md:w-64"
                      required={formData.lateFeeEnabled}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      ðŸ’¡ Dica: 1% ao mÃªs â‰ˆ 0.033% ao dia
                    </p>
                  </div>
                )}
              </div>

              {/* BotÃµes de AÃ§Ã£o */}
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
                  Ver SimulaÃ§Ã£o
                </button>

                <button type="submit" className="btn-primary-dark flex-1" disabled={submitting}>
                  {submitting
                    ? 'Salvando...'
                    : selectedContract
                      ? 'Atualizar EmprÃ©stimo'
                      : 'Criar EmprÃ©stimo'}
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

              {/* BotÃµes de AÃ§Ã£o */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-surface-dark">
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  className="btn-secondary-dark flex-1"
                >
                  Voltar ao FormulÃ¡rio
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  className="btn-primary-dark flex-1"
                  disabled={submitting}
                >
                  {submitting ? 'Salvando...' : 'Confirmar e Criar EmprÃ©stimo'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Modal de Pagamento */}
      {showPaymentModal && selectedContractForAction && (
        <Modal
          title="Registrar Pagamento"
          onClose={() => setShowPaymentModal(false)}
          size="default"
        >
          <form onSubmit={handleProcessPayment} className="space-y-4">
            <div className="bg-dark-500/10 border border-dark-500/30 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Empréstimo para:</p>
              <p className="text-lg font-bold text-white">
                {selectedContractForAction?.clientName}
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-500">Total a Receber</p>
                  <p className="text-base font-bold text-green-400">
                    {formatCurrency(
                      selectedContractForAction
                        ? getContractCurrentTotal(selectedContractForAction)
                        : 0
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pendente</p>
                  <p className="text-base font-bold text-orange-400">
                    {formatCurrency(
                      selectedContractForAction
                        ? getContractPendingAmount(selectedContractForAction.id)
                        : 0
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Parcela *</label>
              <select
                value={selectedInstallmentId}
                onChange={(e) => setSelectedInstallmentId(e.target.value)}
                className="input-dark w-full"
                required
              >
                <option value="">Selecione uma parcela</option>
                {paymentContractInstallments.map((installment) => {
                  const details = getInstallmentDetails(installment, paymentData.paidDate)

                  return (
                    <option key={installment.id} value={installment.id}>
                      Parcela {installment.number} - {formatCurrency(details?.totalBalance || 0)}
                    </option>
                  )
                })}
              </select>
            </div>

            {selectedInstallmentDetails && (
              <>
                <div className="bg-surface-dark rounded-lg p-4 border border-surface-medium">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Saldo da parcela</p>
                      <p className="font-semibold text-white">
                        {formatCurrency(selectedInstallmentDetails.principalBalance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Juros diários</p>
                      <p className="font-semibold text-yellow-400">
                        {formatCurrency(selectedInstallmentDetails.lateFeeBalance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total em aberto</p>
                      <p className="font-semibold text-green-400">
                        {formatCurrency(selectedInstallmentDetails.totalBalance)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">
                    Tipo de pagamento *
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {PAYMENT_TYPE_OPTIONS.map((option) => {
                      const optionAmount = getPaymentTypeAmount(
                        getSelectedInstallment(),
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
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Valor do Pagamento (R$) *
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
                  className="input-dark w-full"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Máximo: {formatCurrency(selectedPaymentLimit)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data do Pagamento *
                </label>
                <input
                  type="date"
                  name="paidDate"
                  value={paymentData.paidDate}
                  onChange={handlePaymentChange}
                  className="input-dark w-full"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Método de Pagamento *
                </label>
                <select
                  name="paymentMethod"
                  value={paymentData.paymentMethod}
                  onChange={handlePaymentChange}
                  className="input-dark w-full"
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
                onClick={() => setShowPaymentModal(false)}
                className="btn-secondary-dark flex-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary-dark flex-1"
                disabled={!selectedInstallmentId || selectedPaymentLimit <= 0}
              >
                Confirmar Pagamento
              </button>
            </div>
          </form>
        </Modal>
      )}
      {/* Modal de HistÃ³rico */}
      {showHistoryModal && (
        <Modal
          title="HistÃ³rico de Pagamentos"
          onClose={() => setShowHistoryModal(false)}
          size="large"
        >
          <div className="space-y-4">
            <div className="bg-dark-500/10 border border-dark-500/30 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">EmprÃ©stimo de:</p>
              <p className="text-lg font-bold text-white">
                {selectedContractForAction?.clientName}
              </p>
            </div>

            <div className="space-y-3">
              {installments
                .filter((i) => i.contractId === selectedContractForAction?.id)
                .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
                .map((inst) => (
                  <div
                    key={inst.id}
                    className="bg-surface-dark p-4 rounded-lg border border-surface-medium"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Parcela {inst.number}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Vencimento: {new Date(inst.dueDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-white">
                          {formatCurrency(getInstallmentDetails(inst)?.totalBalance || 0)}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            inst.status === 'pago'
                              ? 'bg-green-500/20 text-green-400'
                              : inst.status === 'vencido'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
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
  )
}

export default Contracts
