import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext } from '@/lib/multi-tenant'

/**
 * GET /api/financial/data
 * Retorna dados financeiros dinâmicos baseados nos membros e planos da academia
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

    const url = new URL(request.url)
    let gymId: string | undefined = url.searchParams.get('gymId') || undefined

    // Obter gymId do contexto se não foi passado
    if (!gymId) {
      if (context.gymId) {
        gymId = context.gymId
      } else if (context.gyms && context.gyms.length > 0) {
        const firstGym = context.gyms.find((g: any) => g.status === 'ACTIVE' && g.isActive)
        gymId = firstGym?.gymId || undefined
      }
    }

    if (!gymId) {
      return NextResponse.json({
        members: [],
        expenses: [],
        gymPlans: [],
        projectedRevenue: 0,
        membersByPlan: {},
      })
    }

    // Buscar membros, despesas e planos em paralelo
    const [members, expenses, gymPlans] = await Promise.all([
      db.findMembers({ gymId }),
      db.findExpenses({ gymId }),
      db.findGymPlansByGymId(gymId),
    ])

    // Criar mapa de preços dos planos
    const planPriceMap = new Map<string, number>()
    gymPlans.forEach(plan => {
      if (plan.isActive) {
        planPriceMap.set(plan.name.toLowerCase(), plan.price)
      }
    })

    // Função para obter preço do plano
    const getPlanPrice = (planName: string): number => {
      const price = planPriceMap.get(planName.toLowerCase())
      if (price !== undefined) {
        return price
      }
      // Fallback para preços padrão
      const defaultPrices: Record<string, number> = {
        'mensal': 100,
        'trimestral': 250,
        'anual': 900,
      }
      return defaultPrices[planName.toLowerCase()] || 0
    }

    // Calcular receita projetada baseada nos membros ativos
    let projectedMonthlyRevenue = 0
    const membersByPlan: Record<string, { count: number; revenue: number }> = {}

    members.forEach(member => {
      if (member.status === 'Ativo' || member.status === 'ativo') {
        const planName = member.plan || 'Mensal'
        const planPrice = getPlanPrice(planName)
        const planLower = planName.toLowerCase()

        // Calcular receita mensal projetada
        if (planLower.includes('anual')) {
          projectedMonthlyRevenue += planPrice / 12
        } else if (planLower.includes('trimestral')) {
          projectedMonthlyRevenue += planPrice / 3
        } else {
          projectedMonthlyRevenue += planPrice
        }

        // Agrupar por plano
        if (!membersByPlan[planName]) {
          membersByPlan[planName] = { count: 0, revenue: 0 }
        }
        membersByPlan[planName].count += 1
        membersByPlan[planName].revenue += planPrice
      }
    })

    // Calcular receitas registradas (pagamentos de membros)
    const now = new Date()
    const currentMonthRevenue = members
      .filter(m => m.status === 'Ativo' || m.status === 'ativo')
      .map(member => {
        const paymentDate = new Date(member.paymentDate)
        const planPrice = getPlanPrice(member.plan)

        // Verificar se pagamento é do mês atual
        if (paymentDate.getMonth() === now.getMonth() &&
            paymentDate.getFullYear() === now.getFullYear()) {
          return planPrice
        }
        return 0
      })
      .reduce((sum, val) => sum + val, 0)

    // Calcular despesas do mês
    const currentMonthExpenses = expenses
      .filter(e => {
        const expenseDate = new Date(e.date)
        return expenseDate.getMonth() === now.getMonth() &&
               expenseDate.getFullYear() === now.getFullYear()
      })
      .reduce((sum, e) => sum + e.amount, 0)

    // Calcular histórico mensal (últimos 6 meses)
    const monthlyHistory = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const month = date.getMonth()
      const year = date.getFullYear()

      const monthRevenue = members
        .filter(m => {
          const paymentDate = new Date(m.paymentDate)
          return (m.status === 'Ativo' || m.status === 'ativo') &&
                 paymentDate.getMonth() === month &&
                 paymentDate.getFullYear() === year
        })
        .reduce((sum, m) => sum + getPlanPrice(m.plan), 0)

      const monthExpenses = expenses
        .filter(e => {
          const expenseDate = new Date(e.date)
          return expenseDate.getMonth() === month &&
                 expenseDate.getFullYear() === year
        })
        .reduce((sum, e) => sum + e.amount, 0)

      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

      monthlyHistory.push({
        month: `${monthNames[month]}/${year.toString().substring(2)}`,
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthRevenue - monthExpenses,
      })
    }

    // Calcular despesas por categoria
    const expensesByCategory: Record<string, number> = {}
    expenses.forEach(expense => {
      if (!expensesByCategory[expense.category]) {
        expensesByCategory[expense.category] = 0
      }
      expensesByCategory[expense.category] += expense.amount
    })

    const categoryData = Object.entries(expensesByCategory).map(([name, value]) => ({
      name,
      value,
    }))

    return NextResponse.json({
      members,
      expenses,
      gymPlans,
      projectedRevenue: projectedMonthlyRevenue,
      membersByPlan,
      currentMonthRevenue,
      currentMonthExpenses,
      monthlyHistory,
      categoryData,
      totalRevenue: members
        .filter(m => m.status === 'Ativo' || m.status === 'ativo')
        .reduce((sum, m) => sum + getPlanPrice(m.plan), 0),
      totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
    })
  } catch (error) {
    console.error('Erro ao buscar dados financeiros:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados financeiros' },
      { status: 500 }
    )
  }
}
