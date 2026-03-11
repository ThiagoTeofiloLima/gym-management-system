import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/multi-tenant'

/**
 * GET /api/gyms
 * Lista todas as academias (apenas admin)
 * Ou lista apenas a academia do usuário (user)
 */
export async function GET(request: NextRequest) {
  try {
    // Em produção, obter o usuário da sessão
    // Por enquanto, vamos buscar todas para admin ou filtrar por gymId
    const searchParams = request.nextUrl.searchParams
    const gymId = searchParams.get('gymId')

    if (gymId) {
      // Busca uma academia específica
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

    // Lista todas as academias com contagem de dados
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
 * Cria uma nova academia
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, cnpj, email, phone, city, state, plan = 'basic' } = body

    const gym = await prisma.gym.create({
      data: {
        name,
        cnpj,
        email,
        phone,
        city,
        state,
        plan,
        isActive: true,
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
