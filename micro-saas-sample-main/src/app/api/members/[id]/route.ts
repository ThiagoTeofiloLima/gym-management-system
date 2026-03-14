import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext } from '@/lib/multi-tenant'

/**
 * GET /api/members/[id]
 * Busca membro único por ID
 */
export async function GET(
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

    const member = await prisma.member.findUnique({
      where: { id },
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
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Verificar permissão (Super Admin ou mesma academia)
    if (!context.isSuperAdmin && member.gymId !== context.gymId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(member)
  } catch (error) {
    console.error('Error fetching member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/members/[id]
 * Atualiza membro por ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const gymId = url.searchParams.get('gymId')

    if (!gymId) {
      return NextResponse.json(
        { error: 'gymId is required' },
        { status: 400 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { name, email, phone, plan, status, planRenewalDate, paymentDate, trainerId } = body

    // Validate required fields
    if (!name || !email || !phone || !plan || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if member exists
    const existingMember = await prisma.member.findUnique({
      where: { id },
    })

    if (!existingMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Verificar se pertence à academia
    if (existingMember.gymId !== gymId) {
      return NextResponse.json(
        { error: 'Member does not belong to this gym' },
        { status: 403 }
      )
    }

    // Calculate renewal date based on payment date and plan
    let renewalDate = planRenewalDate
    let paymentDateValue = paymentDate || existingMember.paymentDate || new Date().toISOString().split('T')[0]

    if (!renewalDate) {
      const [year, month, day] = paymentDateValue.split('-').map(Number)
      const paymentDateObj = new Date(year, month - 1, day)
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
      const year_renewal = paymentDateObj.getFullYear()
      const month_renewal = String(paymentDateObj.getMonth() + 1).padStart(2, '0')
      const day_renewal = String(paymentDateObj.getDate()).padStart(2, '0')
      renewalDate = `${year_renewal}-${month_renewal}-${day_renewal}`
    }

    // Update member
    const updatedMember = await prisma.member.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        plan,
        status,
        planRenewalDate: renewalDate,
        paymentDate: paymentDateValue,
        trainerId: trainerId,
      },
    })

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error('Error updating member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/members/[id]
 * Deleta membro por ID
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
      return NextResponse.json(
        { error: 'gymId is required' },
        { status: 400 }
      )
    }

    const { id } = await params

    // Check if member exists and belongs to the gym
    const existingMember = await prisma.member.findUnique({
      where: { id },
    })

    if (!existingMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    if (existingMember.gymId !== gymId) {
      return NextResponse.json(
        { error: 'Member does not belong to this gym' },
        { status: 403 }
      )
    }

    // Delete member
    await prisma.member.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Member deleted successfully' })
  } catch (error) {
    console.error('Error deleting member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
