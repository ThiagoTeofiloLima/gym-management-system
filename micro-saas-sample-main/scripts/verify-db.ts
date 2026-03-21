/**
 * Script para verificar se o banco de dados foi criado
 */

import dotenv from 'dotenv'

dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY!

console.log('🔍 Verificando banco de dados no Supabase...\n')

async function verifyTables() {
  const tables = [
    'gyms', 'users', 'user_gyms', 'gym_plans', 'trainers',
    'members', 'workouts', 'workout_members', 'attendance',
    'expenses', 'todos', 'manager_temp_passwords',
    'accounts', 'sessions', 'verification_tokens'
  ]
  
  console.log('📋 Verificando tabelas:\n')
  
  let allOk = true
  const tableCounts: Record<string, number> = {}
  
  for (const table of tables) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=0`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    })
    
    if (response.ok) {
      const countHeader = response.headers.get('content-range')
      const count = countHeader ? parseInt(countHeader.split('/')[1]) : 0
      tableCounts[table] = count
      console.log(`✅ ${table}: OK (${count} registros)`)
    } else {
      const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
      console.log(`❌ ${table}: ${error.message || response.status}`)
      allOk = false
    }
  }
  
  console.log('\n' + '='.repeat(50))
  
  if (allOk) {
    console.log('✅ Todas as tabelas foram criadas com sucesso!')
    
    // Verificar dados específicos
    console.log('\n📊 Dados críticos:')
    
    // Verificar academia
    const gymsResponse = await fetch(`${SUPABASE_URL}/rest/v1/gyms?select=name,id`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    })
    const gyms = await gymsResponse.json()
    console.log(`   Academias: ${gyms.length}`)
    if (gyms.length > 0) {
      console.log(`   • ${gyms[0].name}`)
    }
    
    // Verificar usuário admin
    const usersResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?select=email,role,name`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    })
    const users = await usersResponse.json()
    console.log(`   Usuários: ${users.length}`)
    const admin = users.find((u: any) => u.email === 'admin@gymmanager.com.br')
    if (admin) {
      console.log(`   • ${admin.name} (${admin.email}) - ${admin.role}`)
    }
    
    // Verificar vínculo user_gym
    const userGymsResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_gyms?select=*`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    })
    const userGyms = await userGymsResponse.json()
    console.log(`   Vínculos usuário-academia: ${userGyms.length}`)
    
    console.log('\n' + '='.repeat(50))
    
    if (gyms.length > 0 && admin && userGyms.length > 0) {
      console.log('🎉 TUDO PRONTO! O login deve funcionar agora.')
      console.log('\n🔐 Credenciais:')
      console.log('   Email: admin@gymmanager.com.br')
      console.log('   Senha: admin123')
      console.log('\n🌐 Acesse: http://localhost:3000/auth')
    } else {
      console.log('⚠️  Algumas dados podem estar faltando.')
      console.log('   Verifique se o INSERT dos dados foi executado.')
    }
  } else {
    console.log('❌ Algumas tabelas estão faltando.')
    console.log('   Execute o SQL schema-corrigido.sql no Supabase.')
  }
  
  console.log('='.repeat(50))
}

verifyTables().catch(console.error)
