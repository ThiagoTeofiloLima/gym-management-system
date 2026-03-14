import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext } from '@/lib/multi-tenant'

/**
 * PUT /api/expenses/[id]
 * Atualiza uma despesa
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

    const url = new URL(request.url)
    const gymId = url.searchParams.get('gymId')

    if (!gymId) {
      return NextResponse.json({ error: 'gymId is required' }, { status: 400 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, description, amount, category, date } = body

    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    })

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    if (existingExpense.gymId !== gymId) {
      return NextResponse.json({ error: 'Expense does not belong to this gym' }, { status: 403 })
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        title,
        description,
        amount: parseFloat(amount),
        category,
        date: date ? new Date(date) : undefined,
      },
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

    const url = new URL(request.url)
    const gymId = url.searchParams.get('gymId')

    if (!gymId) {
      return NextResponse.json({ error: 'gymId is required' }, { status: 400 })
    }

    const { id } = await params

    const expense = await prisma.expense.findUnique({
      where: { id },
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    if (expense.gymId !== gymId) {
      return NextResponse.json({ error: 'Expense does not belong to this gym' }, { status: 403 })
    }

    await prisma.expense.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
