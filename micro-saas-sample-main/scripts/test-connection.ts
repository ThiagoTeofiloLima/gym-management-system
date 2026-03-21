/**
 * Script simples para testar conexão com Supabase
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

console.log('🔍 Testando conexão com Supabase...')
console.log('URL:', supabaseUrl)
console.log('Key length:', supabaseServiceKey.length)

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function test() {
  try {
    console.log('\n📡 Fazendo requisição...')
    const { data, error } = await supabase.from('gyms').select('*').limit(1)
    
    if (error) {
      console.error('❌ Erro:', error)
      console.error('Message:', error.message)
      console.error('Details:', error.details)
      console.error('Hint:', error.hint)
    } else {
      console.log('✅ Sucesso!')
      console.log('Dados:', data)
    }
  } catch (err: any) {
    console.error('❌ Exceção:', err.message)
  }
}

test()
