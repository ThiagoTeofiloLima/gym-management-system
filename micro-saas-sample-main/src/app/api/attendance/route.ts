import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext, canAccessGym } from '@/lib/multi-tenant'

/**
 * GET /api/attendance
 * Lista frequência da academia
 *
 * SEGURANÇA: Valida se o usuário tem permissão para acessar a academia especificada
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

    const url = new URL(request.url)
    const queryGymId = url.searchParams.get('gymId')

    // Determinar qual gymId usar
    let gymId: string | undefined

    if (queryGymId) {
      // Se passou gymId na query, validar se o usuário tem acesso
      const hasAccess = await canAccessGym(session.user.id, queryGymId)
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have access to this gym' },
          { status: 403 }
        )
      }
      gymId = queryGymId
    } else if (context.gymId) {
      gymId = context.gymId
    } else if (context.gyms && context.gyms.length > 0) {
      const firstGym = context.gyms.find((g: any) => g.status === 'ACTIVE' && g.isActive)
      gymId = firstGym?.gymId
    }

    if (!gymId) {
      return NextResponse.json([])
    }

    // Buscar membros da academia primeiro
    const members = await db.findMembers({ gymId })

    const memberIds = members.map(m => m.id)

    if (memberIds.length === 0) {
      return NextResponse.json([])
    }

    // Buscar todos os registros de attendance e filtrar pelos membros da academia
    const allAttendance = await db.findAttendanceRecords({})

    // Filtrar apenas os registros dos membros desta academia
    const filteredAttendance = allAttendance.filter(a => memberIds.includes(a.memberId))

    // Adicionar informações do membro em cada registro
    const attendanceWithMembers = filteredAttendance.map(record => {
      const member = members.find(m => m.id === record.memberId)
      return {
        ...record,
        member: member ? {
          id: member.id,
          name: member.name,
          email: member.email,
        } : null,
      }
    })

    return NextResponse.json(attendanceWithMembers)
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
 *
 * SEGURANÇA: Valida se o usuário tem permissão para acessar a academia especificada
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      console.error('❌ Attendance POST: Session ou usuário ausente')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔵 Attendance POST: Session user ID:', session.user.id)
    console.log('🔵 Attendance POST: Session user role:', session.user.role)

    const context = await getTenantContext()

    if (!context) {
      console.error('❌ Attendance POST: Contexto multi-tenant não encontrado')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const queryGymId = url.searchParams.get('gymId')

    // Determinar qual gymId usar
    let gymId: string | undefined

    if (queryGymId) {
      // Se passou gymId na query, validar se o usuário tem acesso
      const hasAccess = await canAccessGym(session.user.id, queryGymId)
      console.log('🔵 Attendance POST: hasAccess para gymId', queryGymId, '=', hasAccess)
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have access to this gym' },
          { status: 403 }
        )
      }
      gymId = queryGymId
    } else if (context.gymId) {
      gymId = context.gymId
    } else if (context.gyms && context.gyms.length > 0) {
      const firstGym = context.gyms.find((g: any) => g.status === 'ACTIVE' && g.isActive)
      gymId = firstGym?.gymId
    }

    if (!gymId) {
      console.error('❌ Attendance POST: gymId não determinado')
      return NextResponse.json(
        { error: 'gymId is required' },
        { status: 400 }
      )
    }

    console.log('🔵 Attendance POST: gymId selecionado:', gymId)

    const body = await request.json()
    const { memberId, date, checkIn, checkOut } = body

    console.log('🔵 Attendance POST: Body:', { memberId, date, checkIn, checkOut })
    console.log('🔵 Attendance POST: Body raw:', body)

    if (!memberId || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: memberId, date' },
        { status: 400 }
      )
    }

    // Verificar se membro pertence à academia
    const member = await db.findMemberById(memberId)
    console.log('🔵 Attendance POST: Member found:', member ? member.id : 'null', 'GymId:', member?.gymId)

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    if (member.gymId !== gymId) {
      console.error('❌ Attendance POST: Member gymId mismatch:', member.gymId, 'vs', gymId)
      return NextResponse.json(
        { error: 'Member does not belong to this gym' },
        { status: 400 }
      )
    }

    // Validar memberEmail
    if (!member.email) {
      console.error('❌ Attendance POST: Member sem email:', member.id)
      return NextResponse.json(
        { error: 'Member email is required' },
        { status: 400 }
      )
    }

    // Criar attendance record
    console.log('🔵 Attendance POST: Criando registro...', {
      date,
      memberId,
      memberEmail: member.email,
      checkIn: checkIn || null,
      checkOut: checkOut || null,
      status: 'Presente',
      userId: session.user.id,
    })

    // Converter data e hora para formato ISO correto
    const dateISO = new Date(date).toISOString()
    let checkInISO: string | null = null
    let checkOutISO: string | null = null

    if (checkIn) {
      // Combina data + hora de checkIn
      checkInISO = new Date(`${date}T${checkIn}`).toISOString()
    }

    if (checkOut) {
      // Combina data + hora de checkOut
      checkOutISO = new Date(`${date}T${checkOut}`).toISOString()
    }

    let attendance: any

    try {
      attendance = await db.createAttendance({
        date: dateISO,
        memberId,
        memberEmail: member.email,
        checkIn: checkInISO,
        checkOut: checkOutISO,
        status: 'Presente',
        userId: session.user.id,
      })

      console.log('✅ Attendance POST: Registro criado:', attendance.id)
    } catch (dbError) {
      console.error('❌ Attendance POST: Erro ao criar registro no banco:', dbError)
      console.error('❌ Attendance POST: Detalhes do erro:', JSON.stringify(dbError, null, 2))
      throw dbError
    }

    // Atualizar última visita do membro
    await db.updateMember(memberId, {
      lastVisit: date,
    })

    // Retornar attendance com dados do membro
    const attendanceWithMember = {
      ...attendance,
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
      },
    }

    return NextResponse.json(attendanceWithMember, { status: 201 })
  } catch (error) {
    console.error('❌ Error recording attendance:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('❌ Error message:', error instanceof Error ? error.message : String(error))
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}
