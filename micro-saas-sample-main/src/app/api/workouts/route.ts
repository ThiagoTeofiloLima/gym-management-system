import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { auth } from '@/services/auth'

/**
 * GET /api/workouts
 * Lista workouts da academia
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

    const workouts = await prisma.workout.findMany({
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
        workoutMembers: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formattedWorkouts = workouts.map((workout) => ({
      ...workout,
      members: workout.workoutMembers.map((wm) => ({
        id: wm.member.id,
        name: wm.member.name,
        email: wm.member.email,
      })),
      trainer: workout.trainer
        ? { id: workout.trainer.id, name: workout.trainer.name, specialty: workout.trainer.specialty }
        : null,
    }))

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
    const { name, type, duration, level, description, trainerId } = body

    if (!name || !type || !duration || !level) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, duration, level' },
        { status: 400 }
      )
    }

    const newWorkout = await prisma.workout.create({
      data: {
        name,
        type,
        duration: String(duration),
        level,
        description,
        trainerId: trainerId || null,
        gymId,
        userId: session.user.id,
      },
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
