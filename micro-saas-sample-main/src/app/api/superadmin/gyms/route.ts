import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext } from '@/lib/multi-tenant'
import { hash } from 'bcryptjs'

/**
 * GET /api/superadmin/gyms
 * Lista TODAS as academias do sistema com filtros (apenas Super Admin)
 */
export async function GET(request: NextRequest) {
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

    const url = new URL(request.url)
    const search = url.searchParams.get('search')
    const plan = url.searchParams.get('plan')
    const status = url.searchParams.get('status')
    const state = url.searchParams.get('state')

    // Construir filtros
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { cnpj: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (plan && plan !== 'all') {
      where.plan = plan
    }

    if (status && status !== 'all') {
      where.isActive = status === 'active'
    }

    if (state && state !== 'all') {
      where.state = state
    }

    const gyms = await prisma.gym.findMany({
      where,
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
    console.error('Erro ao buscar academias (superadmin):', error)
    return NextResponse.json(
      { error: 'Erro ao buscar academias' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/superadmin/gyms
 * Cria uma nova academia COM gestor (apenas Super Admin)
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
    const {
      name,
      cnpj,
      email,
      phone,
      address,
      city,
      state,
      plan = 'basic',
      maxMembers = 100,
      maxUsers = 5,
      isActive = true,
      // Dados do gestor
      managerName,
      managerEmail,
      managerPhone,
      managerPassword,
    } = body

    // Validações da academia
    if (!name || !city || !state) {
      return NextResponse.json(
        { error: 'Nome, cidade e estado são obrigatórios' },
        { status: 400 }
      )
    }

    // Validações do gestor
    if (!managerName || !managerEmail) {
      return NextResponse.json(
        { error: 'Nome e email do gestor são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar senha se fornecida
    if (managerPassword && managerPassword.length < 6) {
      return NextResponse.json(
        { error: 'A senha do gestor deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Verificar se CNPJ já existe
    if (cnpj) {
      const existingCnpj = await prisma.gym.findUnique({
        where: { cnpj },
      })
      if (existingCnpj) {
        return NextResponse.json(
          { error: 'CNPJ já cadastrado' },
          { status: 409 }
        )
      }
    }

    // Verificar se email da academia já existe
    if (email) {
      const existingEmail = await prisma.gym.findUnique({
        where: { email },
      })
      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email da academia já cadastrado' },
          { status: 409 }
        )
      }
    }

    // Verificar se email do gestor já existe
    const existingManager = await prisma.user.findUnique({
      where: { email: managerEmail },
    })
    if (existingManager) {
      return NextResponse.json(
        { error: 'Email do gestor já está em uso' },
        { status: 409 }
      )
    }

    // Gerar senha automática se não fornecida
    const generatedPassword = managerPassword || generateSecurePassword()

    // Hash da senha
    const passwordHash = await hash(generatedPassword, 10)

    // Criar academia e gestor em transação
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar academia
      const gym = await tx.gym.create({
        data: {
          name,
          cnpj: cnpj || null,
          email: email || null,
          phone: phone || null,
          address: address || null,
          city,
          state,
          plan,
          maxMembers,
          maxUsers,
          isActive,
          planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
        },
      })

      // 2. Criar usuário gestor
      const manager = await tx.user.create({
        data: {
          name: managerName,
          email: managerEmail,
          role: 'GYM_ADMIN',
          emailVerified: new Date(),
          passwordHash,
        },
      })

      // 3. Vincular gestor à academia
      await tx.userGym.create({
        data: {
          userId: manager.id,
          gymId: gym.id,
          role: 'GYM_ADMIN',
          status: 'ACTIVE',
        },
      })

      // 4. Salvar senha temporária para consulta futura do Super Admin
      await tx.managerTempPassword.create({
        data: {
          managerId: manager.id,
          gymId: gym.id,
          password: generatedPassword,
        },
      })

      return { gym, manager, password: generatedPassword }
    })

    // TODO: Enviar email com credenciais para o gestor
    // await sendWelcomeEmail({
    //   to: managerEmail,
    //   name: managerName,
    //   gymName: name,
    //   password: generatedPassword,
    // })

    return NextResponse.json({
      gym: result.gym,
      manager: {
        id: result.manager.id,
        name: result.manager.name,
        email: result.manager.email,
      },
      temporaryPassword: generatedPassword,
      message: 'Academia e gestor criados com sucesso! Envie as credenciais para o gestor.',
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar academia com gestor:', error)
    return NextResponse.json(
      { error: 'Erro ao criar academia e gestor' },
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
