import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext } from '@/lib/multi-tenant'

/**
 * PATCH /api/superadmin/gyms/[id]/toggle-status
 * Alterna o status de uma academia (apenas Super Admin)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getTenantContext()

    if (!context || !context.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Acesso restrito ao Super Admin' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { isActive } = body

    // Verificar se academia existe
    const existingGym = await prisma.gym.findUnique({
      where: { id },
    })

    if (!existingGym) {
      return NextResponse.json(
        { error: 'Academia não encontrada' },
        { status: 404 }
      )
    }

    const gym = await prisma.gym.update({
      where: { id },
      data: { isActive },
    })

    return NextResponse.json(gym)
  } catch (error) {
    console.error('Erro ao alternar status da academia:', error)
    return NextResponse.json(
      { error: 'Erro ao alternar status da academia' },
      { status: 500 }
    )
  }
}
