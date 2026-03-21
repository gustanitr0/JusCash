import { z } from 'zod'

export const transactionSchema = z.object({
  type: z.enum(['entrada', 'saida']),

  description: z.string().min(1).max(500),

  value: z.number().positive(),

  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),

  category: z.enum(['honorario', 'despesa', 'antecipacao', 'outros']),

  paymentMethod: z.enum(['pix', 'dinheiro', 'cartao', 'transferencia', 'boleto']),
})
