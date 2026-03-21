import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext, canAccessGym } from '@/lib/multi-tenant'

/**
 * PUT /api/gym-plans/[id]
 * Atualiza um plano existente
 *
 * SEGURANÇA: Valida se o usuário tem permissão para acessar a academia do plano
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

    // Verificar se o plano existe
    const existingPlan = await db.findGymPlanById(id)

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    if (!existingPlan.gymId) {
      return NextResponse.json(
        { error: 'Plano não tem associação com academia' },
        { status: 400 }
      )
    }

    // VALIDAÇÃO DE SEGURANÇA: Verificar se usuário tem acesso à academia deste plano
    const hasAccess = await canAccessGym(session.user.id, existingPlan.gymId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this gym' },
        { status: 403 }
      )
    }

    // Atualizar plano
    const plan = await db.updateGymPlan(id, {
      name: name || existingPlan.name,
      description: description !== undefined ? description : existingPlan.description,
      price: price !== undefined ? parseFloat(price) : existingPlan.price,
      duration: duration !== undefined ? parseInt(duration) : existingPlan.duration,
      maxMembers: maxMembers !== undefined ? parseInt(maxMembers) : existingPlan.maxMembers,
      isActive: isActive !== undefined ? isActive : existingPlan.isActive,
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
 *
 * SEGURANÇA: Valida se o usuário tem permissão para acessar a academia do plano
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

    // Verificar se o plano existe
    const existingPlan = await db.findGymPlanById(id)

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    // VALIDAÇÃO DE SEGURANÇA: Verificar se usuário tem acesso à academia deste plano
    const hasAccess = await canAccessGym(session.user.id, existingPlan.gymId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this gym' },
        { status: 403 }
      )
    }

    // Verificar se há membros usando este plano
    const allMembers = await db.findMembers({ gymId: existingPlan.gymId })
    const membersCount = allMembers.filter(m => m.gymPlanId === id).length

    if (membersCount > 0) {
      // Não pode excluir, apenas desativar
      const plan = await db.updateGymPlan(id, {
        isActive: false,
      })

      return NextResponse.json({
        ...plan,
        warning: `Plano desativado pois possui ${membersCount} membro(s) vinculado(s)`,
      })
    }

    // Pode excluir diretamente
    await db.deleteGymPlan(id)

    return NextResponse.json({ message: 'Plano excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir plano:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir plano' },
      { status: 500 }
    )
  }
}
