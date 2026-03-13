import { z } from 'zod'

export const installmentSchema = z.object({
  contractId: z.string().min(1).max(500),
  number: z.number().int().positive(),
  value: z.number().positive(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),

  status: z.enum(['pendente', 'pago', 'vencido', 'parcial']),

  lateFeeEnabled: z.boolean(),
  lateFeeRate: z.number().min(0),
})
