import { createClient } from '@supabase/supabase-js'
import { compare } from 'bcryptjs'
import * as dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testFullAuth() {
  console.log('=== Teste Completo de Autenticação ===\n')
  
  const email = 'admin@gymmanager.com.br'
  const password = 'admin123'
  
  // Simula o findUserByEmail
  console.log('1. Buscando usuário por email...')
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()
  
  if (error) {
    console.error(`   ❌ Erro: ${error.message}`)
    return
  }
  
  if (!user) {
    console.error('   ❌ Usuário não encontrado')
    return
  }
  
  console.log(`   ✅ Usuário encontrado`)
  console.log(`      - ID: ${user.id}`)
  console.log(`      - Email: ${user.email}`)
  console.log(`      - Name: ${user.name}`)
  console.log(`      - Role: ${user.role}`)
  console.log(`      - passwordHash: ${user.passwordHash ? 'definido' : 'NÃO definido'}`)
  
  // Testa senha
  console.log('\n2. Verificando senha...')
  if (!user.passwordHash) {
    console.error('   ❌ passwordHash não está definido')
    return
  }
  
  const isValid = await compare(password, user.passwordHash)
  console.log(`   Senha válida: ${isValid ? '✅ SIM' : '❌ NÃO'}`)
  
  if (isValid) {
    console.log('\n✅ AUTENTICAÇÃO BEM-SUCEDIDA!')
    console.log('\nDados que o NextAuth deve receber:')
    console.log({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
    })
  }
}

testFullAuth()
