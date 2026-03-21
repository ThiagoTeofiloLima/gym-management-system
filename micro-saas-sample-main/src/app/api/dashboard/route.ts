import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/services/database'
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
        const gym = await db.findGymById(queryGymId)
        if (gym) {
          const counts = await db.getGymCounts(queryGymId)
          gyms = [{ ...gym, _count: counts }]
        } else {
          gyms = []
        }
      } else {
        // Vê TODAS as academias
        const allGyms = await db.findAllGyms()
        const gymsWithCounts = await Promise.all(
          allGyms.map(async (g) => ({
            ...g,
            _count: await db.getGymCounts(g.id),
          }))
        )
        gyms = gymsWithCounts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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
      const allGyms = await db.findAllGyms()
      const filteredGyms = allGyms.filter((g) => filterGymIds.includes(g.id))
      
      const gymsWithCounts = await Promise.all(
        filteredGyms.map(async (g) => ({
          ...g,
          _count: await db.getGymCounts(g.id),
        }))
      )
      gyms = gymsWithCounts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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

    // ============================================
    // RECEITA MENSAL - APENAS PARA SUPER ADMIN
    // ============================================
    // Gestores (Gym Admin / User) NÃO veem esta informação
    let monthlyRevenue = 0
    if (context.isSuperAdmin) {
      const planPrices: Record<string, number> = { basic: 99, pro: 199, enterprise: 399 }
      monthlyRevenue = gyms.reduce(
        (acc: number, g: any) => acc + (planPrices[g.plan] || 0),
        0
      )
    }

    // ============================================
    // MÉTRICAS PARA GESTORES (GYM ADMIN / USER)
    // ============================================
    // Informações relevantes para o dia a dia da academia
    let managerMetrics = null

    if (!context.isSuperAdmin && gyms.length > 0) {
      // Buscar dados detalhados dos membros da(s) academia(s)
      const gymIds = gyms.map((g: any) => g.id)

      const members = await db.findMembersByGymIds(gymIds)

      const today = new Date()
      const activeMembers = members.filter(m => m.status === 'Ativo').length
      const inactiveMembers = members.filter(m => m.status === 'Inativo').length
      const pendingMembers = members.filter(m => m.status === 'Pendente').length

      // Membros com renovação nos próximos 7 dias
      const renewalsIn7Days = members.filter(m => {
        const renewalDate = new Date(m.planRenewalDate)
        const diffTime = renewalDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays >= 0 && diffDays <= 7
      }).length

      // Membros com renovação nos próximos 30 dias
      const renewalsIn30Days = members.filter(m => {
        const renewalDate = new Date(m.planRenewalDate)
        const diffTime = renewalDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays >= 0 && diffDays <= 30
      }).length

      // Membros inadimplentes (pagamento vencido há mais de 7 dias)
      const delinquentMembers = members.filter(m => {
        if (!m.paymentDate) return false
        const paymentDate = new Date(m.paymentDate)
        const diffTime = today.getTime() - paymentDate.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays > 7 && m.status !== 'Inativo'
      }).length

      // Membros novos este mês
      const newMembersThisMonth = members.filter(m => {
        const memberDate = new Date(m.id.split('-')[1] || Date.now())
        return memberDate.getMonth() === today.getMonth() &&
               memberDate.getFullYear() === today.getFullYear()
      }).length

      // Frequência média (membros que vieram nos últimos 7 dias)
      const visitedLast7Days = members.filter(m => {
        if (!m.lastVisit) return false
        const lastVisit = new Date(m.lastVisit)
        const diffTime = today.getTime() - lastVisit.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays <= 7
      }).length

      // Distribuição por plano
      const membersByPlan = members.reduce((acc, m) => {
        acc[m.plan] = (acc[m.plan] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Taxa de ocupação
      const totalCapacity = gyms.reduce((acc: number, g: any) => acc + (g.maxMembers || 100), 0)
      const occupancyRate = totalCapacity > 0 ? Math.round((activeMembers / totalCapacity) * 100) : 0

      managerMetrics = {
        activeMembers,
        inactiveMembers,
        pendingMembers,
        renewalsIn7Days,
        renewalsIn30Days,
        delinquentMembers,
        newMembersThisMonth,
        visitedLast7Days,
        frequencyRate: members.length > 0 ? Math.round((visitedLast7Days / members.length) * 100) : 0,
        membersByPlan,
        occupancyRate,
        totalCapacity,
      }
    }

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
      managerMetrics,
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
