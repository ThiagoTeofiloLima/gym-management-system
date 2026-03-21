import { createClient } from '@supabase/supabase-js'
import { hash } from 'bcryptjs'
import * as dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setAdminPassword() {
  const adminEmail = 'admin@gymmanager.com.br'
  const newPassword = 'admin123' // Senha padrão para desenvolvimento
  
  console.log('=== Definir senha do Admin ===\n')
  console.log(`Email: ${adminEmail}`)
  console.log(`Nova senha: ${newPassword}`)
  
  // Hash da senha
  const passwordHash = await hash(newPassword, 10)
  console.log(`\nHash gerado: ${passwordHash.substring(0, 30)}...`)
  
  // Atualiza no banco
  const { data, error } = await supabase
    .from('users')
    .update({ passwordHash })
    .eq('email', adminEmail)
  
  if (error) {
    console.error('\n❌ Erro ao atualizar senha:', error.message)
    return
  }
  
  console.log('\n✅ Senha definida com sucesso!')
  console.log('\nAgora você pode fazer login com:')
  console.log(`  Email: ${adminEmail}`)
  console.log(`  Senha: ${newPassword}`)
}

setAdminPassword()
