import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext } from '@/lib/multi-tenant'

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
 * Exclui uma academia (apenas Super Admin)
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

    const { id } = await params

    // Verificar se academia existe
    const gym = await prisma.gym.findUnique({
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

    if (!gym) {
      return NextResponse.json(
        { error: 'Academia não encontrada' },
        { status: 404 }
      )
    }

    const totalItems =
      gym._count.users +
      gym._count.members +
      gym._count.trainers +
      gym._count.workouts +
      gym._count.expenses

    if (totalItems > 0) {
      return NextResponse.json(
        {
          error: 'Não é possível excluir academia com dados vinculados',
          details: `A academia possui ${totalItems} registros associados (usuários, membros, treinadores, treinos ou despesas).`,
          counts: gym._count,
        },
        { status: 400 }
      )
    }

    await prisma.gym.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Academia excluída com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir academia:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir academia' },
      { status: 500 }
    )
  }
}
