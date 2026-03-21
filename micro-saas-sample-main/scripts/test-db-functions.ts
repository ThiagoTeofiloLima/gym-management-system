/**
 * Script para testar as funções do database service
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function testDatabaseFunctions() {
  console.log('🧪 Testando funções do database service...\n')
  
  const userId = '2537706c-e6dd-4b56-bce8-7328c3820c67'
  
  // 1. Testar findUserById
  console.log('1. Testando findUserById...')
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (userError) {
    console.log('   ❌ Erro:', userError.message)
  } else {
    console.log('   ✅ Usuário:', user.name, user.email)
  }
  
  // 2. Testar findUserGymsByUserId (com join)
  console.log('\n2. Testando findUserGymsByUserId (com join)...')
  const { data: userGyms, error: gymsError } = await supabase
    .from('user_gyms')
    .select('*, gym(id, name, isActive, plan)')
    .eq('userId', userId)
  
  if (gymsError) {
    console.log('   ❌ Erro:', gymsError.message)
  } else {
    console.log('   ✅ User Gyms:', userGyms.length)
    userGyms.forEach((gym: any) => {
      console.log(`      • ${gym.gym?.name} - Role: ${gym.role}`)
    })
  }
  
  // 3. Testar findUserGymsByUserId sem join
  console.log('\n3. Testando findUserGymsByUserId (sem join)...')
  const { data: userGymsSimple, error: simpleError } = await supabase
    .from('user_gyms')
    .select('*')
    .eq('userId', userId)
  
  if (simpleError) {
    console.log('   ❌ Erro:', simpleError.message)
  } else {
    console.log('   ✅ User Gyms (simples):', userGymsSimple.length)
    userGymsSimple.forEach((gym: any) => {
      console.log(`      • gymId: ${gym.gymId}, role: ${gym.role}`)
    })
  }
  
  // 4. Testar gyms diretamente
  console.log('\n4. Testando gyms diretamente...')
  const { data: allGyms, error: gymsDirectError } = await supabase
    .from('gyms')
    .select('*')
  
  if (gymsDirectError) {
    console.log('   ❌ Erro:', gymsDirectError.message)
  } else {
    console.log('   ✅ Gyms:', allGyms.length)
    allGyms.forEach((gym: any) => {
      console.log(`      • ${gym.name} (${gym.city})`)
    })
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('Resumo:')
  console.log('- Usuário existe:', !!user)
  console.log('- User Gyms (join):', userGyms?.length || 0)
  console.log('- User Gyms (simples):', userGymsSimple?.length || 0)
  console.log('- Total de gyms:', allGyms?.length || 0)
}

testDatabaseFunctions().catch(console.error)
