import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext } from '@/lib/multi-tenant'
import { hash } from 'bcryptjs'

/**
 * POST /api/superadmin/gyms/assign-manager
 * Atribui ou cria um gestor para uma academia (apenas Super Admin)
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
        { error: 'Acesso restrito ao Super Admin' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { gymId, managerName, managerEmail, managerPhone } = body

    console.log('=== Assign Manager Debug ===')
    console.log('gymId:', gymId)
    console.log('managerName:', managerName)
    console.log('managerEmail:', managerEmail)

    if (!gymId) {
      return NextResponse.json(
        { error: 'gymId é obrigatório' },
        { status: 400 }
      )
    }

    // Validar dados do gestor
    if (!managerName || !managerEmail) {
      return NextResponse.json(
        { error: 'Nome e email do gestor são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar a academia
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

    // Verificar se já existe um gestor para esta academia
    const existingUserGym = gym.users.find((ug) => ug.role === 'GYM_ADMIN')
    
    if (existingUserGym) {
      return NextResponse.json(
        { 
          error: 'Esta academia já possui um gestor vinculado',
          manager: {
            id: existingUserGym.user.id,
            name: existingUserGym.user.name,
            email: existingUserGym.user.email,
          }
        },
        { status: 409 }
      )
    }

    // Verificar se email já existe
    let manager = await prisma.user.findUnique({
      where: { email: managerEmail },
    })

    if (manager) {
      return NextResponse.json(
        { error: 'Email do gestor já está em uso por outro usuário' },
        { status: 409 }
      )
    }

    // Gerar senha automática
    const generatedPassword = generateSecurePassword()
    const passwordHash = await hash(generatedPassword, 10)

    console.log('Criando gestor e vinculando à academia...')

    // Criar gestor e vincular à academia em transação
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar usuário gestor
      const newManager = await tx.user.create({
        data: {
          name: managerName,
          email: managerEmail,
          role: 'GYM_ADMIN',
          emailVerified: new Date(),
          passwordHash,
        },
      })

      console.log('Gestor criado:', newManager.id)

      // 2. Vincular gestor à academia
      await tx.userGym.create({
        data: {
          userId: newManager.id,
          gymId: gymId,
          role: 'GYM_ADMIN',
          status: 'ACTIVE',
        },
      })

      console.log('Gestor vinculado à academia')

      // 3. Salvar senha temporária (usando upsert do Prisma)
      await tx.managerTempPassword.upsert({
        where: {
          managerId_gymId: {
            managerId: newManager.id,
            gymId: gymId,
          },
        },
        update: { password: generatedPassword },
        create: {
          managerId: newManager.id,
          gymId: gymId,
          password: generatedPassword,
        },
      })

      console.log('Senha temporária salva')

      return newManager
    })

    console.log('Gestor atribuído com sucesso!')

    return NextResponse.json({
      manager: {
        id: result.id,
        name: result.name,
        email: result.email,
      },
      temporaryPassword: generatedPassword,
      message: 'Gestor atribuído com sucesso!',
    }, { status: 201 })
  } catch (error: any) {
    console.error('=== Erro ao atribuir gestor ===')
    console.error('Error:', error)
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)
    return NextResponse.json(
      { error: 'Erro ao atribuir gestor para a academia: ' + (error?.message || 'Erro desconhecido') },
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
