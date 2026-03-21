import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext, canAccessGym } from '@/lib/multi-tenant'

/**
 * GET /api/expenses
 * Lista despesas da academia
 *
 * SEGURANÇA: Valida se o usuário tem permissão para acessar a academia especificada
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
    const queryGymId = url.searchParams.get('gymId')

    // Determinar qual gymId usar
    let gymId: string | undefined

    if (queryGymId) {
      // Se passou gymId na query, validar se o usuário tem acesso
      const hasAccess = await canAccessGym(session.user.id, queryGymId)
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have access to this gym' },
          { status: 403 }
        )
      }
      gymId = queryGymId
    } else if (context.gymId) {
      gymId = context.gymId
    } else if (context.gyms && context.gyms.length > 0) {
      const firstGym = context.gyms.find((g: any) => g.status === 'ACTIVE' && g.isActive)
      gymId = firstGym?.gymId
    }

    if (!gymId) {
      return NextResponse.json([])
    }

    const expenses = await db.findExpenses({ gymId })

    // Buscar gym para cada expense
    const expensesWithGym = await Promise.all(
      expenses.map(async (expense) => {
        let gym = null
        if (expense.gymId) {
          const gymData = await db.findGymById(expense.gymId)
          if (gymData) {
            gym = {
              id: gymData.id,
              name: gymData.name,
            }
          }
        }

        return {
          ...expense,
          gym,
        }
      })
    )

    return NextResponse.json(expensesWithGym)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/expenses
 * Cria nova despesa
 *
 * SEGURANÇA: Valida se o usuário tem permissão para acessar a academia especificada
 */
export async function POST(request: NextRequest) {
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
    const queryGymId = url.searchParams.get('gymId')

    // Determinar qual gymId usar
    let gymId: string | undefined

    if (queryGymId) {
      // Se passou gymId na query, validar se o usuário tem acesso
      const hasAccess = await canAccessGym(session.user.id, queryGymId)
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have access to this gym' },
          { status: 403 }
        )
      }
      gymId = queryGymId
    } else if (context.gymId) {
      gymId = context.gymId
    } else if (context.gyms && context.gyms.length > 0) {
      const firstGym = context.gyms.find((g: any) => g.status === 'ACTIVE' && g.isActive)
      gymId = firstGym?.gymId
    }

    if (!gymId) {
      return NextResponse.json(
        { error: 'gymId is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { title, description, amount, category, date } = body

    if (!title || amount === undefined || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: title, amount, category' },
        { status: 400 }
      )
    }

    const newExpense = await db.createExpense({
      title,
      description,
      amount,
      category,
      date: date || new Date().toISOString().split('T')[0],
      gymId,
      userId: session.user.id,
    })

    return NextResponse.json(newExpense, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
