import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext, canAccessGym } from '@/lib/multi-tenant'

/**
 * GET /api/members/[id]
 * Busca membro único por ID
 *
 * SEGURANÇA: Valida se o usuário tem permissão para acessar a academia do membro
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

    const member = await db.findMemberById(id)

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (!member.gymId) {
      return NextResponse.json({ error: 'Member has no gym association' }, { status: 400 })
    }

    // VALIDAÇÃO DE SEGURANÇA: Verificar se usuário tem acesso à academia deste membro
    const hasAccess = await canAccessGym(session.user.id, member.gymId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: You do not have access to this gym' }, { status: 403 })
    }

    // Buscar trainer se existir
    let trainer = null
    if (member.trainerId) {
      const trainerData = await db.findTrainerById(member.trainerId)
      if (trainerData) {
        trainer = {
          id: trainerData.id,
          name: trainerData.name,
          specialty: trainerData.specialty,
        }
      }
    }

    // Buscar gym
    let gym = null
    if (member.gymId) {
      const gymData = await db.findGymById(member.gymId)
      if (gymData) {
        gym = {
          id: gymData.id,
          name: gymData.name,
        }
      }
    }

    // Retornar member com dados relacionados
    return NextResponse.json({
      ...member,
      trainer,
      gym,
    })
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
 *
 * SEGURANÇA: Valida se o usuário tem permissão para acessar a academia do membro
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

    const context = await getTenantContext()

    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    const existingMember = await db.findMemberById(id)

    if (!existingMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    if (!existingMember.gymId) {
      return NextResponse.json(
        { error: 'Member has no gym association' },
        { status: 400 }
      )
    }

    // VALIDAÇÃO DE SEGURANÇA: Verificar se usuário tem acesso à academia deste membro
    const hasAccess = await canAccessGym(session.user.id, existingMember.gymId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this gym' },
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
    const updatedMember = await db.updateMember(id, {
      name,
      email,
      phone,
      plan,
      status,
      planRenewalDate: renewalDate,
      paymentDate: paymentDateValue,
      trainerId: trainerId,
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
 *
 * SEGURANÇA: Valida se o usuário tem permissão para acessar a academia do membro
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

    // Check if member exists
    const existingMember = await db.findMemberById(id)

    if (!existingMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    if (!existingMember.gymId) {
      return NextResponse.json(
        { error: 'Member has no gym association' },
        { status: 400 }
      )
    }

    // VALIDAÇÃO DE SEGURANÇA: Verificar se usuário tem acesso à academia deste membro
    const hasAccess = await canAccessGym(session.user.id, existingMember.gymId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this gym' },
        { status: 403 }
      )
    }

    // Delete member
    await db.deleteMember(id)

    return NextResponse.json({ message: 'Member deleted successfully' })
  } catch (error) {
    console.error('Error deleting member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
