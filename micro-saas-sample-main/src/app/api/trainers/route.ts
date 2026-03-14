import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { auth } from '@/services/auth'

/**
 * GET /api/trainers
 * Lista treinadores da academia
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

    const trainers = await prisma.trainer.findMany({
      where: whereClause,
      include: {
        gym: {
          select: {
            id: true,
            name: true,
          },
        },
        members: {
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

    return NextResponse.json(trainers)
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
    const { name, email, phone, specialty, certifications } = body

    if (!name || !email || !phone || !specialty) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phone, specialty' },
        { status: 400 }
      )
    }

    const newTrainer = await prisma.trainer.create({
      data: {
        name,
        email,
        phone,
        specialty,
        status: 'Ativo',
        certifications: certifications || '',
        gymId,
        userId: session.user.id,
      },
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
