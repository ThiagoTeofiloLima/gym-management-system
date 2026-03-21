/**
 * Script para criar schema e popular o banco de dados no Supabase
 * Usa conexão direta PostgreSQL
 */

import { Pool } from 'pg'
import dotenv from 'dotenv'
import { hash } from 'bcryptjs'

dotenv.config()

const SUPABASE_DB_PASSWORD = 'Thsu2207sema'
const connectionString = `postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.rzurauvqczgrpbblvcpj.supabase.co:5432/postgres`

console.log('🔍 Conectando ao Supabase PostgreSQL...')
console.log('Host: db.rzurauvqczgrpbblvcpj.supabase.co')
console.log('Database: postgres\n')

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
})

async function createSchema() {
  const client = await pool.connect()
  
  try {
    console.log('✅ Conectado! Criando schema...\n')
    
    // Criar ENUMS
    console.log('1️⃣  Criando ENUMS...')
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'GYM_ADMIN', 'USER');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE user_gym_status AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `)
    console.log('   ✅ ENUMS criados\n')
    
    // Criar tabelas
    console.log('2️⃣  Criando tabelas...')
    
    await client.query(`CREATE TABLE IF NOT EXISTS gyms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      cnpj VARCHAR(20),
      email VARCHAR(255),
      phone VARCHAR(20),
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(2),
      "isActive" BOOLEAN DEFAULT true,
      plan VARCHAR(50) DEFAULT 'BASIC',
      "planExpiresAt" TIMESTAMP WITH TIME ZONE,
      "maxMembers" INTEGER DEFAULT 100,
      "maxUsers" INTEGER DEFAULT 10,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`)
    console.log('   ✅ gyms')
    
    await client.query(`CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      "emailVerified" TIMESTAMP WITH TIME ZONE,
      image TEXT,
      "passwordHash" VARCHAR(255),
      "stripeCustomerId" VARCHAR(255),
      "stripeSubscriptionId" VARCHAR(255),
      "stripeSubscriptionStatus" VARCHAR(50),
      "stripePriceId" VARCHAR(255),
      role user_role DEFAULT 'USER',
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`)
    console.log('   ✅ users')
    
    await client.query(`CREATE TABLE IF NOT EXISTS user_gyms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "gymId" UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
      role user_role DEFAULT 'USER',
      status user_gym_status DEFAULT 'PENDING',
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE("userId", "gymId")
    )`)
    console.log('   ✅ user_gyms')
    
    await client.query(`CREATE TABLE IF NOT EXISTS trainers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      specialty VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Ativo',
      certifications TEXT,
      "userId" UUID NOT NULL REFERENCES users(id),
      "gymId" UUID REFERENCES gyms(id),
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`)
    console.log('   ✅ trainers')
    
    await client.query(`CREATE TABLE IF NOT EXISTS members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      plan VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Ativo',
      "lastVisit" TIMESTAMP WITH TIME ZONE,
      "trainerId" UUID REFERENCES trainers(id),
      "userId" UUID NOT NULL REFERENCES users(id),
      "planRenewalDate" TIMESTAMP WITH TIME ZONE,
      "paymentDate" TIMESTAMP WITH TIME ZONE,
      "gymId" UUID REFERENCES gyms(id),
      "gymPlanId" UUID REFERENCES gym_plans(id),
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`)
    console.log('   ✅ members')
    
    await client.query(`CREATE TABLE IF NOT EXISTS workouts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      type VARCHAR(100),
      duration VARCHAR(10),
      level VARCHAR(50),
      description TEXT,
      "userId" UUID NOT NULL REFERENCES users(id),
      "gymId" UUID REFERENCES gyms(id),
      "trainerId" UUID REFERENCES trainers(id),
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`)
    console.log('   ✅ workouts')
    
    await client.query(`CREATE TABLE IF NOT EXISTS workout_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "workoutId" UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
      "memberId" UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      "assignedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE("workoutId", "memberId")
    )`)
    console.log('   ✅ workout_members')
    
    await client.query(`CREATE TABLE IF NOT EXISTS attendance (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date TIMESTAMP WITH TIME ZONE NOT NULL,
      "memberId" UUID NOT NULL REFERENCES members(id),
      "memberEmail" VARCHAR(255) NOT NULL,
      "checkIn" TIMESTAMP WITH TIME ZONE,
      "checkOut" TIMESTAMP WITH TIME ZONE,
      status VARCHAR(50) DEFAULT 'Presente',
      "userId" UUID NOT NULL REFERENCES users(id),
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`)
    console.log('   ✅ attendance')
    
    await client.query(`CREATE TABLE IF NOT EXISTS expenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      amount DECIMAL(10,2) NOT NULL,
      category VARCHAR(100),
      date TIMESTAMP WITH TIME ZONE NOT NULL,
      "userId" UUID NOT NULL REFERENCES users(id),
      "gymId" UUID REFERENCES gyms(id),
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`)
    console.log('   ✅ expenses')
    
    await client.query(`CREATE TABLE IF NOT EXISTS todos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      "userId" UUID NOT NULL REFERENCES users(id),
      "gymId" UUID REFERENCES gyms(id),
      "doneAt" TIMESTAMP WITH TIME ZONE,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`)
    console.log('   ✅ todos')
    
    await client.query(`CREATE TABLE IF NOT EXISTS gym_plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "gymId" UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      duration INTEGER NOT NULL,
      "maxMembers" INTEGER,
      "isActive" BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`)
    console.log('   ✅ gym_plans')
    
    await client.query(`CREATE TABLE IF NOT EXISTS manager_temp_passwords (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "managerId" UUID NOT NULL REFERENCES users(id),
      "gymId" UUID NOT NULL REFERENCES gyms(id),
      password VARCHAR(255) NOT NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE("managerId", "gymId")
    )`)
    console.log('   ✅ manager_temp_passwords')
    
    await client.query(`CREATE TABLE IF NOT EXISTS accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(255) NOT NULL,
      provider VARCHAR(255) NOT NULL,
      "providerAccountId" VARCHAR(255) NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at INTEGER,
      token_type VARCHAR(255),
      scope VARCHAR(255),
      id_token TEXT,
      session_state VARCHAR(255),
      UNIQUE(provider, "providerAccountId")
    )`)
    console.log('   ✅ accounts')
    
    await client.query(`CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "sessionToken" VARCHAR(255) UNIQUE NOT NULL,
      "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires TIMESTAMP WITH TIME ZONE NOT NULL
    )`)
    console.log('   ✅ sessions')
    
    await client.query(`CREATE TABLE IF NOT EXISTS verification_tokens (
      identifier VARCHAR(255) NOT NULL,
      token VARCHAR(255) UNIQUE NOT NULL,
      expires TIMESTAMP WITH TIME ZONE NOT NULL,
      PRIMARY KEY(identifier, token)
    )`)
    console.log('   ✅ verification_tokens')
    
    console.log('\n✅ Todas as tabelas criadas!\n')
    
    // Desativar RLS
    console.log('3️⃣  Desativando Row Level Security...')
    const tables = ['gyms', 'users', 'user_gyms', 'members', 'trainers', 'workouts', 
                    'workout_members', 'attendance', 'expenses', 'todos', 'gym_plans',
                    'manager_temp_passwords', 'accounts', 'sessions', 'verification_tokens']
    
    for (const table of tables) {
      await client.query(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY`)
    }
    console.log('   ✅ RLS desativado\n')
    
    // Criar índices
    console.log('4️⃣  Criando índices...')
    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_gyms_user_id ON user_gyms("userId")`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_gyms_gym_id ON user_gyms("gymId")`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_members_gym_id ON members("gymId")`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_members_user_id ON members("userId")`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_members_trainer_id ON members("trainerId")`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_trainers_gym_id ON trainers("gymId")`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_workouts_gym_id ON workouts("gymId")`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_expenses_gym_id ON expenses("gymId")`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_todos_gym_id ON todos("gymId")`)
    console.log('   ✅ Índices criados\n')
    
    return true
  } catch (error: any) {
    console.error('❌ Erro ao criar schema:', error.message)
    throw error
  } finally {
    client.release()
  }
}

async function seedData() {
  const client = await pool.connect()
  
  try {
    console.log('🌱 Iniciando seed de dados...\n')
    
    // 1. Criar academia
    console.log('1️⃣  Criando academia...')
    const gymResult = await client.query(`
      INSERT INTO gyms (name, cnpj, email, phone, address, city, state, "isActive", plan, "planExpiresAt", "maxMembers", "maxUsers")
      VALUES (
        'Academia FitLife',
        '12.345.678/0001-90',
        'contato@fitlife.com.br',
        '(11) 99999-9999',
        'Rua das Flores, 123 - Centro',
        'São Paulo',
        'SP',
        true,
        'PRO',
        NOW() + INTERVAL '365 days',
        500,
        50
      )
      RETURNING id
    `)
    const gymId = gymResult.rows[0].id
    console.log(`   ✅ Academia criada: ${gymId}\n`)
    
    // 2. Criar usuário administrador
    console.log('2️⃣  Criando usuário administrador...')
    const passwordHash = await hash('admin123', 10)
    const userResult = await client.query(`
      INSERT INTO users (name, email, "emailVerified", "passwordHash", role)
      VALUES (
        'Administrador Principal',
        'admin@gymmanager.com.br',
        NOW(),
        '${passwordHash}',
        'SUPER_ADMIN'
      )
      RETURNING id
    `)
    const userId = userResult.rows[0].id
    console.log(`   ✅ Usuário criado: ${userId}\n`)
    
    // 3. Vincular usuário à academia
    console.log('3️⃣  Vinculando usuário à academia...')
    await client.query(`
      INSERT INTO user_gyms ("userId", "gymId", role, status)
      VALUES ($1, $2, 'GYM_ADMIN', 'ACTIVE')
    `, [userId, gymId])
    console.log('   ✅ Vínculo criado\n')
    
    // 4. Criar treinadores
    console.log('4️⃣  Criando treinadores...')
    const trainersResult = await client.query(`
      INSERT INTO trainers (name, email, phone, specialty, status, certifications, "userId", "gymId")
      VALUES 
        ('Carlos Silva', 'carlos@fitlife.com.br', '(11) 98888-8888', 'Musculação', 'Ativo', 'CREF 123456-SP', $1, $2),
        ('Ana Santos', 'ana@fitlife.com.br', '(11) 97777-7777', 'Yoga e Pilates', 'Ativo', 'CREF 654321-SP', $1, $2),
        ('Roberto Oliveira', 'roberto@fitlife.com.br', '(11) 96666-6666', 'Cross Training', 'Ativo', 'CREF 789012-SP', $1, $2)
      RETURNING id
    `, [userId, gymId])
    const trainerIds = trainersResult.rows.map((r: any) => r.id)
    console.log(`   ✅ ${trainerIds.length} treinadores criados\n`)
    
    // 5. Criar membros
    console.log('5️⃣  Criando membros...')
    const membersResult = await client.query(`
      INSERT INTO members (name, email, phone, plan, status, "lastVisit", "trainerId", "userId", "planRenewalDate", "paymentDate", "gymId")
      VALUES 
        ('João Pereira', 'joao.pereira@email.com', '(11) 91111-1111', 'Mensal', 'Ativo', NOW(), $1, $3, NOW() + INTERVAL '30 days', NOW(), $2),
        ('Maria Souza', 'maria.souza@email.com', '(11) 92222-2222', 'Trimestral', 'Ativo', NOW() - INTERVAL '2 days', $4, $3, NOW() + INTERVAL '90 days', NOW(), $2),
        ('Pedro Costa', 'pedro.costa@email.com', '(11) 93333-3333', 'Anual', 'Ativo', NOW() - INTERVAL '1 day', $5, $3, NOW() + INTERVAL '365 days', NOW(), $2),
        ('Fernanda Lima', 'fernanda.lima@email.com', '(11) 94444-4444', 'Mensal', 'Inativo', NOW() - INTERVAL '60 days', $1, $3, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', $2),
        ('Lucas Martins', 'lucas.martins@email.com', '(11) 95555-5555', 'Mensal', 'Ativo', NOW(), $5, $3, NOW() + INTERVAL '30 days', NOW(), $2)
      RETURNING id
    `, [trainerIds[0], gymId, userId, trainerIds[1], trainerIds[2]])
    const memberIds = membersResult.rows.map((r: any) => r.id)
    console.log(`   ✅ ${memberIds.length} membros criados\n`)
    
    // 6. Criar treinos
    console.log('6️⃣  Criando treinos...')
    const workoutsResult = await client.query(`
      INSERT INTO workouts (name, type, duration, level, description, "userId", "gymId", "trainerId")
      VALUES 
        ('Treino A - Peito e Tríceps', 'Musculação', '60', 'Intermediário', 'Foco em peito e tríceps', $1, $2, $3),
        ('Treino B - Costas e Bíceps', 'Musculação', '60', 'Intermediário', 'Foco em costas e bíceps', $1, $2, $3),
        ('Aula de Yoga - Iniciantes', 'Yoga', '90', 'Iniciante', 'Posturas básicas de yoga', $1, $2, $4),
        ('WOD Cross Training', 'Cross Training', '45', 'Avançado', 'Circuito intenso do dia', $1, $2, $5)
      RETURNING id
    `, [userId, gymId, trainerIds[0], trainerIds[1], trainerIds[2]])
    const workoutIds = workoutsResult.rows.map((r: any) => r.id)
    console.log(`   ✅ ${workoutIds.length} treinos criados\n`)
    
    // 7. Vincular membros aos treinos
    console.log('7️⃣  Vinculando membros aos treinos...')
    await client.query(`
      INSERT INTO workout_members ("workoutId", "memberId")
      VALUES 
        ($1, $2),
        ($3, $4),
        ($5, $6),
        ($7, $8)
    `, [workoutIds[0], memberIds[0], workoutIds[2], memberIds[1], workoutIds[3], memberIds[2], workoutIds[1], memberIds[4]])
    console.log('   ✅ 4 vínculos criados\n')
    
    // 8. Criar registros de presença
    console.log('8️⃣  Criando registros de presença...')
    await client.query(`
      INSERT INTO attendance (date, "memberId", "memberEmail", "checkIn", status, "userId")
      VALUES 
        (NOW(), $1, 'joao.pereira@email.com', NOW(), 'Presente', $2),
        (NOW(), $3, 'maria.souza@email.com', NOW(), 'Presente', $2),
        (NOW(), $4, 'pedro.costa@email.com', NOW(), 'Presente', $2)
    `, [memberIds[0], userId, memberIds[1], memberIds[2]])
    console.log('   ✅ 3 registros de presença criados\n')
    
    // 9. Criar despesas
    console.log('9️⃣  Criando despesas...')
    await client.query(`
      INSERT INTO expenses (title, description, amount, category, date, "userId", "gymId")
      VALUES 
        ('Aluguel do Espaço', 'Aluguel mensal', 5000.00, 'Aluguel', NOW(), $1, $2),
        ('Conta de Luz', 'Energia elétrica', 800.00, 'Utilities', NOW(), $1, $2),
        ('Manutenção de Equipamentos', 'Revisão mensal', 1200.00, 'Manutenção', NOW(), $1, $2),
        ('Salário Instrutores', 'Pagamento equipe', 8000.00, 'Pessoal', NOW(), $1, $2)
    `, [userId, gymId])
    console.log('   ✅ 4 despesas criadas\n')
    
    // 10. Criar tarefas
    console.log('🔟 Criando tarefas...')
    await client.query(`
      INSERT INTO todos (title, "userId", "gymId", "doneAt")
      VALUES 
        ('Comprar novos halteres', $1, $2, NULL),
        ('Agendar limpeza dos tapetes de yoga', $1, $2, NULL),
        ('Renovar contrato de internet', $1, $2, NULL),
        ('Comprar água para bebedouro', $1, $2, NOW())
    `, [userId, gymId])
    console.log('   ✅ 4 tarefas criadas\n')
    
    // 11. Criar planos da academia
    console.log('1️⃣1️⃣  Criando planos da academia...')
    await client.query(`
      INSERT INTO gym_plans ("gymId", name, description, price, duration, "maxMembers", "isActive")
      VALUES 
        ($1, 'Plano Mensal', 'Acesso completo por 30 dias', 99.90, 30, 100, true),
        ($1, 'Plano Trimestral', 'Acesso completo por 90 dias com 10% de desconto', 269.90, 90, 50, true),
        ($1, 'Plano Anual', 'Acesso completo por 1 ano com 20% de desconto', 959.90, 365, 30, true)
    `, [gymId])
    console.log('   ✅ 3 planos criados\n')
    
    console.log('='.repeat(50))
    console.log('🎉 Seed concluído com sucesso!')
    console.log('='.repeat(50))
    console.log('\n📊 Resumo:')
    console.log('   • 1 academia')
    console.log('   • 1 usuário administrador')
    console.log('   • 3 treinadores')
    console.log('   • 5 membros')
    console.log('   • 4 treinos')
    console.log('   • 4 vínculos membro-treino')
    console.log('   • 3 registros de presença')
    console.log('   • 4 despesas')
    console.log('   • 4 tarefas')
    console.log('   • 3 planos da academia')
    console.log('\n🔐 Credenciais de acesso:')
    console.log('   Email: admin@gymmanager.com.br')
    console.log('   Senha: admin123')
    console.log('='.repeat(50))
    
    return true
  } catch (error: any) {
    console.error('❌ Erro no seed:', error.message)
    throw error
  } finally {
    client.release()
  }
}

async function countRecords() {
  const client = await pool.connect()
  
  try {
    console.log('\n📊 Contagem final de registros:\n')
    
    const tables = ['gyms', 'users', 'user_gyms', 'members', 'trainers', 'workouts', 
                    'workout_members', 'attendance', 'expenses', 'todos', 'gym_plans']
    
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`)
      console.log(`   ${table}: ${result.rows[0].count} registros`)
    }
  } finally {
    client.release()
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════╗')
  console.log('║   Gym Manager - Setup do Banco de Dados        ║')
  console.log('║   Supabase PostgreSQL                          ║')
  console.log('╚════════════════════════════════════════════════╝\n')
  
  try {
    await createSchema()
    await seedData()
    await countRecords()
    
    console.log('\n✅ Setup concluído com sucesso!\n')
    process.exit(0)
  } catch (error: any) {
    console.error('\n❌ Erro:', error.message)
    process.exit(1)
  }
}

main()
