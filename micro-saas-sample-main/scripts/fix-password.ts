/**
 * Script para corrigir a senha do administrador
 */

import { createClient } from '@supabase/supabase-js'
import { hash } from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function fixPassword() {
  console.log('🔐 Corrigindo senha do administrador...\n')
  
  // Gerar hash correto para 'admin123'
  const passwordHash = await hash('admin123', 10)
  console.log('Hash gerado:', passwordHash)
  
  // Atualizar usuário
  const { data, error } = await supabase
    .from('users')
    .update({ passwordHash })
    .eq('email', 'admin@gymmanager.com.br')
    .select()
  
  if (error) {
    console.error('❌ Erro:', error.message)
  } else {
    console.log('✅ Senha atualizada com sucesso!')
    console.log('   Email: admin@gymmanager.com.br')
    console.log('   Senha: admin123')
  }
  
  // Verificar usuário
  const { data: user } = await supabase
    .from('users')
    .select('id, email, name, role, "passwordHash"')
    .eq('email', 'admin@gymmanager.com.br')
    .single()
  
  if (user) {
    console.log('\n📊 Usuário atual:')
    console.log('   ID:', user.id)
    console.log('   Email:', user.email)
    console.log('   Nome:', user.name)
    console.log('   Role:', user.role)
    console.log('   Hash:', user.passwordHash?.substring(0, 30) + '...')
  }
}

fixPassword().catch(console.error)
