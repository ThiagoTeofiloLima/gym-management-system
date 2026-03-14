/**
 * Teste de API - Verifica se as rotas estão funcionando
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { auth } from '@/services/auth'

export async function GET(request: NextRequest) {
  try {
    // Teste 1: Verificar sessão
    const session = await auth()
    console.log('[API TEST] Session:', session?.user?.email)

    // Teste 2: Verificar conexão com banco
    const gymCount = await prisma.gym.count()
    console.log('[API TEST] Gyms no banco:', gymCount)

    // Teste 3: Verificar members
    const memberCount = await prisma.member.count()
    console.log('[API TEST] Members no banco:', memberCount)

    // Teste 4: Buscar primeiro member
    const firstMember = await prisma.member.findFirst()
    console.log('[API TEST] Primeiro member:', firstMember?.name)

    return NextResponse.json({
      success: true,
      session: session?.user?.email || 'No session',
      gymCount,
      memberCount,
      firstMember: firstMember?.name || 'None',
    })
  } catch (error) {
    console.error('[API TEST] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
