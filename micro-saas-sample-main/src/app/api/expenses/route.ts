import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { auth } from '@/services/auth'

/**
 * GET /api/expenses
 * Lista despesas da academia
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const gymId = url.searchParams.get('gymId')

    if (!gymId) {
      return NextResponse.json([])
    }

    const whereClause: any = { gymId }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        gym: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(expenses)
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
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const gymId = url.searchParams.get('gymId')

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

    const newExpense = await prisma.expense.create({
      data: {
        title,
        description,
        amount,
        category,
        date: date ? new Date(date) : new Date(),
        gymId,
        userId: session.user.id,
      },
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
