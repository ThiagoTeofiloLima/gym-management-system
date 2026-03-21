/**
 * Script para testar criação de dados no Supabase
 */

import dotenv from 'dotenv'

dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY!

console.log('🔍 Testando criação de dados no Supabase...')
console.log('URL:', SUPABASE_URL)
console.log('Key:', SUPABASE_KEY)
console.log()

async function createGym() {
  const gymData = {
    name: 'Academia Teste - ' + new Date().toISOString(),
    cnpj: '12.345.678/0001-90',
    email: 'teste@academia.com.br',
    phone: '(11) 99999-9999',
    address: 'Rua Teste, 123',
    city: 'São Paulo',
    state: 'SP',
    isActive: true,
    plan: 'BASIC',
    maxMembers: 100,
    maxUsers: 10
  }

  console.log('📡 Tentando criar academia...')
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/gyms`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(gymData)
  })

  const result = await response.json()
  
  if (response.ok) {
    console.log('✅ Sucesso! Academia criada:')
    console.log('   ID:', result[0]?.id)
    console.log('   Nome:', result[0]?.name)
    return result[0]
  } else {
    console.log('❌ Erro ao criar academia:')
    console.log('   Status:', response.status)
    console.log('   Mensagem:', result.message || JSON.stringify(result))
    return null
  }
}

async function listGyms() {
  console.log('\n📡 Listando academias...')
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/gyms?select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  })

  const result = await response.json()
  
  if (response.ok) {
    console.log(`✅ Encontradas ${result.length} academia(s)`)
    result.forEach((gym: any, i: number) => {
      console.log(`   ${i + 1}. ${gym.name} (${gym.city})`)
    })
    return result
  } else {
    console.log('❌ Erro ao listar:')
    console.log('   Status:', response.status)
    console.log('   Mensagem:', result.message || JSON.stringify(result))
    return []
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════╗')
  console.log('║   Supabase - Teste de Criação de Dados         ║')
  console.log('╚════════════════════════════════════════════════╝\n')
  
  // Primeiro lista o que existe
  await listGyms()
  
  // Tenta criar uma academia
  const gym = await createGym()
  
  // Lista novamente
  if (gym) {
    await listGyms()
  }
}

main().catch(console.error)
