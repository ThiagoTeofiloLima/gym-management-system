import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUsers() {
  console.log('=== USUÁRIOS E SENHAS NO BANCO ===\n')
  
  const { data: users, error } = await supabase.from('users').select('*')
  
  if (error) {
    console.error('Erro:', error.message)
    return
  }
  
  users?.forEach((u, i) => {
    console.log(`${i + 1}. Email: ${u.email}`)
    console.log(`   ID: ${u.id}`)
    console.log(`   Password hash: ${u.password || 'N/A'}`)
    console.log(`   Password hash (primeiros 30): ${u.password ? u.password.substring(0, 30) + '...' : 'N/A'}`)
    console.log('')
  })
  
  // Verifica se há tabela de autenticação do Supabase
  console.log('\n=== Verificando auth.users (Supabase Auth) ===')
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
  
  if (authError) {
    console.log('Não foi possível acessar auth.users:', authError.message)
  } else {
    console.log(`Usuários no Supabase Auth: ${authData.users.length}`)
    authData.users.forEach(u => {
      console.log(`  - ${u.email} (ID: ${u.id})`)
    })
  }
}

checkUsers()
