/**
 * Script para testar conexão e verificar RLS no Supabase
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!

console.log('🔍 Testando conexão com Supabase...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey)

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('\n📡 Testando acesso às tabelas...\n')
  
  const tables = [
    'gyms', 'users', 'user_gyms', 'members', 'trainers',
    'workouts', 'workout_members', 'attendance', 'expenses',
    'todos', 'gym_plans'
  ]
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1)
    
    if (error) {
      console.log(`❌ ${table}: ${error.message}`)
    } else {
      console.log(`✅ ${table}: OK (${data?.length || 0} registros encontrados)`)
    }
  }
}

async function checkRLS() {
  console.log('\n🔒 Verificando políticas de RLS...\n')
  
  // Tenta inserir um registro de teste
  const testData = {
    name: 'Teste RLS',
    cnpj: '00.000.000/0000-00',
    email: 'teste@test.com',
    phone: '(00) 00000-0000',
    address: 'Rua Teste',
    city: 'Teste',
    state: 'SP',
    isActive: true,
    plan: 'BASIC',
    maxMembers: 100,
    maxUsers: 10
  }
  
  const { data, error } = await supabase
    .from('gyms')
    .insert([testData])
    .select()
    .single()
  
  if (error) {
    console.log('❌ Inserção bloqueada - RLS provavelmente ativo')
    console.log('Erro:', error.message)
    console.log('\n💡 Solução: Você precisa desativar o RLS ou criar políticas de inserção')
    console.log('   No dashboard do Supabase: Authentication → Policies')
    return false
  } else {
    console.log('✅ Inserção permitida - RLS desativado ou políticas configuradas')
    
    // Remove o registro de teste
    await supabase.from('gyms').delete().eq('name', 'Teste RLS')
    return true
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════╗')
  console.log('║   Supabase - Teste de Conexão e RLS            ║')
  console.log('╚════════════════════════════════════════════════╝\n')
  
  await testConnection()
  await checkRLS()
}

main().catch(console.error)
