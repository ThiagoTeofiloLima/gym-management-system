import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/services/auth'

/**
 * GET /api/attendance
 * Lista frequência da academia
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const gymId = url.searchParams.get('gymId')

    if (!gymId) {
      return NextResponse.json([])
    }

    // Buscar membros da academia primeiro
    const members = await prisma.member.findMany({
      where: { gymId },
      select: { id: true },
    })

    const memberIds = members.map(m => m.id)

    if (memberIds.length === 0) {
      return NextResponse.json([])
    }

    // Buscar attendance dos membros
    const attendance = await prisma.attendance.findMany({
      where: {
        memberId: { in: memberIds },
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(attendance)
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/attendance
 * Registra frequência
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const gymId = url.searchParams.get('gymId')

    if (!gymId) {
      return NextResponse.json(
        { error: 'gymId is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { memberId, date, checkIn, checkOut } = body

    if (!memberId || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: memberId, date' },
        { status: 400 }
      )
    }

    // Verificar se membro pertence à academia
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    })

    if (!member || member.gymId !== gymId) {
      return NextResponse.json(
        { error: 'Member not found or does not belong to this gym' },
        { status: 404 }
      )
    }

    // Criar attendance record
    const attendance = await prisma.attendance.create({
      data: {
        date,
        memberId,
        memberEmail: member.email,
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        status: 'Presente',
        userId: session.user.id,
      },
    })

    // Atualizar última visita do membro
    await prisma.member.update({
      where: { id: memberId },
      data: {
        lastVisit: date,
      },
    })

    return NextResponse.json(attendance, { status: 201 })
  } catch (error) {
    console.error('Error recording attendance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
