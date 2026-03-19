/**
 * Utilitários Multi-Tenant para Micro-SaaS de Academias
 *
 * Fornece funções para:
 * - Obter contexto do tenant (academia) atual
 * - Verificar permissões por role
 * - Filtrar consultas por academia
 */

import { auth } from "@/services/auth"
import { prisma } from "@/lib/prisma"
import { cache } from "react"

// Exportar prisma para compatibilidade com código legado
export { prisma }

export type UserRole = 'SUPER_ADMIN' | 'GYM_ADMIN' | 'USER'

export interface TenantContext {
  userId: string
  userRole: UserRole
  gymId?: string
  gymName?: string
  gymRole?: UserRole
  isSuperAdmin: boolean
  isGymAdmin: boolean
  gyms: Array<{
    gymId: string
    gymName: string
    role: UserRole
    status: string
    plan: string
    isActive: boolean
  }>
}

/**
 * Obtém o contexto do tenant atual baseado na sessão do usuário
 * Usa cache para evitar múltiplas consultas no mesmo render
 */
export const getTenantContext = cache(async (): Promise<TenantContext | null> => {
  try {
    const session = await auth()

    if (!session?.user) {
      return null
    }

    const user = session.user as any

    // Super Admin vê tudo
    const isSuperAdmin = user.role === 'SUPER_ADMIN'
    const isGymAdmin = user.role === 'GYM_ADMIN' || user.activeGymRole === 'GYM_ADMIN'

    // Se não tiver activeGymId definido mas tiver academias, usa a primeira academia como padrão
    let activeGymId = user.activeGymId
    let activeGymRole = user.activeGymRole
    
    if (!activeGymId && user.gyms && user.gyms.length > 0) {
      // Pega a primeira academia onde o usuário é GYM_ADMIN, ou a primeira disponível
      const adminGym = user.gyms.find((g: any) => g.role === 'GYM_ADMIN')
      activeGymId = adminGym?.gymId || user.gyms[0]?.gymId
      activeGymRole = adminGym?.role || user.gyms[0]?.role
    }

    return {
      userId: user.id,
      userRole: user.role,
      gymId: activeGymId,
      gymName: user.gyms?.find((g: any) => g.gymId === activeGymId)?.gymName,
      gymRole: activeGymRole,
      isSuperAdmin,
      isGymAdmin,
      gyms: user.gyms || [],
    }
  } catch (error) {
    console.error('Erro ao obter contexto do tenant:', error)
    return null
  }
})

/**
 * Verifica se o usuário tem permissão para acessar um recurso
 */
export function hasPermission(
  context: TenantContext | null,
  requiredRole: UserRole | UserRole[]
): boolean {
  if (!context) return false
  
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  
  // Super Admin sempre tem permissão
  if (context.isSuperAdmin) return true
  
  // Verifica se tem uma das roles necessárias
  return roles.some(role => {
    if (role === 'SUPER_ADMIN') return false // Já tratado acima
    if (role === 'GYM_ADMIN') return context.isGymAdmin
    if (role === 'USER') return true
    return false
  })
}

/**
 * Aplica filtro de tenant em consultas Prisma
 * - Super Admin: sem filtro (vê tudo)
 * - Gym Admin / User: filtra pela academia atual
 */
export function applyTenantFilter<T extends Record<string, any>>(
  context: TenantContext | null,
  filter?: T
): T {
  // Super Admin não tem filtro
  if (context?.isSuperAdmin) {
    return filter || ({} as T)
  }
  
  // Outros usuários: filtra pela academia
  if (context?.gymId) {
    return {
      ...filter,
      gymId: context.gymId,
    } as unknown as T
  }
  
  return filter || ({} as T)
}

/**
 * Obtém o where clause do Prisma para filtrar por tenant
 */
export function getTenantWhereClause(
  context: TenantContext | null,
  baseWhere?: Record<string, any>
): Record<string, any> {
  // Super Admin vê tudo
  if (context?.isSuperAdmin) {
    return baseWhere || {}
  }
  
  // Outros usuários: filtra pela academia
  if (context?.gymId) {
    return {
      ...baseWhere,
      gymId: context.gymId,
    }
  }
  
  // Usuário sem academia: não vê nada
  return {
    gymId: undefined, // Nunca vai matchar
  }
}

/**
 * Verifica se o usuário pode acessar dados de uma academia específica
 */
export async function canAccessGym(
  userId: string,
  gymId: string,
  requiredRole?: UserRole
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      gyms: true,
    },
  })
  
  if (!user) return false
  
  // Super Admin acessa tudo
  if (user.role === 'SUPER_ADMIN') return true
  
  // Verifica se pertence à academia
  const userGym = user.gyms.find(ug => ug.gymId === gymId)
  
  if (!userGym) return false
  
  // Verifica role se necessário
  if (requiredRole) {
    if (requiredRole === 'SUPER_ADMIN') return false
    if (requiredRole === 'GYM_ADMIN') return userGym.role === 'GYM_ADMIN'
  }
  
  return true
}

/**
 * Lista de academias que o usuário pode acessar
 */
export async function getUserAccessibleGyms(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      gyms: {
        include: {
          gym: true,
        },
      },
    },
  })
  
  if (!user) return []
  
  // Super Admin vê todas as academias
  if (user.role === 'SUPER_ADMIN') {
    const allGyms = await prisma.gym.findMany({
      where: { isActive: true },
    })
    return allGyms.map(gym => ({
      gymId: gym.id,
      gymName: gym.name,
      role: 'SUPER_ADMIN' as UserRole,
      plan: gym.plan,
      isActive: gym.isActive,
    }))
  }
  
  // Outros usuários: apenas suas academias
  return user.gyms
    .filter(ug => ug.status === 'ACTIVE' && ug.gym.isActive)
    .map(ug => ({
      gymId: ug.gymId,
      gymName: ug.gym.name,
      role: ug.role as UserRole,
      plan: ug.gym.plan,
      isActive: ug.gym.isActive,
    }))
}

/**
 * Middleware para rotas API - obtém contexto e valida permissões
 */
export async function withTenantContext<T>(
  handler: (context: TenantContext) => Promise<T>,
  options?: {
    requireAuth?: boolean
    requireRole?: UserRole | UserRole[]
    requireGym?: boolean
  }
): Promise<T | Response> {
  const context = await getTenantContext()
  
  // Requer autenticação
  if (options?.requireAuth && !context) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    })
  }
  
  // Requer role específica
  if (options?.requireRole && context && !hasPermission(context, options.requireRole)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
    })
  }
  
  // Requer academia selecionada
  if (options?.requireGym && context && !context.gymId && !context.isSuperAdmin) {
    return new Response(JSON.stringify({ error: 'Gym selection required' }), {
      status: 400,
    })
  }
  
  if (!context) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    })
  }
  
  return handler(context)
}

/**
 * Hooks React para uso do contexto multi-tenant
 * Nota: Estes são wrappers para uso em componentes client-side
 */
