import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function listUsers() {
  console.log('=== USUÁRIOS NO BANCO DE DADOS ===\n')
  
  // Tenta buscar da tabela users
  const { data: users, error } = await supabase.from('users').select('*')
  
  if (error) {
    console.error('Erro ao buscar usuários:', error.message)
    return
  }
  
  if (!users || users.length === 0) {
    console.log('⚠️ Nenhum usuário encontrado na tabela "users"')
  } else {
    console.log(`✅ ${users.length} usuário(s) encontrado(s):\n`)
    users.forEach((u, i) => {
      console.log(`${i + 1}. Email: ${u.email}`)
      console.log(`   ID: ${u.id}`)
      console.log(`   Nome: ${u.name || 'N/A'}`)
      console.log(`   Role: ${u.role || 'N/A'}`)
      console.log('')
    })
  }
}

listUsers()
