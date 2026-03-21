import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext, canAccessGym } from '@/lib/multi-tenant'

/**
 * PUT /api/workouts/[id]
 * Atualiza um workout
 *
 * SEGURANÇA: Valida se o usuário tem permissão para acessar a academia do workout
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
    const { name, type, duration, level, description, trainerId } = body

    const existingWorkout = await db.findWorkoutById(id)

    if (!existingWorkout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 })
    }

    if (!existingWorkout.gymId) {
      return NextResponse.json({ error: 'Workout has no gym association' }, { status: 400 })
    }

    // VALIDAÇÃO DE SEGURANÇA: Verificar se usuário tem acesso à academia deste workout
    const hasAccess = await canAccessGym(session.user.id, existingWorkout.gymId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: You do not have access to this gym' }, { status: 403 })
    }

    const workout = await db.updateWorkout(id, {
      name,
      type,
      duration,
      level,
      description,
      trainerId,
    })

    return NextResponse.json(workout)
  } catch (error) {
    console.error('Error updating workout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/workouts/[id]
 * Deleta um workout
 *
 * SEGURANÇA: Valida se o usuário tem permissão para acessar a academia do workout
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

    const workout = await db.findWorkoutById(id)

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 })
    }

    if (!workout.gymId) {
      return NextResponse.json({ error: 'Workout has no gym association' }, { status: 400 })
    }

    // VALIDAÇÃO DE SEGURANÇA: Verificar se usuário tem acesso à academia deste workout
    const hasAccess = await canAccessGym(session.user.id, workout.gymId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: You do not have access to this gym' }, { status: 403 })
    }

    await db.deleteWorkout(id)

    return NextResponse.json({ message: 'Workout deleted successfully' })
  } catch (error) {
    console.error('Error deleting workout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
