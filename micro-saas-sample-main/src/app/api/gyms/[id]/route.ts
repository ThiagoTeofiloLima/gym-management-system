import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
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
    const existingGym = await prisma.gym.findUnique({
      where: { id },
    })

    if (!existingGym) {
      return NextResponse.json(
        { error: 'Academia não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se CNPJ já existe (se foi alterado)
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

    // Verificar se email já existe (se foi alterado)
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
        planExpiresAt: planExpiresAt ? new Date(planExpiresAt) : undefined,
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
          error: 'Não é possível deletar academia com dados',
          details: `A academia possui ${totalItems} registros associados`,
          counts: gym._count,
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
