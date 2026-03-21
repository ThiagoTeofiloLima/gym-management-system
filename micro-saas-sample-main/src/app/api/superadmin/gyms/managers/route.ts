import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/services/database'
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
    const allUsers = await db.findAllUsers()
    const gymAdmins = allUsers.filter(user => user.role === 'GYM_ADMIN')

    // Buscar dados adicionais para cada gestor
    const managers = await Promise.all(
      gymAdmins.map(async (admin) => {
        // Buscar academias vinculadas ao gestor
        const userGyms = await db.findUserGymsByUserId(admin.id)
        const gymInfo = userGyms[0]
        
        // Buscar senha temporária se existir
        let tempPassword: string | null = null
        if (gymInfo?.gymId) {
          const tempPwdRecord = await db.findManagerTempPassword(admin.id, gymInfo.gymId)
          tempPassword = tempPwdRecord?.password || null
        }

        return {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          hasPassword: !!admin.passwordHash,
          gymId: gymInfo?.gymId || null,
          gymName: (gymInfo?.gym as any)?.name || null,
          tempPassword,
        }
      })
    )

    return NextResponse.json(managers)
  } catch (error) {
    console.error('Erro ao buscar gestores:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar gestores' },
      { status: 500 }
    )
  }
}
