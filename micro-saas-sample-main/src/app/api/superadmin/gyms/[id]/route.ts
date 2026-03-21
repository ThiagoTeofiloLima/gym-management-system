import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext } from '@/lib/multi-tenant'
import { compare } from 'bcryptjs'

/**
 * PUT /api/superadmin/gyms/[id]
 * Atualiza uma academia (apenas Super Admin)
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

    if (!context || !context.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Acesso restrito ao Super Admin' },
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
      plan,
      maxMembers,
      maxUsers,
      isActive,
    } = body

    // Validações
    if (!name || !city || !state) {
      return NextResponse.json(
        { error: 'Nome, cidade e estado são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se academia existe
    const existingGym = await db.findGymById(id)

    if (!existingGym) {
      return NextResponse.json(
        { error: 'Academia não encontrada' },
        { status: 404 }
      )
    }

    // Verificar CNPJ duplicado (se foi alterado)
    if (cnpj && cnpj !== existingGym.cnpj) {
      const existingCnpj = await db.findGymByCnpj(cnpj)
      if (existingCnpj && existingCnpj.id !== id) {
        return NextResponse.json(
          { error: 'CNPJ já cadastrado' },
          { status: 409 }
        )
      }
    }

    // Verificar email duplicado (se foi alterado)
    if (email && email !== existingGym.email) {
      const existingEmail = await db.findGymByEmail(email)
      if (existingEmail && existingEmail.id !== id) {
        return NextResponse.json(
          { error: 'Email já cadastrado' },
          { status: 409 }
        )
      }
    }

    const gym = await db.updateGym(id, {
      name,
      cnpj: cnpj || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      city,
      state,
      plan,
      maxMembers,
      maxUsers,
      isActive,
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
 * DELETE /api/superadmin/gyms/[id]
 * Exclui uma academia e todos os seus dados vinculados (apenas Super Admin)
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
        { error: 'Acesso restrito ao Super Admin' },
        { status: 403 }
      )
    }

    const { id: gymId } = await params

    // Obter senha do query param
    const url = new URL(request.url)
    const password = url.searchParams.get('password')

    // Validar senha do Super Admin
    if (!password || password.trim() === '') {
      return NextResponse.json(
        { error: 'Senha do Super Admin é obrigatória para confirmar a exclusão.' },
        { status: 400 }
      )
    }

    // Buscar usuário atual para validar senha
    const currentUser = await db.findUserById(session.user.id)

    if (!currentUser || !currentUser.passwordHash) {
      return NextResponse.json(
        { error: 'Usuário não encontrado ou não possui senha cadastrada.' },
        { status: 404 }
      )
    }

    // Validar senha
    const isPasswordValid = await compare(password, currentUser.passwordHash)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Senha do Super Admin inválida.' },
        { status: 401 }
      )
    }

    const gym = await db.findGymById(gymId)

    if (!gym) {
      return NextResponse.json(
        { error: 'Academia não encontrada' },
        { status: 404 }
      )
    }

    // Obter contagens antes de excluir
    const counts = await db.getGymCounts(gymId)

    // Excluir todos os dados vinculados em cascata
    // Ordem importa: excluir dependentes primeiro
    
    // 1. Excluir WorkoutMember (depende de Workout)
    await db.deleteWorkoutMembersByWorkoutGymId(gymId)
    
    // 2. Excluir Attendance (depende de Member)
    await db.deleteAttendanceByGymId(gymId)
    
    // 3. Excluir despesas
    const expenses = await db.findExpenses({ gymId })
    for (const expense of expenses) {
      await db.deleteExpense(expense.id)
    }
    
    // 4. Excluir treinos
    const workouts = await db.findWorkouts({ gymId })
    for (const workout of workouts) {
      await db.deleteWorkout(workout.id)
    }
    
    // 5. Excluir treinadores
    const trainers = await db.findTrainers({ gymId })
    for (const trainer of trainers) {
      await db.deleteTrainer(trainer.id)
    }
    
    // 6. Excluir membros
    const members = await db.findMembers({ gymId })
    for (const member of members) {
      await db.deleteMember(member.id)
    }
    
    // 7. Excluir usuários vinculados à academia
    await db.deleteUserGymsByGymId(gymId)
    
    // 8. Excluir planos da academia
    await db.deleteGymPlansByGymId(gymId)
    
    // 9. Excluir todos da academia
    await db.deleteTodosByGymId(gymId)

    // Excluir academia
    await db.deleteGym(gymId)

    return NextResponse.json({
      message: 'Academia e todos os seus dados vinculados foram excluídos com sucesso',
      gymName: gym.name,
      deletedCounts: {
        users: counts.users,
        members: counts.members,
        trainers: counts.trainers,
        workouts: counts.workouts,
        expenses: counts.expenses,
      },
    })
  } catch (error) {
    console.error('Erro ao excluir academia:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir academia', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
