import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext } from '@/lib/multi-tenant'

/**
 * PATCH /api/gyms/[id]
 * Atualiza uma academia (apenas Super Admin)
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
        { error: 'Forbidden: Super Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const {
      name,
      cnpj,
      email,
      phone,
      address,
      city,
      state,
      isActive,
      plan,
      maxMembers,
      maxUsers,
      planExpiresAt,
    } = body

    // Verificar se academia existe
    const existingGym = await db.findGymById(id)

    if (!existingGym) {
      return NextResponse.json(
        { error: 'Academia não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se CNPJ já existe (se foi alterado)
    if (cnpj && cnpj !== existingGym.cnpj) {
      const allGyms = await db.findAllGyms()
      const existingCnpj = allGyms.find(g => g.cnpj === cnpj && g.id !== id)
      if (existingCnpj) {
        return NextResponse.json(
          { error: 'CNPJ já cadastrado' },
          { status: 409 }
        )
      }
    }

    // Verificar se email já existe (se foi alterado)
    if (email && email !== existingGym.email) {
      const allGyms = await db.findAllGyms()
      const existingEmail = allGyms.find(g => g.email === email && g.id !== id)
      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email já cadastrado' },
          { status: 409 }
        )
      }
    }

    const gym = await db.updateGym(id, {
      name,
      cnpj,
      email,
      phone,
      address,
      city,
      state,
      isActive,
      plan,
      maxMembers,
      maxUsers,
      planExpiresAt: planExpiresAt ? new Date(planExpiresAt).toISOString() : undefined,
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
 * Deleta uma academia (apenas Super Admin, apenas se não tiver dados)
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

    if (!context || !context.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Super Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verificar se a academia existe
    const gym = await db.findGymById(id)

    if (!gym) {
      return NextResponse.json(
        { error: 'Academia não encontrada' },
        { status: 404 }
      )
    }

    // Contar registros associados
    const allUserGyms = await db.findUserGymsByUserId(session.user.id)
    const usersCount = allUserGyms.filter(ug => ug.gymId === id).length

    const allMembers = await db.findMembers({ gymId: id })
    const membersCount = allMembers.length

    const allTrainers = await db.findTrainers({ gymId: id })
    const trainersCount = allTrainers.length

    const allWorkouts = await db.findWorkouts({ gymId: id })
    const workoutsCount = allWorkouts.length

    const allExpenses = await db.findExpenses({ gymId: id })
    const expensesCount = allExpenses.length

    const totalItems =
      usersCount +
      membersCount +
      trainersCount +
      workoutsCount +
      expensesCount

    if (totalItems > 0) {
      return NextResponse.json(
        {
          error: 'Não é possível deletar academia com dados',
          details: `A academia possui ${totalItems} registros associados`,
          counts: {
            users: usersCount,
            members: membersCount,
            trainers: trainersCount,
            workouts: workoutsCount,
            expenses: expensesCount,
          },
        },
        { status: 400 }
      )
    }

    await db.deleteGym(id)

    return NextResponse.json({ message: 'Academia deletada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar academia:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar academia' },
      { status: 500 }
    )
  }
}
