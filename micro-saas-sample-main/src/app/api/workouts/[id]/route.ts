import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext } from '@/lib/multi-tenant'

/**
 * PUT /api/workouts/[id]
 * Atualiza um workout
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
    const { name, type, duration, level, description, trainerId } = body

    const existingWorkout = await prisma.workout.findUnique({
      where: { id },
    })

    if (!existingWorkout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 })
    }

    if (existingWorkout.gymId !== gymId) {
      return NextResponse.json({ error: 'Workout does not belong to this gym' }, { status: 403 })
    }

    const workout = await prisma.workout.update({
      where: { id },
      data: {
        name,
        type,
        duration,
        level,
        description,
        trainerId,
      },
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

    const workout = await prisma.workout.findUnique({
      where: { id },
    })

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 })
    }

    if (workout.gymId !== gymId) {
      return NextResponse.json({ error: 'Workout does not belong to this gym' }, { status: 403 })
    }

    await prisma.workout.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Workout deleted successfully' })
  } catch (error) {
    console.error('Error deleting workout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
