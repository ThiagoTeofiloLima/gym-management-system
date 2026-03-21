import { createClient } from '@supabase/supabase-js'
import { hash, compare } from 'bcryptjs'
import * as dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testAuth() {
  console.log('=== Teste de Autenticação ===\n')
  
  const adminEmail = 'admin@gymmanager.com.br'
  const testPassword = 'admin123'
  
  // 1. Verifica usuário no banco
  console.log('1. Buscando usuário no banco...')
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', adminEmail)
    .single()
  
  if (error || !user) {
    console.error('❌ Usuário não encontrado:', error?.message)
    return
  }
  
  console.log(`   ✅ Usuário encontrado: ${user.email}`)
  console.log(`   PasswordHash: ${user.passwordHash ? user.passwordHash.substring(0, 30) + '...' : 'N/A'}`)
  
  // 2. Testa comparação de senha
  if (user.passwordHash) {
    console.log('\n2. Testando comparação de senha...')
    const isValid = await compare(testPassword, user.passwordHash)
    console.log(`   Senha válida: ${isValid ? '✅ SIM' : '❌ NÃO'}`)
  } else {
    console.log('\n2. ❌ Usuário não tem passwordHash')
  }
}

testAuth()
