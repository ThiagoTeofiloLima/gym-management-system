/**
 * Script para verificar estrutura da tabela attendance
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAttendanceTable() {
  console.log('🔍 Verificando tabela attendance...\n')

  // Tentar inserir um registro de teste
  const testData = {
    date: new Date().toISOString(),
    memberId: 'test-member-id',
    memberEmail: 'test@test.com',
    checkIn: new Date().toISOString(),
    checkOut: null,
    status: 'Presente',
    userId: 'test-user-id',
  }

  console.log('Dados de teste:', testData)

  const { data, error } = await supabase
    .from('attendance')
    .insert([testData])
    .select()
    .single()

  if (error) {
    console.error('❌ Erro ao inserir:', error.message)
    console.error('Detalhes:', error.details)
    console.error('Hint:', error.hint)
  } else {
    console.log('✅ Inserção bem-sucedida!')
    console.log('Data:', data)
    
    // Limpar registro de teste
    await supabase.from('attendance').delete().eq('id', data.id)
    console.log('🗑️ Registro de teste removido')
  }

  // Verificar estrutura da tabela
  console.log('\n📋 Verificando estrutura...')
  const { data: schema, error: schemaError } = await supabase.rpc('pg_get_table_columns', { table_name: 'attendance' })
  
  if (schemaError) {
    console.log('Não foi possível obter estrutura via RPC')
  } else {
    console.log('Colunas:', schema)
  }
}

checkAttendanceTable().catch(console.error)
