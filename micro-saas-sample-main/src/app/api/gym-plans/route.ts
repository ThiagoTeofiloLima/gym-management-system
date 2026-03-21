import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext, canAccessGym } from '@/lib/multi-tenant'

/**
 * GET /api/gym-plans
 * Lista os planos da academia do gestor logado
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

    // Obter gymId do contexto
    let gymId: string | undefined

    if (context.gymId) {
      gymId = context.gymId
    } else if (context.gyms && context.gyms.length > 0) {
      const firstGym = context.gyms.find((g: any) => g.status === 'ACTIVE' && g.isActive)
      gymId = firstGym?.gymId
    }

    // Super Admin pode especificar um gymId via query param
    const url = new URL(request.url)
    const queryGymId = url.searchParams.get('gymId')
    if (queryGymId && context.isSuperAdmin) {
      // Validar acesso à academia especificada
      const hasAccess = await canAccessGym(session.user.id, queryGymId)
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have access to this gym' },
          { status: 403 }
        )
      }
      gymId = queryGymId
    }

    if (!gymId) {
      return NextResponse.json(
        { error: 'Academia não encontrada' },
        { status: 404 }
      )
    }

    // Buscar planos da academia
    const plans = await db.findGymPlansByGymId(gymId)

    return NextResponse.json(plans)
  } catch (error) {
    console.error('Erro ao buscar planos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar planos' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/gym-plans
 * Cria um novo plano para a academia
 *
 * SEGURANÇA: Usa apenas o gymId do contexto do usuário (não aceita gymId externo)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getTenantContext()

    if (!context || (!context.isGymAdmin && !context.isSuperAdmin)) {
      return NextResponse.json(
        { error: 'Acesso não permitido' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, price, duration, maxMembers } = body

    if (!name || !price) {
      return NextResponse.json(
        { error: 'Nome e preço são obrigatórios' },
        { status: 400 }
      )
    }

    // Obter gymId
    let gymId: string | undefined

    if (context.gymId) {
      gymId = context.gymId
    } else if (context.gyms && context.gyms.length > 0) {
      const firstGym = context.gyms.find((g: any) => g.status === 'ACTIVE' && g.isActive)
      gymId = firstGym?.gymId
    }

    if (!gymId) {
      return NextResponse.json(
        { error: 'Academia não encontrada' },
        { status: 404 }
      )
    }

    // Criar plano
    const plan = await db.createGymPlan({
      gymId,
      name,
      description: description || null,
      price: parseFloat(price),
      duration: duration ? parseInt(duration) : 30,
      maxMembers: maxMembers ? parseInt(maxMembers) : null,
      isActive: true,
    })

    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar plano:', error)
    return NextResponse.json(
      { error: 'Erro ao criar plano' },
      { status: 500 }
    )
  }
}
