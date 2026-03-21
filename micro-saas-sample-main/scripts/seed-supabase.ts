/**
 * Script para popular o banco de dados no Supabase com dados de exemplo
 * 
 * Uso: npx tsx scripts/seed-supabase.ts
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { hash } from 'bcryptjs'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkConnection() {
  console.log('🔍 Verificando conexão com o Supabase...')
  console.log(`URL: ${supabaseUrl}`)
  
  const { data, error } = await supabase.from('gyms').select('count', { count: 'exact', head: true })
  
  if (error) {
    console.error('❌ Erro ao conectar:', error.message)
    return false
  }
  
  console.log('✅ Conexão estabelecida com sucesso!')
  return true
}

async function checkTables() {
  console.log('\n📋 Verificando tabelas existentes...')
  
  const tables = [
    'gyms', 'users', 'user_gyms', 'members', 'trainers', 
    'workouts', 'workout_members', 'attendance', 'expenses', 
    'todos', 'gym_plans', 'manager_temp_passwords',
    'accounts', 'sessions', 'verification_tokens'
  ]
  
  const existingTables = []
  const missingTables = []
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select('count', { count: 'exact', head: true })
    if (error) {
      missingTables.push(table)
    } else {
      existingTables.push(table)
    }
  }
  
  console.log(`✅ Tabelas encontradas (${existingTables.length}): ${existingTables.join(', ')}`)
  
  if (missingTables.length > 0) {
    console.log(`⚠️  Tabelas não encontradas (${missingTables.length}): ${missingTables.join(', ')}`)
  }
  
  return { existingTables, missingTables }
}

async function countRecords() {
  console.log('\n📊 Contando registros existentes...')
  
  const tables = ['gyms', 'users', 'user_gyms', 'members', 'trainers', 'workouts', 'expenses', 'todos']
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log(`  ${table}: Erro - ${error.message}`)
    } else {
      console.log(`  ${table}: ${count || 0} registros`)
    }
  }
}

async function seedData() {
  console.log('\n🌱 Iniciando seed de dados de exemplo...\n')
  
  // 1. Criar academia
  console.log('1️⃣  Criando academia de exemplo...')
  const gymData = {
    name: 'Academia FitLife',
    cnpj: '12.345.678/0001-90',
    email: 'contato@fitlife.com.br',
    phone: '(11) 99999-9999',
    address: 'Rua das Flores, 123 - Centro',
    city: 'São Paulo',
    state: 'SP',
    isActive: true,
    plan: 'PRO',
    planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    maxMembers: 500,
    maxUsers: 50
  }
  
  const { data: gym, error: gymError } = await supabase
    .from('gyms')
    .insert([gymData])
    .select()
    .single()
  
  if (gymError) {
    console.error('❌ Erro ao criar academia:', gymError.message)
    return null
  }
  console.log(`✅ Academia criada: ${gym.name} (ID: ${gym.id})`)
  
  // 2. Criar usuário administrador
  console.log('\n2️⃣  Criando usuário administrador...')
  const passwordHash = await hash('admin123', 10)
  
  const userData = {
    name: 'Administrador Principal',
    email: 'admin@gymmanager.com.br',
    emailVerified: new Date().toISOString(),
    passwordHash,
    role: 'SUPER_ADMIN',
    image: null
  }
  
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert([userData])
    .select()
    .single()
  
  if (userError) {
    console.error('❌ Erro ao criar usuário:', userError.message)
    return null
  }
  console.log(`✅ Usuário criado: ${user.name} (ID: ${user.id})`)
  
  // 3. Vincular usuário à academia
  console.log('\n3️⃣  Vinculando usuário à academia...')
  const userGymData = {
    userId: user.id,
    gymId: gym.id,
    role: 'GYM_ADMIN' as const,
    status: 'ACTIVE' as const
  }
  
  const { data: userGym, error: userGymError } = await supabase
    .from('user_gyms')
    .insert([userGymData])
    .select()
    .single()
  
  if (userGymError) {
    console.error('❌ Erro ao vincular usuário à academia:', userGymError.message)
    return null
  }
  console.log(`✅ Vínculo criado: ${user.name} -> ${gym.name}`)
  
  // 4. Criar treinadores
  console.log('\n4️⃣  Criando treinadores...')
  const trainers = [
    {
      name: 'Carlos Silva',
      email: 'carlos@fitlife.com.br',
      phone: '(11) 98888-8888',
      specialty: 'Musculação',
      status: 'Ativo',
      certifications: 'CREF 123456-SP, Personal Trainer',
      userId: user.id,
      gymId: gym.id
    },
    {
      name: 'Ana Santos',
      email: 'ana@fitlife.com.br',
      phone: '(11) 97777-7777',
      specialty: 'Yoga e Pilates',
      status: 'Ativo',
      certifications: 'CREF 654321-SP, Instrutora de Yoga',
      userId: user.id,
      gymId: gym.id
    },
    {
      name: 'Roberto Oliveira',
      email: 'roberto@fitlife.com.br',
      phone: '(11) 96666-6666',
      specialty: 'Cross Training',
      status: 'Ativo',
      certifications: 'CREF 789012-SP, Crossfit Level 1',
      userId: user.id,
      gymId: gym.id
    }
  ]
  
  const { data: trainersData, error: trainersError } = await supabase
    .from('trainers')
    .insert(trainers)
    .select()
  
  if (trainersError) {
    console.error('❌ Erro ao criar treinadores:', trainersError.message)
  } else {
    console.log(`✅ ${trainersData?.length} treinadores criados`)
  }
  
  // 5. Criar membros/alunos
  console.log('\n5️⃣  Criando membros/alunos...')
  const members = [
    {
      name: 'João Pereira',
      email: 'joao.pereira@email.com',
      phone: '(11) 91111-1111',
      plan: 'Mensal',
      status: 'Ativo',
      lastVisit: new Date().toISOString(),
      trainerId: trainersData?.[0]?.id || null,
      userId: user.id,
      planRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      paymentDate: new Date().toISOString(),
      gymId: gym.id,
      gymPlanId: null
    },
    {
      name: 'Maria Souza',
      email: 'maria.souza@email.com',
      phone: '(11) 92222-2222',
      plan: 'Trimestral',
      status: 'Ativo',
      lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      trainerId: trainersData?.[1]?.id || null,
      userId: user.id,
      planRenewalDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      paymentDate: new Date().toISOString(),
      gymId: gym.id,
      gymPlanId: null
    },
    {
      name: 'Pedro Costa',
      email: 'pedro.costa@email.com',
      phone: '(11) 93333-3333',
      plan: 'Anual',
      status: 'Ativo',
      lastVisit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      trainerId: trainersData?.[2]?.id || null,
      userId: user.id,
      planRenewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      paymentDate: new Date().toISOString(),
      gymId: gym.id,
      gymPlanId: null
    },
    {
      name: 'Fernanda Lima',
      email: 'fernanda.lima@email.com',
      phone: '(11) 94444-4444',
      plan: 'Mensal',
      status: 'Inativo',
      lastVisit: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      trainerId: trainersData?.[0]?.id || null,
      userId: user.id,
      planRenewalDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      paymentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      gymId: gym.id,
      gymPlanId: null
    },
    {
      name: 'Lucas Martins',
      email: 'lucas.martins@email.com',
      phone: '(11) 95555-5555',
      plan: 'Mensal',
      status: 'Ativo',
      lastVisit: new Date().toISOString(),
      trainerId: trainersData?.[2]?.id || null,
      userId: user.id,
      planRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      paymentDate: new Date().toISOString(),
      gymId: gym.id,
      gymPlanId: null
    }
  ]
  
  const { data: membersData, error: membersError } = await supabase
    .from('members')
    .insert(members)
    .select()
  
  if (membersError) {
    console.error('❌ Erro ao criar membros:', membersError.message)
  } else {
    console.log(`✅ ${membersData?.length} membros criados`)
  }
  
  // 6. Criar treinos
  console.log('\n6️⃣  Criando treinos...')
  const workouts = [
    {
      name: 'Treino A - Peito e Tríceps',
      type: 'Musculação',
      duration: '60',
      level: 'Intermediário',
      description: 'Foco em peito e tríceps com exercícios compostos',
      userId: user.id,
      gymId: gym.id,
      trainerId: trainersData?.[0]?.id || null
    },
    {
      name: 'Treino B - Costas e Bíceps',
      type: 'Musculação',
      duration: '60',
      level: 'Intermediário',
      description: 'Foco em costas e bíceps com exercícios variados',
      userId: user.id,
      gymId: gym.id,
      trainerId: trainersData?.[0]?.id || null
    },
    {
      name: 'Aula de Yoga - Iniciantes',
      type: 'Yoga',
      duration: '90',
      level: 'Iniciante',
      description: 'Aula introdutória de yoga com posturas básicas',
      userId: user.id,
      gymId: gym.id,
      trainerId: trainersData?.[1]?.id || null
    },
    {
      name: 'WOD Cross Training',
      type: 'Cross Training',
      duration: '45',
      level: 'Avançado',
      description: 'Workout of the Day - Circuito intenso',
      userId: user.id,
      gymId: gym.id,
      trainerId: trainersData?.[2]?.id || null
    }
  ]
  
  const { data: workoutsData, error: workoutsError } = await supabase
    .from('workouts')
    .insert(workouts)
    .select()
  
  if (workoutsError) {
    console.error('❌ Erro ao criar treinos:', workoutsError.message)
  } else {
    console.log(`✅ ${workoutsData?.length} treinos criados`)
  }
  
  // 7. Vincular membros aos treinos
  console.log('\n7️⃣  Vinculando membros aos treinos...')
  const workoutMembers = []
  
  if (membersData && workoutsData) {
    // João -> Treino A
    workoutMembers.push({
      workoutId: workoutsData[0].id,
      memberId: membersData[0].id,
      assignedAt: new Date().toISOString()
    })
    
    // Maria -> Aula de Yoga
    workoutMembers.push({
      workoutId: workoutsData[2].id,
      memberId: membersData[1].id,
      assignedAt: new Date().toISOString()
    })
    
    // Pedro -> WOD Cross Training
    workoutMembers.push({
      workoutId: workoutsData[3].id,
      memberId: membersData[2].id,
      assignedAt: new Date().toISOString()
    })
    
    // Lucas -> Treino B
    workoutMembers.push({
      workoutId: workoutsData[1].id,
      memberId: membersData[4].id,
      assignedAt: new Date().toISOString()
    })
    
    const { data: workoutMembersData, error: workoutMembersError } = await supabase
      .from('workout_members')
      .insert(workoutMembers)
      .select()
    
    if (workoutMembersError) {
      console.error('❌ Erro ao vincular membros aos treinos:', workoutMembersError.message)
    } else {
      console.log(`✅ ${workoutMembersData?.length} vínculos criados`)
    }
  }
  
  // 8. Criar registros de presença
  console.log('\n8️⃣  Criando registros de presença...')
  const today = new Date().toISOString().split('T')[0]
  
  const attendanceRecords = []
  if (membersData) {
    for (let i = 0; i < 3; i++) {
      attendanceRecords.push({
        date: new Date().toISOString(),
        memberId: membersData[i].id,
        memberEmail: membersData[i].email,
        checkIn: new Date().toISOString(),
        checkOut: null,
        status: 'Presente',
        userId: user.id
      })
    }
    
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .insert(attendanceRecords)
      .select()
    
    if (attendanceError) {
      console.error('❌ Erro ao criar registros de presença:', attendanceError.message)
    } else {
      console.log(`✅ ${attendanceData?.length} registros de presença criados`)
    }
  }
  
  // 9. Criar despesas
  console.log('\n9️⃣  Criando despesas...')
  const expenses = [
    {
      title: 'Aluguel do Espaço',
      description: 'Aluguel mensal da academia',
      amount: 5000.00,
      category: 'Aluguel',
      date: new Date().toISOString(),
      userId: user.id,
      gymId: gym.id
    },
    {
      title: 'Conta de Luz',
      description: 'Energia elétrica',
      amount: 800.00,
      category: 'Utilities',
      date: new Date().toISOString(),
      userId: user.id,
      gymId: gym.id
    },
    {
      title: 'Manutenção de Equipamentos',
      description: 'Revisão mensal das máquinas',
      amount: 1200.00,
      category: 'Manutenção',
      date: new Date().toISOString(),
      userId: user.id,
      gymId: gym.id
    },
    {
      title: 'Salário Instrutores',
      description: 'Pagamento equipe de instrutores',
      amount: 8000.00,
      category: 'Pessoal',
      date: new Date().toISOString(),
      userId: user.id,
      gymId: gym.id
    }
  ]
  
  const { data: expensesData, error: expensesError } = await supabase
    .from('expenses')
    .insert(expenses)
    .select()
  
  if (expensesError) {
    console.error('❌ Erro ao criar despesas:', expensesError.message)
  } else {
    console.log(`✅ ${expensesData?.length} despesas criadas`)
  }
  
  // 10. Criar tarefas (todos)
  console.log('\n🔟 Criando tarefas...')
  const todos = [
    {
      title: 'Comprar novos halteres',
      userId: user.id,
      gymId: gym.id,
      doneAt: null
    },
    {
      title: 'Agendar limpeza dos tapetes de yoga',
      userId: user.id,
      gymId: gym.id,
      doneAt: null
    },
    {
      title: 'Renovar contrato de internet',
      userId: user.id,
      gymId: gym.id,
      doneAt: null
    },
    {
      title: 'Comprar água para bebedouro',
      userId: user.id,
      gymId: gym.id,
      doneAt: new Date().toISOString()
    }
  ]
  
  const { data: todosData, error: todosError } = await supabase
    .from('todos')
    .insert(todos)
    .select()
  
  if (todosError) {
    console.error('❌ Erro ao criar tarefas:', todosError.message)
  } else {
    console.log(`✅ ${todosData?.length} tarefas criadas`)
  }
  
  // 11. Criar planos da academia
  console.log('\n1️⃣1️⃣  Criando planos da academia...')
  const gymPlans = [
    {
      gymId: gym.id,
      name: 'Plano Mensal',
      description: 'Acesso completo à academia por 30 dias',
      price: 99.90,
      duration: 30,
      maxMembers: 100,
      isActive: true
    },
    {
      gymId: gym.id,
      name: 'Plano Trimestral',
      description: 'Acesso completo por 90 dias com 10% de desconto',
      price: 269.90,
      duration: 90,
      maxMembers: 50,
      isActive: true
    },
    {
      gymId: gym.id,
      name: 'Plano Anual',
      description: 'Acesso completo por 1 ano com 20% de desconto',
      price: 959.90,
      duration: 365,
      maxMembers: 30,
      isActive: true
    }
  ]
  
  const { data: gymPlansData, error: gymPlansError } = await supabase
    .from('gym_plans')
    .insert(gymPlans)
    .select()
  
  if (gymPlansError) {
    console.error('❌ Erro ao criar planos:', gymPlansError.message)
  } else {
    console.log(`✅ ${gymPlansData?.length} planos criados`)
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('🎉 Seed concluído com sucesso!')
  console.log('='.repeat(50))
  console.log('\n📊 Resumo:')
  console.log(`   • 1 academia criada`)
  console.log(`   • 1 usuário administrador criado`)
  console.log(`   • 3 treinadores criados`)
  console.log(`   • 5 membros criados`)
  console.log(`   • 4 treinos criados`)
  console.log(`   • 4 vínculos membro-treino criados`)
  console.log(`   • 3 registros de presença criados`)
  console.log(`   • 4 despesas criadas`)
  console.log(`   • 4 tarefas criadas`)
  console.log(`   • 3 planos da academia criados`)
  console.log('\n🔐 Credenciais de acesso:')
  console.log(`   Email: admin@gymmanager.com.br`)
  console.log(`   Senha: admin123`)
  console.log('='.repeat(50))
  
  return { gym, user }
}

async function main() {
  console.log('╔════════════════════════════════════════════════╗')
  console.log('║   Gym Manager - Seed do Banco de Dados         ║')
  console.log('║   Supabase                                     ║')
  console.log('╚════════════════════════════════════════════════╝\n')
  
  // Verificar conexão
  const connected = await checkConnection()
  if (!connected) {
    console.log('\n❌ Não foi possível conectar ao Supabase. Verifique as variáveis de ambiente.')
    process.exit(1)
  }
  
  // Verificar tabelas
  await checkTables()
  
  // Contar registros existentes
  await countRecords()
  
  // Perguntar se deseja continuar
  console.log('\n⚠️  Atenção: Este script irá adicionar dados de exemplo ao banco de dados.')
  console.log('   Se já existem dados, eles serão mantidos (não há duplicação intencional).')
  
  // Executar seed
  await seedData()
  
  // Mostrar contagem final
  console.log('\n📊 Contagem final de registros:')
  await countRecords()
}

main().catch(console.error)
