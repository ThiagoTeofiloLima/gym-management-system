import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext } from '@/lib/multi-tenant'

/**
 * GET /api/superadmin/gyms/managers
 * Lista todos os gestores de academias com suas credenciais (apenas Super Admin)
 */
export async function GET() {
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

    // Buscar todos os usuários com role GYM_ADMIN
    const gymAdmins = await prisma.user.findMany({
      where: {
        role: 'GYM_ADMIN',
      },
      include: {
        gyms: {
          include: {
            gym: true,
          },
        },
        tempPasswords: true,
      },
    })

    // Formatrar dados para exibição
    const managers = gymAdmins.map((admin) => {
      const gymInfo = admin.gyms[0]
      return {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        hasPassword: !!admin.passwordHash,
        gymId: gymInfo?.gymId,
        gymName: gymInfo?.gym.name,
        tempPassword: admin.tempPasswords[0]?.password || null,
      }
    })

    return NextResponse.json(managers)
  } catch (error) {
    console.error('Erro ao buscar gestores:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar gestores' },
      { status: 500 }
    )
  }
}
