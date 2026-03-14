// Re-export do cliente Prisma para compatibilidade com código legado
// Este arquivo permite que imports antigos de '@/services/database' continuem funcionando
export { prisma } from '@/lib/prisma'
export type { PrismaClient } from '@prisma/client'
