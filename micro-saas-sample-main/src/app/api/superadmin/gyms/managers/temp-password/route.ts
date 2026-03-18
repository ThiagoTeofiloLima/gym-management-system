import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { auth } from '@/services/auth'
import { getTenantContext } from '@/lib/multi-tenant'

/**
 * POST /api/superadmin/gyms/managers/set-temp-password
 * Salva uma nota/metadado com a senha temporária do gestor (apenas Super Admin)
 * 
 * NOTA: Esta é uma solução temporária. Em produção, use email ou outro mecanismo seguro.
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
    const { managerId, gymId, tempPassword } = body

    if (!managerId || !gymId || !tempPassword) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Salvar senha temporária no campo de metadados (usando um campo personalizado ou nota)
    // Como não temos campo dedicado, vamos criar um registro em uma tabela de metadados
    // ou usar o próprio usuário com um campo temporário
    
    // Para esta implementação, vamos armazenar em uma tabela de metadados
    await prisma.$executeRaw`
      INSERT INTO "manager_temp_passwords" ("manager_id", "gym_id", "password", "created_at")
      VALUES (${managerId}, ${gymId}, ${tempPassword}, NOW())
      ON CONFLICT ("manager_id", "gym_id") 
      DO UPDATE SET "password" = ${tempPassword}, "created_at" = NOW()
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao salvar senha temporária:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar senha temporária' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/superadmin/gyms/managers/get-temp-password
 * Recupera a senha temporária de um gestor (apenas Super Admin)
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
    const managerId = url.searchParams.get('managerId')
    const gymId = url.searchParams.get('gymId')

    if (!managerId || !gymId) {
      return NextResponse.json(
        { error: 'managerId e gymId são obrigatórios' },
        { status: 400 }
      )
    }

    const result = await prisma.$queryRaw`
      SELECT "password", "created_at"
      FROM "manager_temp_passwords"
      WHERE "manager_id" = ${managerId} AND "gym_id" = ${gymId}
      ORDER BY "created_at" DESC
      LIMIT 1
    ` as any[]

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Senha temporária não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      password: result[0].password,
      createdAt: result[0].created_at,
    })
  } catch (error) {
    console.error('Erro ao buscar senha temporária:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar senha temporária' },
      { status: 500 }
    )
  }
}
