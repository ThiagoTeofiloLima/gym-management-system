import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext } from '@/lib/multi-tenant'

/**
 * GET /api/gyms
 * Lista academias do usuário logado
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const gymId = url.searchParams.get('gymId')

    // Buscar vínculo do usuário com academias
    const userGyms = await prisma.userGym.findMany({
      where: { userId: session.user.id, status: 'ACTIVE' },
      include: {
        gym: {
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
        },
      },
    })

    // Se tiver gymId específico e pertencer ao usuário
    if (gymId) {
      const userGym = userGyms.find(ug => ug.gymId === gymId)
      if (!userGym) {
        return NextResponse.json({ error: 'Gym not found or access denied' }, { status: 404 })
      }
      return NextResponse.json(userGym.gym)
    }

    // Retorna apenas as academias do usuário
    const gyms = userGyms.map(ug => ({
      ...ug.gym,
      role: ug.role,
      userGymStatus: ug.status,
    }))
    
    return NextResponse.json(gyms)
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
