import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext } from '@/lib/multi-tenant'

/**
 * GET /api/gyms/users
 * Lista usuários de uma academia (Super Admin ou Gym Admin)
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

    const searchParams = request.nextUrl.searchParams
    const gymId = searchParams.get('gymId')

    // Super Admin pode ver usuários de qualquer academia
    if (context.isSuperAdmin) {
      if (!gymId) {
        // Lista todos os usuários do sistema
        const users = await db.findAllUsers()
        const usersWithGyms = await Promise.all(
          users.map(async (u) => {
            const userGyms = await db.findUserGymsWithDetails(u.id)
            return {
              ...u,
              gyms: userGyms.map((ug: any) => ({
                id: ug.id,
                role: ug.role,
                status: ug.status,
                gym: ug.gym,
              })),
            }
          })
        )
        return NextResponse.json(usersWithGyms)
      }

      // Usuários de uma academia específica
      const userGyms = await db.findUserGymsByGymId(gymId)
      return NextResponse.json(userGyms)
    }

    // Gym Admin vê apenas usuários da sua academia
    if (context.isGymAdmin && context.gymId) {
      const userGyms = await db.findUserGymsByGymId(context.gymId)
      return NextResponse.json(userGyms)
    }

    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/gyms/users
 * Adiciona usuário a uma academia (Super Admin)
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
    const { userId, gymId, role = 'USER', status = 'ACTIVE' } = body

    if (!userId || !gymId) {
      return NextResponse.json(
        { error: 'userId e gymId são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se usuário existe
    const user = await db.findUserById(userId)

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se academia existe
    const gym = await db.findGymById(gymId)

    if (!gym) {
      return NextResponse.json(
        { error: 'Academia não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se usuário já está na academia
    const existingUserGym = await db.findUserGymByUserIdGymId(userId, gymId)

    if (existingUserGym) {
      return NextResponse.json(
        { error: 'Usuário já pertence a esta academia' },
        { status: 409 }
      )
    }

    // Adicionar usuário à academia
    const userGym = await db.createUserGym({
      userId,
      gymId,
      role,
      status,
    })

    // Buscar detalhes do usuário e academia
    const userWithDetails = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    }

    const gymWithDetails = {
      id: gym.id,
      name: gym.name,
    }

    return NextResponse.json({
      ...userGym,
      user: userWithDetails,
      gym: gymWithDetails,
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao adicionar usuário à academia:', error)
    return NextResponse.json(
      { error: 'Erro ao adicionar usuário à academia' },
      { status: 500 }
    )
  }
}
