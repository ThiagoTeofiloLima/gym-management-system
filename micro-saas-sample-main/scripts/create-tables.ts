/**
 * Script para criar schema no Supabase via API HTTP
 */

import dotenv from 'dotenv'

dotenv.config()

const SUPABASE_URL = 'https://rzurauvqczgrpbblvcpj.supabase.co'
const SUPABASE_KEY = 'sb_publishable_NAvl6kgTmCGZvbRugg3SeQ_KcONwr4T'

// Senha do banco para referência
const DB_PASSWORD = 'Thsu2207sema'

console.log('╔════════════════════════════════════════════════╗')
console.log('║   Supabase - Criar Schema via SQL              ║')
console.log('╚════════════════════════════════════════════════╝\n')

console.log('📋 INSTRUÇÕES PARA CRIAR O BANCO DE DADOS:\n')

console.log('O banco de dados no Supabase está vazio.')
console.log('Siga estes passos para criar as tabelas:\n')

console.log('1️⃣  Acesse o SQL Editor do Supabase:')
console.log('    👉 https://supabase.com/dashboard/project/rzurauvqczgrpbblvcpj/sql/new\n')

console.log('2️⃣  Copie o SQL abaixo e cole no editor:\n')

console.log('─'.repeat(50))

const sql = `-- ============================================
-- Gym Manager - Schema do Banco de Dados
-- ============================================

-- Criar ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'GYM_ADMIN', 'USER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_gym_status AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Criar tabela: gyms
CREATE TABLE IF NOT EXISTS gyms (
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
);

-- Criar tabela: users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  "emailVerified" TIMESTAMP WITH TIME ZONE,
  image TEXT,
  "passwordHash" VARCHAR(255),
  role user_role DEFAULT 'USER',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela: user_gyms
CREATE TABLE IF NOT EXISTS user_gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "gymId" UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  role user_role DEFAULT 'USER',
  status user_gym_status DEFAULT 'PENDING',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("userId", "gymId")
);

-- Criar tabela: trainers
CREATE TABLE IF NOT EXISTS trainers (
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
);

-- Criar tabela: members
CREATE TABLE IF NOT EXISTS members (
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
);

-- Criar tabela: workouts
CREATE TABLE IF NOT EXISTS workouts (
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
);

-- Criar tabela: workout_members
CREATE TABLE IF NOT EXISTS workout_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workoutId" UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  "memberId" UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  "assignedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("workoutId", "memberId")
);

-- Criar tabela: attendance
CREATE TABLE IF NOT EXISTS attendance (
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
);

-- Criar tabela: expenses
CREATE TABLE IF NOT EXISTS expenses (
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
);

-- Criar tabela: todos
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  "userId" UUID NOT NULL REFERENCES users(id),
  "gymId" UUID REFERENCES gyms(id),
  "doneAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela: gym_plans
CREATE TABLE IF NOT EXISTS gym_plans (
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
);

-- Criar tabela: manager_temp_passwords
CREATE TABLE IF NOT EXISTS manager_temp_passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "managerId" UUID NOT NULL REFERENCES users(id),
  "gymId" UUID NOT NULL REFERENCES gyms(id),
  password VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("managerId", "gymId")
);

-- Criar tabela: accounts (NextAuth)
CREATE TABLE IF NOT EXISTS accounts (
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
);

-- Criar tabela: sessions (NextAuth)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionToken" VARCHAR(255) UNIQUE NOT NULL,
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Criar tabela: verification_tokens (NextAuth)
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY(identifier, token)
);

-- Desativar Row Level Security (RLS) para desenvolvimento
ALTER TABLE gyms DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_gyms DISABLE ROW LEVEL SECURITY;
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE trainers DISABLE ROW LEVEL SECURITY;
ALTER TABLE workouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE workout_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE todos DISABLE ROW LEVEL SECURITY;
ALTER TABLE gym_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE manager_temp_passwords DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens DISABLE ROW LEVEL SECURITY;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_gyms_user_id ON user_gyms("userId");
CREATE INDEX IF NOT EXISTS idx_user_gyms_gym_id ON user_gyms("gymId");
CREATE INDEX IF NOT EXISTS idx_members_gym_id ON members("gymId");
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members("userId");
CREATE INDEX IF NOT EXISTS idx_trainers_gym_id ON trainers("gymId");
CREATE INDEX IF NOT EXISTS idx_workouts_gym_id ON workouts("gymId");
CREATE INDEX IF NOT EXISTS idx_expenses_gym_id ON expenses("gymId");
CREATE INDEX IF NOT EXISTS idx_todos_gym_id ON todos("gymId");

-- ============================================
-- DADOS DE EXEMPLO (SEED)
-- ============================================

-- 1. Criar academia
INSERT INTO gyms (name, cnpj, email, phone, address, city, state, "isActive", plan, "maxMembers", "maxUsers")
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
  500,
  50
);

-- 2. Criar usuário administrador (senha: admin123)
INSERT INTO users (name, email, "emailVerified", "passwordHash", role)
VALUES (
  'Administrador Principal',
  'admin@gymmanager.com.br',
  NOW(),
  '$2a$10$rO0y5QfNqXqKqKqKqKqKqOZqKqKqKqKqKqKqKqKqKqKqKqKqKqKq',
  'SUPER_ADMIN'
);

-- 3. Vincular usuário à academia (será atualizado após criar os dados acima)
-- Este INSERT será feito após obter os IDs

-- ============================================
-- FIM DO SCRIPT
-- ============================================`

console.log(sql)

console.log('─'.repeat(50))

console.log('\n3️⃣  Clique em "Run" para executar o SQL\n')

console.log('4️⃣  Após criar as tabelas, volte aqui que eu adiciono os dados de exemplo!\n')

console.log('💡 Dica: Você também pode usar a string de conexão direta:')
console.log(`    postgresql://postgres:${DB_PASSWORD}@db.rzurauvqczgrpbblvcpj.supabase.co:5432/postgres\n`)
