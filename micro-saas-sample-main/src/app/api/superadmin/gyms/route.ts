import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext } from '@/lib/multi-tenant'
import { hashSync as bcryptHashSync } from 'bcryptjs'
import { UserRole, UserGymStatus } from '@/types/database'

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
    const search = url.searchParams.get('search') || undefined
    const plan = url.searchParams.get('plan') || undefined
    const status = url.searchParams.get('status') || undefined
    const state = url.searchParams.get('state') || undefined

    const gyms = await db.findGymsWithFilters({ search, plan, status, state })
    
    const gymsWithCounts = await Promise.all(
      gyms.map(async (g) => ({
        ...g,
        _count: await db.getGymCounts(g.id),
      }))
    )

    return NextResponse.json(gymsWithCounts)
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
      const existingCnpj = await db.findGymByCnpj(cnpj)
      if (existingCnpj) {
        return NextResponse.json(
          { error: 'CNPJ já cadastrado' },
          { status: 409 }
        )
      }
    }

    // Verificar se email da academia já existe
    if (email) {
      const existingEmail = await db.findGymByEmail(email)
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
    let manager = await db.findUserByEmail(managerEmail)
    let managerGyms: any[] = []

    if (manager) {
      managerGyms = await db.findUserGymsWithDetails(manager.id)
    }

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
      const existingLink = managerGyms.find(
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

      // Hash da senha (usando versão síncrona)
      if (generatedPassword) {
        passwordHash = bcryptHashSync(generatedPassword, 10)
      }

      console.log(`🆕 Criando novo gestor: ${managerEmail}`)
    }

    // Criar academia
    const gym = await db.createGym({
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
      planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 ano
    })

    // Se gestor é novo, criar usuário
    if (isNewManager && passwordHash && managerEmail) {
      manager = await db.createUser({
        name: managerName as string,
        email: managerEmail as string,
        role: UserRole.GYM_ADMIN,
        emailVerified: new Date().toISOString(),
        passwordHash,
      })
    } else if (manager && !isNewManager) {
      // Gestor já existe - apenas atualizar nome se diferente
      if (manager.name !== managerName) {
        manager = await db.updateUser(manager.id, {
          name: managerName as string,
        })
      }
    }

    if (!manager) {
      throw new Error('Gestor não definido após transação')
    }

    // Verificar se já existe vínculo entre este gestor e academia
    const existingUserGym = await db.findUserGymByUserIdGymId(manager.id, gym.id)

    if (existingUserGym) {
      throw new Error('Gestor já está vinculado a esta academia')
    }

    // Vincular gestor à academia
    await db.createUserGym({
      userId: manager.id,
      gymId: gym.id,
      role: UserRole.GYM_ADMIN,
      status: UserGymStatus.ACTIVE,
    })

    // Se gestor é novo, salvar senha temporária
    if (isNewManager && generatedPassword) {
      await db.createManagerTempPassword({
        managerId: manager.id,
        gymId: gym.id,
        password: generatedPassword,
      })
    }

    // Atualizar lista de academias do gestor
    managerGyms = await db.findUserGymsWithDetails(manager.id)

    return NextResponse.json({
      gym,
      manager: {
        id: manager.id,
        name: manager.name,
        email: manager.email,
        existingManager: !isNewManager,
        totalGyms: managerGyms.length,
      },
      temporaryPassword: isNewManager ? generatedPassword : null,
      message: isNewManager
        ? 'Academia e gestor criados com sucesso! Envie as credenciais para o gestor.'
        : `Academia criada e vinculada ao gestor "${manager.name}" que agora gerencia ${managerGyms.length} academia(s).`,
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
