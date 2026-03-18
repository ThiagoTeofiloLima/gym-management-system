import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext } from '@/lib/multi-tenant'

/**
 * PUT /api/gym-plans/[id]
 * Atualiza um plano existente
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

    if (!context || (!context.isGymAdmin && !context.isSuperAdmin)) {
      return NextResponse.json(
        { error: 'Acesso não permitido' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, price, duration, maxMembers, isActive } = body

    // Obter gymId
    let gymId: string | undefined

    if (context.gymId) {
      gymId = context.gymId
    } else if (context.gyms && context.gyms.length > 0) {
      const firstGym = context.gyms.find((g: any) => g.status === 'ACTIVE' && g.isActive)
      gymId = firstGym?.gymId
    }

    if (!gymId) {
      return NextResponse.json(
        { error: 'Academia não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se o plano pertence à academia do usuário
    const existingPlan = await prisma.gymPlan.findUnique({
      where: { id },
    })

    if (!existingPlan || existingPlan.gymId !== gymId) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar plano
    const plan = await prisma.gymPlan.update({
      where: { id },
      data: {
        name: name || existingPlan.name,
        description: description !== undefined ? description : existingPlan.description,
        price: price !== undefined ? parseFloat(price) : existingPlan.price,
        duration: duration !== undefined ? parseInt(duration) : existingPlan.duration,
        maxMembers: maxMembers !== undefined ? parseInt(maxMembers) : existingPlan.maxMembers,
        isActive: isActive !== undefined ? isActive : existingPlan.isActive,
      },
    })

    return NextResponse.json(plan)
  } catch (error) {
    console.error('Erro ao atualizar plano:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar plano' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/gym-plans/[id]
 * Exclui um plano (apenas soft delete - desativa)
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

    if (!context || (!context.isGymAdmin && !context.isSuperAdmin)) {
      return NextResponse.json(
        { error: 'Acesso não permitido' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Obter gymId
    let gymId: string | undefined

    if (context.gymId) {
      gymId = context.gymId
    } else if (context.gyms && context.gyms.length > 0) {
      const firstGym = context.gyms.find((g: any) => g.status === 'ACTIVE' && g.isActive)
      gymId = firstGym?.gymId
    }

    if (!gymId) {
      return NextResponse.json(
        { error: 'Academia não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se o plano pertence à academia do usuário
    const existingPlan = await prisma.gymPlan.findUnique({
      where: { id },
    })

    if (!existingPlan || existingPlan.gymId !== gymId) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se há membros usando este plano
    const membersCount = await prisma.member.count({
      where: { gymPlanId: id },
    })

    if (membersCount > 0) {
      // Não pode excluir, apenas desativar
      const plan = await prisma.gymPlan.update({
        where: { id },
        data: { isActive: false },
      })

      return NextResponse.json({
        ...plan,
        warning: `Plano desativado pois possui ${membersCount} membro(s) vinculado(s)`,
      })
    }

    // Pode excluir diretamente
    await prisma.gymPlan.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Plano excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir plano:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir plano' },
      { status: 500 }
    )
  }
}
