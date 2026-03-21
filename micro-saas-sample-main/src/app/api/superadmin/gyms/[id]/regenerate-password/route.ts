import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext } from '@/lib/multi-tenant'
import { hash } from 'bcryptjs'

/**
 * POST /api/superadmin/gyms/[id]/regenerate-password
 * Gera uma nova senha temporária para o gestor da academia (apenas Super Admin)
 */
export async function POST(
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
        { error: 'Acesso restrito ao Super Admin' },
        { status: 403 }
      )
    }

    const { id } = await params
    const gymId = id

    // Buscar a academia
    const gym = await db.findGymById(gymId)

    if (!gym) {
      return NextResponse.json(
        { error: 'Academia não encontrada' },
        { status: 404 }
      )
    }

    // Buscar usuários vinculados à academia
    const userGyms = await db.findUserGymsByGymId(gymId)

    // Debug: logar estrutura da academia
    console.log('=== DEBUG - Academia ===')
    console.log('Gym ID:', gymId)
    console.log('Gym Name:', gym.name)
    console.log('Users count:', userGyms.length)
    console.log('Users:', userGyms.map(ug => ({
      userId: ug.userId,
      role: ug.role,
    })))

    // Encontrar o gestor da academia (pode ser por role GYM_ADMIN)
    const userGym = userGyms.find((ug) => ug.role === 'GYM_ADMIN')

    if (!userGym) {
      // Tenta buscar qualquer usuário vinculado à academia
      if (userGyms.length > 0) {
        console.log('Nenhum GYM_ADMIN encontrado')
        return NextResponse.json(
          {
            error: 'Nenhum gestor (GYM_ADMIN) encontrado para esta academia. Usuários vinculados: ' + userGyms.length,
            users: userGyms.map(ug => ({ userId: ug.userId, role: ug.role }))
          },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'Nenhum usuário vinculado a esta academia' },
        { status: 404 }
      )
    }

    // Buscar dados completos do gestor
    const manager = await db.findUserById(userGym.userId)

    if (!manager) {
      return NextResponse.json(
        { error: 'Gestor não encontrado' },
        { status: 404 }
      )
    }

    // Gerar nova senha segura
    const newPassword = generateSecurePassword()

    // Hash da nova senha
    const passwordHash = await hash(newPassword, 10)

    // Atualizar senha do gestor e salvar senha temporária em sequência
    try {
      // 1. Atualizar senha do usuário
      await db.updateUser(manager.id, { passwordHash })

      // 2. Verificar se já existe senha temporária e atualizar ou criar
      const existingTempPassword = await db.findManagerTempPassword(manager.id, gymId)

      if (existingTempPassword) {
        await db.updateManagerTempPassword(manager.id, gymId, {
          password: newPassword,
        })
      } else {
        await db.createManagerTempPassword({
          managerId: manager.id,
          gymId,
          password: newPassword,
        })
      }
    } catch (error: any) {
      console.error('Erro ao atualizar senha:', error)
      throw error
    }

    return NextResponse.json({
      manager: {
        id: manager.id,
        name: manager.name,
        email: manager.email,
      },
      temporaryPassword: newPassword,
      message: 'Senha regenerada com sucesso!',
    })
  } catch (error) {
    console.error('Erro ao regenerar senha do gestor:', error)
    return NextResponse.json(
      { error: 'Erro ao regenerar senha do gestor' },
      { status: 500 }
    )
  }
}

// Função para gerar senha segura
function generateSecurePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*'

  const allChars = uppercase + lowercase + numbers + symbols

  // Garantir pelo menos um caractere de cada tipo
  let password = ''
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]

  // Preencher o restante
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Embaralhar
  return password.split('').sort(() => Math.random() - 0.5).join('')
}
