import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext, canAccessGym } from '@/lib/multi-tenant'

/**
 * GET /api/trainers
 * Lista treinadores da academia
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

    const trainers = await db.findTrainers({ gymId })

    // Buscar gym para cada trainer
    const trainersWithGym = await Promise.all(
      trainers.map(async (trainer) => {
        let gym = null
        if (trainer.gymId) {
          const gymData = await db.findGymById(trainer.gymId)
          if (gymData) {
            gym = {
              id: gymData.id,
              name: gymData.name,
            }
          }
        }

        // Buscar members do trainer
        const members = await db.findMembers({ gymId, trainerId: trainer.id })
        const membersData = members.map((m) => ({
          id: m.id,
          name: m.name,
        }))

        return {
          ...trainer,
          gym,
          members: membersData,
        }
      })
    )

    return NextResponse.json(trainersWithGym)
  } catch (error) {
    console.error('Error fetching trainers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/trainers
 * Cria novo treinador
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
    const { name, email, phone, specialty, certifications } = body

    if (!name || !email || !phone || !specialty) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phone, specialty' },
        { status: 400 }
      )
    }

    const newTrainer = await db.createTrainer({
      name,
      email,
      phone,
      specialty,
      status: 'Ativo',
      certifications: certifications || '',
      gymId,
      userId: session.user.id,
    })

    return NextResponse.json(newTrainer, { status: 201 })
  } catch (error) {
    console.error('Error creating trainer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
