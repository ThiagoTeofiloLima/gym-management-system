import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { auth } from '@/services/auth'

/**
 * GET /api/members
 * Lista membros da academia
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const gymId = url.searchParams.get('gymId')

    // Se não tem gymId, retorna array vazio
    if (!gymId) {
      return NextResponse.json([])
    }

    // Filtros opcionais
    const status = url.searchParams.get('status')
    const plan = url.searchParams.get('plan')
    const search = url.searchParams.get('search')

    const whereClause: any = { gymId }

    if (status) {
      whereClause.status = status
    }

    if (plan) {
      whereClause.plan = plan
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const members = await prisma.member.findMany({
      where: whereClause,
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            specialty: true,
          },
        },
        gym: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/members
 * Cria novo membro
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
        { error: 'gymId is required. Please select a gym.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, email, phone, plan, planRenewalDate, paymentDate, trainerId } = body

    // Validate required fields
    if (!name || !email || !phone || !plan) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phone, plan' },
        { status: 400 }
      )
    }

    // Check if member with this email already exists for this gym
    const existingMember = await prisma.member.findFirst({
      where: { email, gymId },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'Member with this email already exists' },
        { status: 409 }
      )
    }

    // Calculate renewal date based on payment date and plan
    let renewalDate = planRenewalDate
    let paymentDateValue = paymentDate || new Date().toISOString().split('T')[0]

    if (!renewalDate) {
      const paymentDateObj = new Date(paymentDateValue)
      switch (plan.toLowerCase()) {
        case 'mensal':
          paymentDateObj.setMonth(paymentDateObj.getMonth() + 1)
          break
        case 'trimestral':
          paymentDateObj.setMonth(paymentDateObj.getMonth() + 3)
          break
        case 'anual':
          paymentDateObj.setFullYear(paymentDateObj.getFullYear() + 1)
          break
        default:
          paymentDateObj.setMonth(paymentDateObj.getMonth() + 1)
      }
      renewalDate = paymentDateObj.toISOString().split('T')[0]
    }

    // Create new member
    const newMember = await prisma.member.create({
      data: {
        name,
        email,
        phone,
        plan,
        status: 'Ativo',
        lastVisit: new Date().toISOString().split('T')[0],
        planRenewalDate: renewalDate,
        paymentDate: paymentDateValue,
        gymId,
        userId: session.user.id,
        trainerId: trainerId || null,
      },
    })

    return NextResponse.json(newMember, { status: 201 })
  } catch (error) {
    console.error('Error creating member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
