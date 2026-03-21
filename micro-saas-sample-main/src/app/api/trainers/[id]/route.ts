import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext, canAccessGym } from '@/lib/multi-tenant'

/**
 * PUT /api/trainers/[id]
 * Atualiza um treinador
 *
 * SEGURANÇA: Valida se o usuário tem permissão para acessar a academia do treinador
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
    const { name, email, phone, specialty, certifications, status } = body

    const existingTrainer = await db.findTrainerById(id)

    if (!existingTrainer) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 })
    }

    if (!existingTrainer.gymId) {
      return NextResponse.json({ error: 'Trainer has no gym association' }, { status: 400 })
    }

    // VALIDAÇÃO DE SEGURANÇA: Verificar se usuário tem acesso à academia deste treinador
    const hasAccess = await canAccessGym(session.user.id, existingTrainer.gymId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: You do not have access to this gym' }, { status: 403 })
    }

    const trainer = await db.updateTrainer(id, {
      name,
      email,
      phone,
      specialty,
      certifications: Array.isArray(certifications) ? certifications.join(', ') : certifications,
      status,
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
 *
 * SEGURANÇA: Valida se o usuário tem permissão para acessar a academia do treinador
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

    const trainer = await db.findTrainerById(id)

    if (!trainer) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 })
    }

    if (!trainer.gymId) {
      return NextResponse.json({ error: 'Trainer has no gym association' }, { status: 400 })
    }

    // VALIDAÇÃO DE SEGURANÇA: Verificar se usuário tem acesso à academia deste treinador
    const hasAccess = await canAccessGym(session.user.id, trainer.gymId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: You do not have access to this gym' }, { status: 403 })
    }

    await db.deleteTrainer(id)

    return NextResponse.json({ message: 'Trainer deleted successfully' })
  } catch (error) {
    console.error('Error deleting trainer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
