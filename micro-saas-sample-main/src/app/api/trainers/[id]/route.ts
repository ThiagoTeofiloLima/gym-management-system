import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext } from '@/lib/multi-tenant'

/**
 * PUT /api/trainers/[id]
 * Atualiza um treinador
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
    const { name, email, phone, specialty, certifications, status } = body

    const existingTrainer = await prisma.trainer.findUnique({
      where: { id },
    })

    if (!existingTrainer) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 })
    }

    if (existingTrainer.gymId !== gymId) {
      return NextResponse.json({ error: 'Trainer does not belong to this gym' }, { status: 403 })
    }

    const trainer = await prisma.trainer.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        specialty,
        certifications: Array.isArray(certifications) ? certifications.join(', ') : certifications,
        status,
      },
    })

    return NextResponse.json(trainer)
  } catch (error) {
    console.error('Error updating trainer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/trainers/[id]
 * Deleta um treinador
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

    const trainer = await prisma.trainer.findUnique({
      where: { id },
    })

    if (!trainer) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 })
    }

    if (trainer.gymId !== gymId) {
      return NextResponse.json({ error: 'Trainer does not belong to this gym' }, { status: 403 })
    }

    await prisma.trainer.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Trainer deleted successfully' })
  } catch (error) {
    console.error('Error deleting trainer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
