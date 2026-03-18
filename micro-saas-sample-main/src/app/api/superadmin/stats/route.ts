import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext } from '@/lib/multi-tenant'

/**
 * GET /api/superadmin/stats
 * Retorna estatísticas completas para o painel do superadmin
 * Apenas usuários SUPER_ADMIN podem acessar
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getTenantContext()

    if (!context || !context.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Acesso restrito ao Super Admin' },
        { status: 403 }
      )
    }

    // Buscar todas as academias
    const gyms = await prisma.gym.findMany({
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

    // Calcular estatísticas
    const stats = {
      totalGyms: gyms.length,
      activeGyms: gyms.filter((g: any) => g.isActive).length,
      inactiveGyms: gyms.filter((g: any) => !g.isActive).length,
      totalMembers: gyms.reduce((acc: number, g: any) => acc + g._count.members, 0),
      totalUsers: gyms.reduce((acc: number, g: any) => acc + g._count.users, 0),
      totalTrainers: gyms.reduce((acc: number, g: any) => acc + g._count.trainers, 0),
      totalWorkouts: gyms.reduce((acc: number, g: any) => acc + g._count.workouts, 0),
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
      const state = g.state || 'N/A'
      acc[state] = (acc[state] || 0) + 1
      return acc
    }, {})

    // Top academias por número de membros
    const topGyms = [...gyms]
      .sort((a: any, b: any) => b._count.members - a._count.members)
      .slice(0, 5)

    // Academias recentes
    const recentGyms = gyms.slice(0, 5)

    // Academias expirando em breve (plano expira em menos de 30 dias)
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const gymsExpiringSoon = gyms.filter((g: any) => {
      if (!g.planExpiresAt) return false
      const expiresAt = new Date(g.planExpiresAt)
      return expiresAt <= thirtyDaysFromNow && expiresAt >= now
    })

    return NextResponse.json({
      totalGyms: stats.totalGyms,
      activeGyms: stats.activeGyms,
      inactiveGyms: stats.inactiveGyms,
      totalMembers: stats.totalMembers,
      totalUsers: stats.totalUsers,
      totalTrainers: stats.totalTrainers,
      totalWorkouts: stats.totalWorkouts,
      monthlyRevenue,
      gymsByPlan,
      gymsByState,
      topGyms,
      recentGyms,
      gymsExpiringSoon,
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas do superadmin:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    )
  }
}
