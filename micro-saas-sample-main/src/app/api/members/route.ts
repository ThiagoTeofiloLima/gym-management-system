import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext, canAccessGym } from '@/lib/multi-tenant'

/**
 * GET /api/members
 * Lista membros da academia
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

    // Se não tem gymId, retorna array vazio
    if (!gymId) {
      return NextResponse.json([])
    }

    // Filtros opcionais
    const status = url.searchParams.get('status')
    const plan = url.searchParams.get('plan')
    const search = url.searchParams.get('search')

    const members = await db.findMembers({
      gymId,
      userId: session.user.id,
      status: status || undefined,
      plan: plan || undefined,
      search: search || undefined,
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
    const existingMembers = await db.findMembers({ gymId, search: email })
    const existingMember = existingMembers.find(m => m.email === email)

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
    const newMember = await db.createMember({
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
