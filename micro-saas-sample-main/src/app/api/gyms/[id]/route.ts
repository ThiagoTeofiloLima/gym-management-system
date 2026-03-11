import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/multi-tenant'

/**
 * PATCH /api/gyms/[id]
 * Atualiza uma academia
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, cnpj, email, phone, city, state, isActive, plan } = body

    const gym = await prisma.gym.update({
      where: { id },
      data: {
        name,
        cnpj,
        email,
        phone,
        city,
        state,
        isActive,
        plan,
      },
    })

    return NextResponse.json(gym)
  } catch (error) {
    console.error('Erro ao atualizar academia:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar academia' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/gyms/[id]
 * Deleta uma academia (apenas se não tiver dados)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verifica se a academia tem dados
    const counts = await prisma.gym.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            members: true,
            trainers: true,
            workouts: true,
            expenses: true,
          },
        },
      },
    })

    if (!counts) {
      return NextResponse.json(
        { error: 'Academia não encontrada' },
        { status: 404 }
      )
    }

    const totalItems =
      counts._count.users +
      counts._count.members +
      counts._count.trainers +
      counts._count.workouts +
      counts._count.expenses

    if (totalItems > 0) {
      return NextResponse.json(
        {
          error: 'Não é possível deletar academia com dados',
          details: `A academia possui ${totalItems} registros associados`,
        },
        { status: 400 }
      )
    }

    await prisma.gym.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Academia deletada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar academia:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar academia' },
      { status: 500 }
    )
  }
}
