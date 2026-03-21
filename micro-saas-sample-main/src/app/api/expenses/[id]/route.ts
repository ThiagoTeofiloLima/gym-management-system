import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext, canAccessGym } from '@/lib/multi-tenant'

/**
 * PUT /api/expenses/[id]
 * Atualiza uma despesa
 *
 * SEGURANÇA: Valida se o usuário tem permissão para acessar a academia da despesa
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getTenantContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, description, amount, category, date } = body

    const existingExpense = await db.findExpenseById(id)

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    if (!existingExpense.gymId) {
      return NextResponse.json({ error: 'Expense has no gym association' }, { status: 400 })
    }

    // VALIDAÇÃO DE SEGURANÇA: Verificar se usuário tem acesso à academia desta despesa
    const hasAccess = await canAccessGym(session.user.id, existingExpense.gymId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: You do not have access to this gym' }, { status: 403 })
    }

    const expense = await db.updateExpense(id, {
      title,
      description,
      amount: parseFloat(amount),
      category,
      date: date ? new Date(date).toISOString() : undefined,
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/expenses/[id]
 * Deleta uma despesa
 *
 * SEGURANÇA: Valida se o usuário tem permissão para acessar a academia da despesa
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getTenantContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const expense = await db.findExpenseById(id)

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    if (!expense.gymId) {
      return NextResponse.json({ error: 'Expense has no gym association' }, { status: 400 })
    }

    // VALIDAÇÃO DE SEGURANÇA: Verificar se usuário tem acesso à academia desta despesa
    const hasAccess = await canAccessGym(session.user.id, expense.gymId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: You do not have access to this gym' }, { status: 403 })
    }

    await db.deleteExpense(id)

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
