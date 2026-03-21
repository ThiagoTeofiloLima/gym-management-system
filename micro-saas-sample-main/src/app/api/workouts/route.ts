import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext, canAccessGym } from '@/lib/multi-tenant'

/**
 * GET /api/workouts
 * Lista workouts da academia
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

    const workouts = await db.findWorkouts({ gymId })

    // Buscar dados relacionados para cada workout
    const formattedWorkouts = await Promise.all(
      workouts.map(async (workout) => {
        // Buscar trainer
        let trainer = null
        if (workout.trainerId) {
          const trainerData = await db.findTrainerById(workout.trainerId)
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
        if (workout.gymId) {
          const gymData = await db.findGymById(workout.gymId)
          if (gymData) {
            gym = {
              id: gymData.id,
              name: gymData.name,
            }
          }
        }

        // Buscar workout members
        const workoutMembers = await db.findWorkoutMembersByWorkoutId(workout.id)
        const members = await Promise.all(
          workoutMembers.map(async (wm) => {
            const member = await db.findMemberById(wm.memberId)
            return member
              ? {
                  id: member.id,
                  name: member.name,
                  email: member.email,
                }
              : null
          })
        )
        const validMembers = members.filter((m) => m !== null)

        return {
          ...workout,
          members: validMembers,
          trainer,
          gym,
        }
      })
    )

    return NextResponse.json(formattedWorkouts)
  } catch (error) {
    console.error('Error fetching workouts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/workouts
 * Cria novo workout
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
    const { name, type, duration, level, description, trainerId } = body

    if (!name || !type || !duration || !level) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, duration, level' },
        { status: 400 }
      )
    }

    const newWorkout = await db.createWorkout({
      name,
      type,
      duration: String(duration),
      level,
      description,
      trainerId: trainerId || null,
      gymId,
      userId: session.user.id,
    })

    return NextResponse.json(newWorkout, { status: 201 })
  } catch (error) {
    console.error('Error creating workout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
