import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
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
    const existingGym = await prisma.gym.findUnique({
      where: { id },
    })

    if (!existingGym) {
      return NextResponse.json(
        { error: 'Academia não encontrada' },
        { status: 404 }
      )
    }

    // Verificar CNPJ duplicado (se foi alterado)
    if (cnpj && cnpj !== existingGym.cnpj) {
      const existingCnpj = await prisma.gym.findUnique({
        where: { cnpj },
      })
      if (existingCnpj && existingCnpj.id !== id) {
        return NextResponse.json(
          { error: 'CNPJ já cadastrado' },
          { status: 409 }
        )
      }
    }

    // Verificar email duplicado (se foi alterado)
    if (email && email !== existingGym.email) {
      const existingEmail = await prisma.gym.findUnique({
        where: { email },
      })
      if (existingEmail && existingEmail.id !== id) {
        return NextResponse.json(
          { error: 'Email já cadastrado' },
          { status: 409 }
        )
      }
    }

    const gym = await prisma.gym.update({
      where: { id },
      data: {
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
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

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

    const gym = await prisma.gym.findUnique({
      where: { id: gymId },
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

    if (!gym) {
      return NextResponse.json(
        { error: 'Academia não encontrada' },
        { status: 404 }
      )
    }

    // Excluir todos os dados vinculados em cascata
    // Ordem importa: excluir dependentes primeiro
    await prisma.$transaction([
      // 1. Excluir WorkoutMember (depende de Workout e Member)
      prisma.workoutMember.deleteMany({
        where: { workout: { gymId } },
      }),
      // 2. Excluir Attendance (depende de Member)
      prisma.attendance.deleteMany({
        where: { member: { gymId } },
      }),
      // 3. Excluir despesas
      prisma.expense.deleteMany({
        where: { gymId },
      }),
      // 4. Excluir treinos
      prisma.workout.deleteMany({
        where: { gymId },
      }),
      // 5. Excluir treinadores
      prisma.trainer.deleteMany({
        where: { gymId },
      }),
      // 6. Excluir membros
      prisma.member.deleteMany({
        where: { gymId },
      }),
      // 7. Excluir usuários vinculados à academia
      prisma.userGym.deleteMany({
        where: { gymId },
      }),
      // 8. Excluir planos da academia
      prisma.gymPlan.deleteMany({
        where: { gymId },
      }),
      // 9. Excluir todos da academia
      prisma.todo.deleteMany({
        where: { gymId },
      }),
    ])

    // Excluir academia
    await prisma.gym.delete({
      where: { id: gymId },
    })

    return NextResponse.json({
      message: 'Academia e todos os seus dados vinculados foram excluídos com sucesso',
      gymName: gym.name,
      deletedCounts: {
        users: gym._count.users,
        members: gym._count.members,
        trainers: gym._count.trainers,
        workouts: gym._count.workouts,
        expenses: gym._count.expenses,
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
