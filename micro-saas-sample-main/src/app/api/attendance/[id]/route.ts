import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext, canAccessGym } from '@/lib/multi-tenant'

/**
 * GET /api/attendance/[id]
 * Retorna registros de frequência de um membro específico
 *
 * SEGURANÇA: Valida se o usuário tem permissão para acessar a academia do membro
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return Response.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const context = await getTenantContext()

    if (!context) {
      return Response.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: memberId } = params

    if (!memberId) {
      return Response.json(
        { message: 'Member ID is required' },
        { status: 400 }
      )
    }

    // Verificar se o membro existe
    const member = await db.findMemberById(memberId)

    if (!member) {
      return Response.json(
        { message: 'Member not found' },
        { status: 404 }
      )
    }

    // VALIDAÇÃO DE SEGURANÇA: Verificar se usuário tem acesso à academia deste membro
    const hasAccess = await canAccessGym(session.user.id, member.gymId!)
    if (!hasAccess) {
      return Response.json(
        { message: 'Forbidden: You do not have access to this gym' },
        { status: 403 }
      )
    }

    // Get all attendance records for this member
    const memberAttendance = await db.findAttendanceRecords({ memberId })

    // Adicionar informações do membro em cada registro
    const attendanceWithMember = memberAttendance.map(record => ({
      ...record,
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        status: member.status,
      },
    }))

    return Response.json(attendanceWithMember)
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/attendance/[id]
 * Registra frequência para um membro específico
 *
 * SEGURANÇA: Valida se o usuário tem permissão para acessar a academia do membro
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return Response.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const context = await getTenantContext()

    if (!context) {
      return Response.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: memberId } = params
    const body = await request.json()
    const { date, checkIn, checkOut } = body

    // Validate required fields
    if (!memberId || !date) {
      return Response.json(
        { message: 'Missing required fields: memberId and date are required' },
        { status: 400 }
      )
    }

    // Check if member exists
    const member = await db.findMemberById(memberId)

    if (!member) {
      return Response.json(
        { message: 'Member not found' },
        { status: 404 }
      )
    }

    // VALIDAÇÃO DE SEGURANÇA: Verificar se usuário tem acesso à academia deste membro
    const hasAccess = await canAccessGym(session.user.id, member.gymId!)
    if (!hasAccess) {
      return Response.json(
        { message: 'Forbidden: You do not have access to this gym' },
        { status: 403 }
      )
    }

    // Create attendance record
    const attendance = await db.createAttendance({
      date,
      memberId,
      memberEmail: member.email,
      checkIn: checkIn || null,
      checkOut: checkOut || null,
      status: 'Presente',
      userId: session.user.id,
    })

    // Update the member's last visit date
    await db.updateMember(memberId, {
      lastVisit: date,
    })

    return Response.json(attendance, { status: 201 })
  } catch (error) {
    console.error('Error recording attendance:', error)
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/attendance/[id]
 * Atualiza registro de frequência
 *
 * SEGURANÇA: Valida se o usuário tem permissão para acessar a academia do registro
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return Response.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const context = await getTenantContext()

    if (!context) {
      return Response.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: attendanceId } = params
    const body = await request.json()
    const { date, checkIn, checkOut, status } = body

    // Check if attendance record exists
    const attendanceRecord = await db.findAttendanceById(attendanceId)

    if (!attendanceRecord) {
      return Response.json(
        { message: 'Attendance record not found' },
        { status: 404 }
      )
    }

    // Buscar informações do membro para validar acesso à academia
    const member = await db.findMemberById(attendanceRecord.memberId)

    if (!member) {
      return Response.json(
        { message: 'Member not found' },
        { status: 404 }
      )
    }

    // VALIDAÇÃO DE SEGURANÇA: Verificar se usuário tem acesso à academia deste registro
    const hasAccess = await canAccessGym(session.user.id, member.gymId!)
    if (!hasAccess) {
      return Response.json(
        { message: 'Forbidden: You do not have access to this gym' },
        { status: 403 }
      )
    }

    // Update attendance record
    const updatedAttendance = await db.updateAttendance(attendanceId, {
      date,
      checkIn,
      checkOut,
      status,
    })

    return Response.json(updatedAttendance)
  } catch (error) {
    console.error('Error updating attendance:', error)
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/attendance/[id]
 * Exclui registro de frequência
 *
 * SEGURANÇA: Valida se o usuário tem permissão para acessar a academia do registro
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return Response.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const context = await getTenantContext()

    if (!context) {
      return Response.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: attendanceId } = params

    // Check if attendance record exists
    const attendanceRecord = await db.findAttendanceById(attendanceId)

    if (!attendanceRecord) {
      return Response.json(
        { message: 'Attendance record not found' },
        { status: 404 }
      )
    }

    // Buscar informações do membro para validar acesso à academia
    const member = await db.findMemberById(attendanceRecord.memberId)

    if (!member) {
      return Response.json(
        { message: 'Member not found' },
        { status: 404 }
      )
    }

    // VALIDAÇÃO DE SEGURANÇA: Verificar se usuário tem acesso à academia deste registro
    const hasAccess = await canAccessGym(session.user.id, member.gymId!)
    if (!hasAccess) {
      return Response.json(
        { message: 'Forbidden: You do not have access to this gym' },
        { status: 403 }
      )
    }

    // Delete attendance record
    await db.deleteAttendance(attendanceId)

    return Response.json({ message: 'Attendance record deleted successfully' })
  } catch (error) {
    console.error('Error deleting attendance:', error)
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
