import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext } from '@/lib/multi-tenant'

/**
 * GET /api/gyms
 * - Super Admin: vê todas as academias
 * - Gym Admin: vê apenas sua academia
 * - User: não tem acesso a esta endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getTenantContext()
    
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Apenas Super Admin e Gym Admin podem acessar
    if (!context.isSuperAdmin && !context.isGymAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const gymId = searchParams.get('gymId')

    // Super Admin pode ver todas ou uma específica
    if (context.isSuperAdmin) {
      if (gymId) {
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
        return NextResponse.json(gym)
      }

      // Lista todas as academias
      const gyms = await prisma.gym.findMany({
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
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(gyms)
    }

    // Gym Admin vê apenas sua academia
    if (context.gymId) {
      const gym = await prisma.gym.findUnique({
        where: { id: context.gymId },
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
      return NextResponse.json(gym)
    }

    return NextResponse.json({ error: 'No gym associated' }, { status: 400 })
  } catch (error) {
    console.error('Erro ao buscar academias:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar academias' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/gyms
 * Cria uma nova academia (apenas Super Admin)
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { 
      name, 
      cnpj, 
      email, 
      phone, 
      address, 
      city, 
      state, 
      plan = 'basic',
      maxMembers = 100,
      maxUsers = 5,
    } = body

    // Verificar se CNPJ ou email já existem
    if (cnpj) {
      const existingCnpj = await prisma.gym.findUnique({
        where: { cnpj },
      })
      if (existingCnpj) {
        return NextResponse.json(
          { error: 'CNPJ já cadastrado' },
          { status: 409 }
        )
      }
    }

    if (email) {
      const existingEmail = await prisma.gym.findUnique({
        where: { email },
      })
      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email já cadastrado' },
          { status: 409 }
        )
      }
    }

    const gym = await prisma.gym.create({
      data: {
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
        isActive: true,
        planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
      },
    })

    return NextResponse.json(gym, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar academia:', error)
    return NextResponse.json(
      { error: 'Erro ao criar academia' },
      { status: 500 }
    )
  }
}
