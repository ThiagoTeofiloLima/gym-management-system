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

    // ============================================
    // VERIFICAR GESTOR EXISTENTE OU NOVO
    // ============================================
    // Se email já existe, apenas vincula a nova academia ao gestor
    // Se email não existe, cria novo gestor
    let manager = await prisma.user.findUnique({
      where: { email: managerEmail },
      include: {
        gyms: true,
      },
    })

    let passwordHash: string | null = null
    let generatedPassword: string | null = null
    let isNewManager = false

    if (manager) {
      // Gestor já existe - verifica se já é GYM_ADMIN
      if (manager.role !== 'GYM_ADMIN') {
        return NextResponse.json(
          { error: 'Usuário existente não tem perfil de gestor (GYM_ADMIN)' },
          { status: 409 }
        )
      }

      // Verificar se gestor já está vinculado a esta academia (por email da academia)
      // Isso evita vínculo duplicado
      const existingLink = manager.gyms.find(
        (g: any) => g.gym.email === email || g.gym.cnpj === cnpj
      )
      
      if (existingLink) {
        return NextResponse.json(
          { error: 'Gestor já está vinculado a uma academia com mesmo email ou CNPJ' },
          { status: 409 }
        )
      }

      console.log(`✅ Gestor "${manager.name}" já existe. Nova academia será vinculada.`)
    } else {
      // Gestor não existe - criar novo
      isNewManager = true

      // Validar senha se fornecida para novo gestor
      if (managerPassword && managerPassword.length < 6) {
        return NextResponse.json(
          { error: 'A senha do gestor deve ter pelo menos 6 caracteres' },
          { status: 400 }
        )
      }

      // Gerar senha automática se não fornecida
      generatedPassword = managerPassword || generateSecurePassword()

      // Hash da senha
      passwordHash = await hash(generatedPassword, 10)

      console.log(`🆕 Criando novo gestor: ${managerEmail}`)
    }

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

      // 2. Se gestor é novo, criar usuário
      if (isNewManager && passwordHash) {
        manager = await tx.user.create({
          data: {
            name: managerName,
            email: managerEmail,
            role: 'GYM_ADMIN',
            emailVerified: new Date(),
            passwordHash,
          },
        })
      } else if (manager && !isNewManager) {
        // Gestor já existe - apenas atualizar nome se diferente
        if (manager.name !== managerName) {
          manager = await tx.user.update({
            where: { id: manager.id },
            data: {
              name: managerName,
            },
          })
        }
      }

      if (!manager) {
        throw new Error('Gestor não definido após transação')
      }

      // 3. Verificar se já existe vínculo entre este gestor e academia
      const existingUserGym = await tx.userGym.findUnique({
        where: {
          userId_gymId: {
            userId: manager.id,
            gymId: gym.id,
          },
        },
      })

      if (existingUserGym) {
        throw new Error('Gestor já está vinculado a esta academia')
      }

      // 4. Vincular gestor à academia (novo vínculo ou reativar existente)
      await tx.userGym.upsert({
        where: {
          userId_gymId: {
            userId: manager.id,
            gymId: gym.id,
          },
        },
        update: {
          role: 'GYM_ADMIN',
          status: 'ACTIVE',
        },
        create: {
          userId: manager.id,
          gymId: gym.id,
          role: 'GYM_ADMIN',
          status: 'ACTIVE',
        },
      })

      // 5. Se gestor é novo, salvar senha temporária
      if (isNewManager && generatedPassword) {
        await tx.managerTempPassword.create({
          data: {
            managerId: manager.id,
            gymId: gym.id,
            password: generatedPassword,
          },
        })
      }

      return { 
        gym, 
        manager, 
        password: generatedPassword,
        isNewManager 
      }
    })

    // TODO: Enviar email com credenciais para o gestor (apenas se novo gestor)
    // if (isNewManager) {
    //   await sendWelcomeEmail({
    //     to: managerEmail,
    //     name: managerName,
    //     gymName: name,
    //     password: generatedPassword,
    //   })
    // }

    return NextResponse.json({
      gym: result.gym,
      manager: {
        id: result.manager.id,
        name: result.manager.name,
        email: result.manager.email,
        existingManager: !result.isNewManager,
        totalGyms: result.manager.gyms?.length + 1 || 1,
      },
      temporaryPassword: result.isNewManager ? generatedPassword : null,
      message: result.isNewManager
        ? 'Academia e gestor criados com sucesso! Envie as credenciais para o gestor.'
        : `Academia criada e vinculada ao gestor "${result.manager.name}" que agora gerencia ${result.manager.gyms?.length + 1 || 1} academia(s).`,
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
