import { z } from 'zod'

export const contractSchema = z.object({
  clientId: z.string().min(1).max(500),
  clientName: z.string().min(1).max(500),
  value: z.number().positive(),
  interestRate: z.number().min(0),

  interestType: z.enum(['simples', 'composto']),

  type: z.enum(['unico', 'parcelado', 'recorrente']),

  installments: z.number().int().positive(),

  frequency: z.enum(['diaria', 'semanal', 'quinzenal', 'mensal', 'trimestral']),

  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  firstInstallmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  installmentValue: z.number().min(0),
  totalInterest: z.number().min(0),
  totalReceivable: z.number().min(0),
  paid: z.number().min(0),
  pending: z.number().min(0),

  status: z.enum(['ativo', 'concluido', 'cancelado']),

  lateFeeEnabled: z.boolean(),
  lateFeeRate: z.number().min(0),
})
