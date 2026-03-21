import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/services/database'
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

    // Verificar se já existe senha temporária para este gestor
    const existingPassword = await db.findManagerTempPassword(managerId, gymId)

    if (existingPassword) {
      // Atualizar senha existente
      await db.updateManagerTempPassword(managerId, gymId, {
        password: tempPassword,
      })
    } else {
      // Criar nova senha temporária
      await db.createManagerTempPassword({
        managerId,
        gymId,
        password: tempPassword,
      })
    }

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

    const tempPassword = await db.findManagerTempPassword(managerId, gymId)

    if (!tempPassword) {
      return NextResponse.json(
        { error: 'Senha temporária não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      password: tempPassword.password,
      createdAt: tempPassword.createdAt,
    })
  } catch (error) {
    console.error('Erro ao buscar senha temporária:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar senha temporária' },
      { status: 500 }
    )
  }
}
