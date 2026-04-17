const MS_PER_DAY = 1000 * 60 * 60 * 24

const normalizeDate = (date) => {
  const normalizedDate = new Date(date)
  normalizedDate.setHours(0, 0, 0, 0)
  return normalizedDate
}

export const getDaysLate = (dueDate, referenceDate = new Date()) => {
  if (!dueDate) return 0

  const due = normalizeDate(dueDate)
  const reference = normalizeDate(referenceDate)
  const diff = reference.getTime() - due.getTime()

  if (diff <= 0) return 0

  return Math.floor(diff / MS_PER_DAY)
}

export const getInstallmentLateFee = (installment, referenceDate = new Date()) => {
  if (!installment?.lateFeeEnabled || installment?.status === 'pago') return 0

  const daysLate = getDaysLate(installment.dueDate, referenceDate)
  const lateFeeRate = Number(installment.lateFeeRate) || 0
  const baseValue = Number(installment.value) || 0
  const lateFeePaid = Number(installment.lateFeePaid) || 0

  if (daysLate <= 0 || lateFeeRate <= 0 || baseValue <= 0) return 0

  const accruedLateFee = Number((baseValue * (lateFeeRate / 100) * daysLate).toFixed(2))
  return Number(Math.max(0, accruedLateFee - lateFeePaid).toFixed(2))
}

export const getInstallmentPrincipalBalance = (installment) => {
  const baseValue = Number(installment?.value) || 0
  const principalPaid = Number(installment?.principalPaid) || 0
  return Number(Math.max(0, baseValue - principalPaid).toFixed(2))
}

export const getInstallmentPaymentBreakdown = (installment, referenceDate = new Date()) => {
  const principalBalance = getInstallmentPrincipalBalance(installment)
  const lateFeeBalance = getInstallmentLateFee(installment, referenceDate)

  return {
    principalBalance,
    lateFeeBalance,
    totalBalance: Number((principalBalance + lateFeeBalance).toFixed(2)),
  }
}

export const getInstallmentCurrentValue = (installment, referenceDate = new Date()) => {
  const { totalBalance } = getInstallmentPaymentBreakdown(installment, referenceDate)
  return totalBalance
}

export const getPendingInstallmentsTotal = (installments = [], referenceDate = new Date()) => {
  return Number(
    installments
      .filter((installment) => installment.status !== 'pago')
      .reduce((sum, installment) => sum + getInstallmentCurrentValue(installment, referenceDate), 0)
      .toFixed(2)
  )
}
