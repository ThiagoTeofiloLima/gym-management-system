import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
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

    // Buscar a academia COM TODOS OS USUÁRIOS
    const gym = await prisma.gym.findUnique({
      where: { id: gymId },
      include: {
        users: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!gym) {
      return NextResponse.json(
        { error: 'Academia não encontrada' },
        { status: 404 }
      )
    }

    // Debug: logar estrutura da academia
    console.log('=== DEBUG - Academia ===')
    console.log('Gym ID:', gymId)
    console.log('Gym Name:', gym.name)
    console.log('Users count:', gym.users.length)
    console.log('Users:', gym.users.map(u => ({
      userId: u.userId,
      role: u.role,
      userName: u.user.name,
      userEmail: u.user.email
    })))

    // Encontrar o gestor da academia (pode ser por role GYM_ADMIN ou SUPER_ADMIN)
    const userGym = gym.users.find((ug) => ug.role === 'GYM_ADMIN' || ug.user.role === 'GYM_ADMIN')

    if (!userGym) {
      // Tenta buscar qualquer usuário vinculado à academia
      if (gym.users.length > 0) {
        console.log('Nenhum GYM_ADMIN encontrado')
        return NextResponse.json(
          { 
            error: 'Nenhum gestor (GYM_ADMIN) encontrado para esta academia. Usuários vinculados: ' + gym.users.length,
            users: gym.users.map(u => ({ name: u.user.name, email: u.user.email, role: u.role }))
          },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { error: 'Nenhum usuário vinculado a esta academia' },
        { status: 404 }
      )
    }

    const manager = userGym.user

    // Gerar nova senha segura
    const newPassword = generateSecurePassword()

    // Hash da nova senha
    const passwordHash = await hash(newPassword, 10)

    // Atualizar senha do gestor e salvar senha temporária em transação
    await prisma.$transaction(async (tx) => {
      // 1. Atualizar senha do usuário
      await tx.user.update({
        where: { id: manager.id },
        data: { passwordHash },
      })

      // 2. Salvar/atualizar senha temporária usando SQL direto
      await tx.$executeRaw`
        INSERT INTO "manager_temp_passwords" ("manager_id", "gym_id", "password", "created_at")
        VALUES (${manager.id}, ${gymId}, ${newPassword}, NOW())
        ON CONFLICT ("manager_id", "gym_id")
        DO UPDATE SET "password" = ${newPassword}, "created_at" = NOW()
      `
    })

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
