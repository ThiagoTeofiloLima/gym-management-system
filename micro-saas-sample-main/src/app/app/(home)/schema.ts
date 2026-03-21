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
    planRenewalDate: z.string().optional(), // Data de renovação do plano
});

export const deleteMemberSchema = z.object({
    id: z.string(),
});

// Schema for ToDo
export const upsertToDoSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, "Title is required"),
    doneAt: z.string().datetime().nullable().optional(),
});