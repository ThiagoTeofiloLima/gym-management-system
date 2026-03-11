import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Tipos para multi-tenancy
 */
export type UserRole = 'admin' | 'user'

export interface TenantContext {
  userId: string
  gymId: string | null
  role: UserRole
}

/**
 * Obtém o contexto do tenant a partir do ID do usuário
 * - Admins podem ver todos os dados (gymId = null)
 * - Usuários normais veem apenas dados da sua academia
 */
export async function getTenantContext(userId: string): Promise<TenantContext> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { gymId: true, role: true },
  })

  if (!user) {
    throw new Error(`Usuário não encontrado: ${userId}`)
  }

  return {
    userId,
    gymId: user.gymId,
    role: (user.role as UserRole) || 'user',
  }
}

/**
 * Cria um filtro para consultas Prisma baseado no contexto do tenant
 * - Admin: sem filtro (vê tudo)
 * - User: filtrado pelo gymId
 */
export function createTenantFilter<T extends { gymId?: string | null }>(
  context: TenantContext
): { gymId?: string | null } {
  // Admin pode ver todos os dados
  if (context.role === 'admin') {
    return {}
  }

  // Usuário vê apenas dados da sua academia
  return { gymId: context.gymId ?? undefined }
}

/**
 * Aplica filtro multi-tenant a uma consulta Prisma
 * Exemplo de uso:
 * 
 * const members = await prisma.member.findMany({
 *   where: applyTenantFilter(prisma, context, { status: 'Ativo' })
 * })
 */
export function applyTenantFilter<T extends Record<string, unknown>>(
  context: TenantContext,
  baseFilter?: T
): T & { gymId?: string | null } {
  const tenantFilter = createTenantFilter(context)
  
  if (!baseFilter) {
    return tenantFilter as T & { gymId?: string | null }
  }

  return {
    ...baseFilter,
    ...tenantFilter,
  } as T & { gymId?: string | null }
}

/**
 * Valida se o usuário pode acessar um recurso de uma academia específica
 */
export function canAccessGym(context: TenantContext, gymId: string | null): boolean {
  // Admin pode acessar tudo
  if (context.role === 'admin') {
    return true
  }

  // Usuário só pode acessar a própria academia
  return context.gymId === gymId
}

/**
 * Cria dados com contexto de tenant automático
 */
export function createWithTenant<T extends { gymId?: string | null }>(
  context: TenantContext,
  data: Omit<T, 'gymId'>
): T {
  // Admin cria dados na sua própria academia (se tiver uma)
  // ou sem academia específica
  const gymId = context.role === 'admin' && !context.gymId 
    ? undefined 
    : context.gymId

  return {
    ...data,
    gymId,
  } as T
}
