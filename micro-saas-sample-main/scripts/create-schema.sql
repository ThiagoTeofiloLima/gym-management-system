-- ============================================
-- Gym Manager Micro-SaaS - Schema do Banco de Dados
-- Supabase PostgreSQL
-- ============================================

-- ============================================
-- ENUMS
-- ============================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'GYM_ADMIN', 'USER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_gym_status AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- TABELA: gyms (Academias)
-- ============================================
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

-- ============================================
-- TABELA: users (Usuários)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
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
);

-- ============================================
-- TABELA: user_gyms (Vínculo entre usuários e academias)
-- ============================================
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

-- ============================================
-- TABELA: members (Membros/Alunos)
-- ============================================
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

-- ============================================
-- TABELA: trainers (Treinadores)
-- ============================================
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

-- ============================================
-- TABELA: workouts (Treinos)
-- ============================================
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

-- ============================================
-- TABELA: workout_members (Vínculo entre treinos e membros)
-- ============================================
CREATE TABLE IF NOT EXISTS workout_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "workoutId" UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    "memberId" UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    "assignedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("workoutId", "memberId")
);

-- ============================================
-- TABELA: attendance (Presenças)
-- ============================================
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

-- ============================================
-- TABELA: expenses (Despesas)
-- ============================================
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

-- ============================================
-- TABELA: todos (Tarefas)
-- ============================================
CREATE TABLE IF NOT EXISTS todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    "userId" UUID NOT NULL REFERENCES users(id),
    "gymId" UUID REFERENCES gyms(id),
    "doneAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA: gym_plans (Planos das academias)
-- ============================================
CREATE TABLE IF NOT EXISTS gym_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "gymId" UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration INTEGER NOT NULL, -- em dias
    "maxMembers" INTEGER,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA: manager_temp_passwords (Senhas temporárias de gestores)
-- ============================================
CREATE TABLE IF NOT EXISTS manager_temp_passwords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "managerId" UUID NOT NULL REFERENCES users(id),
    "gymId" UUID NOT NULL REFERENCES gyms(id),
    password VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("managerId", "gymId")
);

-- ============================================
-- TABELAS NEXTAUTH
-- ============================================

-- accounts
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

-- sessions
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionToken" VARCHAR(255) UNIQUE NOT NULL,
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMP WITH TIME ZONE NOT NULL
);

-- verification_tokens
CREATE TABLE IF NOT EXISTS verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY(identifier, token)
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_gyms_user_id ON user_gyms("userId");
CREATE INDEX IF NOT EXISTS idx_user_gyms_gym_id ON user_gyms("gymId");
CREATE INDEX IF NOT EXISTS idx_members_gym_id ON members("gymId");
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members("userId");
CREATE INDEX IF NOT EXISTS idx_trainers_gym_id ON trainers("gymId");
CREATE INDEX IF NOT EXISTS idx_workouts_gym_id ON workouts("gymId");
CREATE INDEX IF NOT EXISTS idx_expenses_gym_id ON expenses("gymId");
CREATE INDEX IF NOT EXISTS idx_todos_gym_id ON todos("gymId");
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts("userId");
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions("userId");
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions("sessionToken");

-- ============================================
-- COMENTÁRIOS NAS TABELAS
-- ============================================
COMMENT ON TABLE gyms IS 'Academias cadastradas no sistema';
COMMENT ON TABLE users IS 'Usuários do sistema (admin, gestores, etc)';
COMMENT ON TABLE user_gyms IS 'Vínculo entre usuários e academias com suas permissões';
COMMENT ON TABLE members IS 'Alunos/membros das academias';
COMMENT ON TABLE trainers IS 'Treinadores/instrutores das academias';
COMMENT ON TABLE workouts IS 'Treinos e exercícios cadastrados';
COMMENT ON TABLE workout_members IS 'Vínculo entre membros e treinos';
COMMENT ON TABLE attendance IS 'Registro de presenças dos membros';
COMMENT ON TABLE expenses IS 'Despesas financeiras das academias';
COMMENT ON TABLE todos IS 'Tarefas e lembretes';
COMMENT ON TABLE gym_plans IS 'Planos oferecidos pelas academias';
COMMENT ON TABLE manager_temp_passwords IS 'Senhas temporárias para gestores';

-- ============================================
-- DESATIVAR RLS PARA DESENVOLVIMENTO
-- ============================================
-- Isso permite que a aplicação acesse os dados sem políticas de segurança
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

-- ============================================
-- FIM DO SCRIPT
-- ============================================
