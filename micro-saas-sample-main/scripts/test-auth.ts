/**
 * Script para testar autenticação diretamente
 */

import { createClient } from '@supabase/supabase-js'
import { verify } from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function testAuth() {
  console.log('🔐 Testando autenticação...\n')
  
  const email = 'admin@gymmanager.com.br'
  const password = 'admin123'
  
  // 1. Buscar usuário
  console.log('1. Buscando usuário...')
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()
  
  if (error || !user) {
    console.log('❌ Usuário não encontrado:', error?.message)
    return
  }
  
  console.log('   ✅ Usuário encontrado:')
  console.log('      ID:', user.id)
  console.log('      Email:', user.email)
  console.log('      Nome:', user.name)
  console.log('      Role:', user.role)
  console.log('      Hash:', user.passwordHash?.substring(0, 30) + '...')
  
  // 2. Verificar senha
  console.log('\n2. Verificando senha...')
  const isValid = await verify(password, user.passwordHash!)
  
  if (isValid) {
    console.log('   ✅ Senha válida!')
  } else {
    console.log('   ❌ Senha inválida!')
    return
  }
  
  // 3. Buscar vínculo com academia
  console.log('\n3. Buscando vínculo com academia...')
  const { data: userGyms, error: gymError } = await supabase
    .from('user_gyms')
    .select('*, gym(id, name, isActive, plan)')
    .eq('userId', user.id)
  
  if (gymError) {
    console.log('   ❌ Erro:', gymError.message)
  } else {
    console.log('   ✅ Vínculos encontrados:', userGyms.length)
    userGyms.forEach((gym: any) => {
      console.log(`      • ${gym.gym?.name} (${gym.role})`)
    })
  }
  
  // 4. Verificar dados completos
  console.log('\n4. Resumo para o NextAuth:')
  console.log('   user.id:', user.id)
  console.log('   user.email:', user.email)
  console.log('   user.role:', user.role)
  console.log('   user.gyms:', userGyms?.length || 0, 'academias')
  
  if (userGyms && userGyms.length > 0) {
    const adminGym = userGyms.find((g: any) => g.role === 'GYM_ADMIN')
    console.log('   activeGymId:', adminGym?.gymId || userGyms[0]?.gymId)
    console.log('   activeGymRole:', adminGym?.role || userGyms[0]?.role)
  }
  
  console.log('\n✅ Tudo pronto para o login!')
}

testAuth().catch(console.error)
