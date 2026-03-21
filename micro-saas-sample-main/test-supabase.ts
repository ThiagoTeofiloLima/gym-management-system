import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

console.log('SUPABASE_URL:', supabaseUrl)
console.log('SUPABASE_SERVICE_ROLE_KEY (primeiros 20 chars):', supabaseServiceKey?.substring(0, 20) + '...')

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testConnection() {
  console.log('\nTestando conexão com Supabase...')
  
  const { data, error } = await supabase.from('gyms').select('id').limit(1)
  
  if (error) {
    console.error('❌ ERRO na conexão:', error.message)
    console.error('Detalhes:', error)
  } else {
    console.log('✅ Conexão bem-sucedida!')
    console.log('Dados:', data)
  }
}

testConnection()
