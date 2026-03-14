import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext } from '@/lib/multi-tenant'

/**
 * GET /api/dashboard
 * Retorna dados consolidados para o dashboard
 * 
 * REGRAS DE MULTI-TENANT:
 * - Super Admin: vê todas as academias consolidadas
 * - Gym Admin: vê APENAS suas academias (pode ter mais de uma)
 * - User: vê APENAS sua academia atual
 * 
 * NUNCA permite que um gerente veja dados de outras academias
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getTenantContext()

    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ============================================
    // ISOLAMENTO MULTI-TENANT ESTRITO
    // ============================================
    
    let gyms: any[]
    
    // Verifica se há um gymId específico na query string
    const url = new URL(request.url)
    const queryGymId = url.searchParams.get('gymId')
    
    if (context.isSuperAdmin) {
      // Super Admin pode ver todas ou filtrar por gymId específico
      if (queryGymId) {
        // Filtra por academia específica
        gyms = await prisma.gym.findMany({
          where: { id: queryGymId },
          include: {
            _count: {
              select: {
                users: true,
                members: true,
                trainers: true,
                workouts: true,
                expenses: true,
              },
            },
          },
        })
      } else {
        // Vê TODAS as academias
        gyms = await prisma.gym.findMany({
          include: {
            _count: {
              select: {
                users: true,
                members: true,
                trainers: true,
                workouts: true,
                expenses: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
      }
    } else if (context.gyms && context.gyms.length > 0) {
      // Gym Admin e User: vêem APENAS suas academias
      // Extrai os IDs das academias que o usuário pertence
      const gymIds = context.gyms
        .filter((g: any) => g.status === 'ACTIVE' && g.isActive)
        .map((g: any) => g.gymId)
      
      // Se houver queryGymId E pertence ao usuário, mostra apenas daquela
      // Caso contrário, mostra dados CONSOLIDADOS de todas as academias do usuário
      const filterGymIds = queryGymId && gymIds.includes(queryGymId)
        ? [queryGymId]
        : gymIds
      
      if (filterGymIds.length === 0) {
        // Usuário não tem academias ativas
        return NextResponse.json({
          gyms: [],
          stats: {
            totalGyms: 0,
            activeGyms: 0,
            inactiveGyms: 0,
            totalMembers: 0,
            totalUsers: 0,
            totalTrainers: 0,
            totalWorkouts: 0,
            totalExpenses: 0,
          },
          monthlyRevenue: 0,
          gymsByPlan: {},
          gymsByState: {},
          topGyms: [],
          recentGyms: [],
        })
      }
      
      // Busca APENAS as academias do usuário (pode ser uma ou várias)
      gyms = await prisma.gym.findMany({
        where: {
          id: { in: filterGymIds },
        },
        include: {
          _count: {
            select: {
              users: true,
              members: true,
              trainers: true,
              workouts: true,
              expenses: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    } else {
      // Usuário sem academias
      return NextResponse.json({
        gyms: [],
        stats: {
          totalGyms: 0,
          activeGyms: 0,
          inactiveGyms: 0,
          totalMembers: 0,
          totalUsers: 0,
          totalTrainers: 0,
          totalWorkouts: 0,
          totalExpenses: 0,
        },
        monthlyRevenue: 0,
        gymsByPlan: {},
        gymsByState: {},
        topGyms: [],
        recentGyms: [],
      })
    }

    // Calcular estatísticas consolidadas
    const stats = {
      totalGyms: gyms.length,
      activeGyms: gyms.filter((g: any) => g.isActive).length,
      inactiveGyms: gyms.filter((g: any) => !g.isActive).length,
      totalMembers: gyms.reduce((acc: number, g: any) => acc + g._count.members, 0),
      totalUsers: gyms.reduce((acc: number, g: any) => acc + g._count.users, 0),
      totalTrainers: gyms.reduce((acc: number, g: any) => acc + g._count.trainers, 0),
      totalWorkouts: gyms.reduce((acc: number, g: any) => acc + g._count.workouts, 0),
      totalExpenses: gyms.reduce((acc: number, g: any) => acc + g._count.expenses, 0),
    }

    // Calcular receita mensal baseada nos planos
    const planPrices: Record<string, number> = { basic: 99, pro: 199, enterprise: 399 }
    const monthlyRevenue = gyms.reduce(
      (acc: number, g: any) => acc + (planPrices[g.plan] || 0), 
      0
    )

    // Agrupar por plano
    const gymsByPlan: Record<string, number> = gyms.reduce((acc: Record<string, number>, g: any) => {
      acc[g.plan] = (acc[g.plan] || 0) + 1
      return acc
    }, {})

    // Agrupar por estado
    const gymsByState: Record<string, number> = gyms.reduce((acc: Record<string, number>, g: any) => {
      acc[g.state] = (acc[g.state] || 0) + 1
      return acc
    }, {})

    // Top academias por número de membros
    const topGyms = [...gyms]
      .sort((a: any, b: any) => b._count.members - a._count.members)
      .slice(0, 5)

    // Academias recentes
    const recentGyms = gyms.slice(0, 5)

    return NextResponse.json({
      gyms,
      stats,
      monthlyRevenue,
      gymsByPlan,
      gymsByState,
      topGyms,
      recentGyms,
    })
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados do dashboard' },
      { status: 500 }
    )
  }
}
