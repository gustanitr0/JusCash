import { z } from "zod"

export const clientSchema = z.object({
    name: z.string().min(1).max(100),
    email: z.email(),
    cpf: z.string().regex(/^\d{11}$/),
    rg: z.string().min(3).max(20),
    cep: z.string().regex(/^\d{8}$/)
})