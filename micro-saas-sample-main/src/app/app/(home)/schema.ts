import { z } from "zod";

// Schemas for gym management system
export const upsertMemberSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Nome é obrigatório"),
    email: z.string().email("Email inválido"),
    phone: z.string().min(1, "Telefone é obrigatório"),
    plan: z.string().min(1, "Plano é obrigatório"),
    status: z.string().min(1, "Status é obrigatório"),
    lastVisit: z.string().optional(),
});

export const deleteMemberSchema = z.object({
    id: z.string(),
});