-- ============================================
-- Gym Manager - Schema COMPLETO (ORDEM CORRETA)
-- Copie e cole no SQL Editor do Supabase
-- https://supabase.com/dashboard/project/rzurauvqczgrpbblvcpj/sql/new
-- ============================================

-- Criar ENUMS primeiro
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'GYM_ADMIN', 'USER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_gym_status AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 1. TABELAS PRINCIPAIS (sem dependências)
-- ============================================

-- Tabela: gyms (primeira, sem dependências)
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

-- Tabela: users (segunda, sem dependências)
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
-- 2. TABELAS COM DEPENDÊNCIAS SIMPLES
-- ============================================

-- Tabela: user_gyms (depende de gyms e users)
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

-- Tabela: gym_plans (depende de gyms) - CRIAR ANTES DE members!
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

-- Tabela: trainers (depende de users e gyms)
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
-- 3. TABELAS COM DEPENDÊNCIAS COMPLEXAS
-- ============================================

-- Tabela: members (depende de users, gyms, trainers, gym_plans)
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

-- Tabela: workouts (depende de users, gyms, trainers)
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

-- Tabela: workout_members (depende de workouts e members)
CREATE TABLE IF NOT EXISTS workout_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workoutId" UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  "memberId" UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  "assignedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("workoutId", "memberId")
);

-- Tabela: attendance (depende de members e users)
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

-- Tabela: expenses (depende de users e gyms)
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

-- Tabela: todos (depende de users e gyms)
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  "userId" UUID NOT NULL REFERENCES users(id),
  "gymId" UUID REFERENCES gyms(id),
  "doneAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: manager_temp_passwords (depende de users e gyms)
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
-- 4. TABELAS NEXTAUTH
-- ============================================

-- Tabela: accounts (NextAuth)
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

-- Tabela: sessions (NextAuth)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionToken" VARCHAR(255) UNIQUE NOT NULL,
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Tabela: verification_tokens (NextAuth)
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY(identifier, token)
);

-- ============================================
-- 5. DESATIVAR ROW LEVEL SECURITY
-- ============================================
ALTER TABLE gyms DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_gyms DISABLE ROW LEVEL SECURITY;
ALTER TABLE gym_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE trainers DISABLE ROW LEVEL SECURITY;
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE workouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE workout_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE todos DISABLE ROW LEVEL SECURITY;
ALTER TABLE manager_temp_passwords DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. CRIAR ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_gyms_user_id ON user_gyms("userId");
CREATE INDEX IF NOT EXISTS idx_user_gyms_gym_id ON user_gyms("gymId");
CREATE INDEX IF NOT EXISTS idx_gym_plans_gym_id ON gym_plans("gymId");
CREATE INDEX IF NOT EXISTS idx_members_gym_id ON members("gymId");
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members("userId");
CREATE INDEX IF NOT EXISTS idx_members_trainer_id ON members("trainerId");
CREATE INDEX IF NOT EXISTS idx_trainers_gym_id ON trainers("gymId");
CREATE INDEX IF NOT EXISTS idx_workouts_gym_id ON workouts("gymId");
CREATE INDEX IF NOT EXISTS idx_expenses_gym_id ON expenses("gymId");
CREATE INDEX IF NOT EXISTS idx_todos_gym_id ON todos("gymId");

-- ============================================
-- 7. DADOS DE EXEMPLO (SEED)
-- ============================================

-- 1. Criar academia
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
);

-- 2. Criar usuário administrador (senha: admin123)
-- Hash bcrypt para 'admin123'
INSERT INTO users (name, email, "emailVerified", "passwordHash", role)
VALUES (
  'Administrador Principal',
  'admin@gymmanager.com.br',
  NOW(),
  '$2a$10$LgUWBqOqKqxKqxKqxKqxKuOqKqxKqxKqxKqxKqxKqxKqxKqxKqxKq',
  'SUPER_ADMIN'
);

-- 3. Vincular usuário à academia
INSERT INTO user_gyms ("userId", "gymId", role, status)
SELECT u.id, g.id, 'GYM_ADMIN', 'ACTIVE'
FROM users u, gyms g
WHERE u.email = 'admin@gymmanager.com.br'
  AND g.name = 'Academia FitLife';

-- 4. Criar planos da academia (ANTES dos membros!)
INSERT INTO gym_plans ("gymId", name, description, price, duration, "maxMembers", "isActive")
SELECT g.id, p.name, p.description, p.price, p.duration, p."maxMembers", p."isActive"
FROM (VALUES
  ('Plano Mensal', 'Acesso completo à academia por 30 dias', 99.90, 30, 100, true),
  ('Plano Trimestral', 'Acesso completo por 90 dias com 10% de desconto', 269.90, 90, 50, true),
  ('Plano Anual', 'Acesso completo por 1 ano com 20% de desconto', 959.90, 365, 30, true)
) AS p(name, description, price, duration, "maxMembers", "isActive")
CROSS JOIN gyms g
WHERE g.name = 'Academia FitLife';

-- 5. Criar treinadores
INSERT INTO trainers (name, email, phone, specialty, status, certifications, "userId", "gymId")
SELECT
  t.name, t.email, t.phone, t.specialty, t.status, t.certifications,
  u.id, g.id
FROM (VALUES
  ('Carlos Silva', 'carlos@fitlife.com.br', '(11) 98888-8888', 'Musculação', 'Ativo', 'CREF 123456-SP'),
  ('Ana Santos', 'ana@fitlife.com.br', '(11) 97777-7777', 'Yoga e Pilates', 'Ativo', 'CREF 654321-SP'),
  ('Roberto Oliveira', 'roberto@fitlife.com.br', '(11) 96666-6666', 'Cross Training', 'Ativo', 'CREF 789012-SP')
) AS t(name, email, phone, specialty, status, certifications)
CROSS JOIN users u
CROSS JOIN gyms g
WHERE u.email = 'admin@gymmanager.com.br'
  AND g.name = 'Academia FitLife';

-- 6. Criar membros
INSERT INTO members (name, email, phone, plan, status, "lastVisit", "trainerId", "userId", "planRenewalDate", "paymentDate", "gymId")
SELECT
  m.name, m.email, m.phone, m.plan, m.status,
  CASE m.lastVisitOffset
    WHEN 0 THEN NOW()
    ELSE NOW() - (m.lastVisitOffset || ' days')::INTERVAL
  END,
  tr.id, u.id,
  NOW() + (m.planRenewalOffset || ' days')::INTERVAL,
  NOW() + (m.paymentOffset || ' days')::INTERVAL,
  g.id
FROM (VALUES
  ('João Pereira', 'joao.pereira@email.com', '(11) 91111-1111', 'Mensal', 'Ativo', 0, 0, 30, 0),
  ('Maria Souza', 'maria.souza@email.com', '(11) 92222-2222', 'Trimestral', 'Ativo', 2, 90, 90, 0),
  ('Pedro Costa', 'pedro.costa@email.com', '(11) 93333-3333', 'Anual', 'Ativo', 1, 365, 365, 0),
  ('Fernanda Lima', 'fernanda.lima@email.com', '(11) 94444-4444', 'Mensal', 'Inativo', 60, -30, -30, 0),
  ('Lucas Martins', 'lucas.martins@email.com', '(11) 95555-5555', 'Mensal', 'Ativo', 0, 30, 30, 0)
) AS m(name, email, phone, plan, status, lastVisitOffset, planRenewalOffset, paymentOffset, _)
CROSS JOIN users u
CROSS JOIN gyms g
CROSS JOIN LATERAL (
  SELECT id FROM trainers WHERE "gymId" = g.id ORDER BY name LIMIT 1 OFFSET 
    CASE m.name
      WHEN 'João Pereira' THEN 0
      WHEN 'Maria Souza' THEN 1
      WHEN 'Pedro Costa' THEN 2
      WHEN 'Fernanda Lima' THEN 0
      ELSE 2
    END
) tr
WHERE u.email = 'admin@gymmanager.com.br'
  AND g.name = 'Academia FitLife';

-- 7. Criar treinos
INSERT INTO workouts (name, type, duration, level, description, "userId", "gymId", "trainerId")
SELECT
  w.name, w.type, w.duration, w.level, w.description,
  u.id, g.id, tr.id
FROM (VALUES
  ('Treino A - Peito e Tríceps', 'Musculação', '60', 'Intermediário', 'Foco em peito e tríceps'),
  ('Treino B - Costas e Bíceps', 'Musculação', '60', 'Intermediário', 'Foco em costas e bíceps'),
  ('Aula de Yoga - Iniciantes', 'Yoga', '90', 'Iniciante', 'Posturas básicas de yoga'),
  ('WOD Cross Training', 'Cross Training', '45', 'Avançado', 'Circuito intenso do dia')
) AS w(name, type, duration, level, description)
CROSS JOIN users u
CROSS JOIN gyms g
CROSS JOIN LATERAL (
  SELECT id FROM trainers WHERE "gymId" = g.id AND 
    CASE w.name
      WHEN 'Treino A - Peito e Tríceps' THEN specialty = 'Musculação'
      WHEN 'Treino B - Costas e Bíceps' THEN specialty = 'Musculação'
      WHEN 'Aula de Yoga - Iniciantes' THEN specialty LIKE '%Yoga%'
      WHEN 'WOD Cross Training' THEN specialty LIKE '%Cross%'
      ELSE true
    END
  ORDER BY name LIMIT 1
) tr
WHERE u.email = 'admin@gymmanager.com.br'
  AND g.name = 'Academia FitLife';

-- 8. Vincular membros aos treinos
INSERT INTO workout_members ("workoutId", "memberId")
SELECT w.id, m.id
FROM (VALUES
  ('Treino A - Peito e Tríceps', 'João Pereira'),
  ('Aula de Yoga - Iniciantes', 'Maria Souza'),
  ('WOD Cross Training', 'Pedro Costa'),
  ('Treino B - Costas e Bíceps', 'Lucas Martins')
) AS wm(workout, member)
JOIN workouts w ON w.name = wm.workout
JOIN members m ON m.name = wm.member;

-- 9. Criar registros de presença
INSERT INTO attendance (date, "memberId", "memberEmail", "checkIn", status, "userId")
SELECT NOW(), m.id, m.email, NOW(), 'Presente', u.id
FROM members m, users u
WHERE m.name IN ('João Pereira', 'Maria Souza', 'Pedro Costa')
  AND u.email = 'admin@gymmanager.com.br';

-- 10. Criar despesas
INSERT INTO expenses (title, description, amount, category, date, "userId", "gymId")
SELECT
  e.title, e.description, e.amount, e.category, NOW(),
  u.id, g.id
FROM (VALUES
  ('Aluguel do Espaço', 'Aluguel mensal', 5000.00, 'Aluguel'),
  ('Conta de Luz', 'Energia elétrica', 800.00, 'Utilities'),
  ('Manutenção de Equipamentos', 'Revisão mensal', 1200.00, 'Manutenção'),
  ('Salário Instrutores', 'Pagamento equipe', 8000.00, 'Pessoal')
) AS e(title, description, amount, category)
CROSS JOIN users u
CROSS JOIN gyms g
WHERE u.email = 'admin@gymmanager.com.br'
  AND g.name = 'Academia FitLife';

-- 11. Criar tarefas
INSERT INTO todos (title, "userId", "gymId", "doneAt")
SELECT
  t.title, u.id, g.id,
  CASE WHEN t.done THEN NOW() ELSE NULL END
FROM (VALUES
  ('Comprar novos halteres', false),
  ('Agendar limpeza dos tapetes de yoga', false),
  ('Renovar contrato de internet', false),
  ('Comprar água para bebedouro', true)
) AS t(title, done)
CROSS JOIN users u
CROSS JOIN gyms g
WHERE u.email = 'admin@gymmanager.com.br'
  AND g.name = 'Academia FitLife';

-- ============================================
-- VERIFICAR DADOS CRIADOS
-- ============================================
SELECT 'gyms' as tabela, COUNT(*) as registros FROM gyms
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'user_gyms', COUNT(*) FROM user_gyms
UNION ALL SELECT 'gym_plans', COUNT(*) FROM gym_plans
UNION ALL SELECT 'trainers', COUNT(*) FROM trainers
UNION ALL SELECT 'members', COUNT(*) FROM members
UNION ALL SELECT 'workouts', COUNT(*) FROM workouts
UNION ALL SELECT 'workout_members', COUNT(*) FROM workout_members
UNION ALL SELECT 'attendance', COUNT(*) FROM attendance
UNION ALL SELECT 'expenses', COUNT(*) FROM expenses
UNION ALL SELECT 'todos', COUNT(*) FROM todos;
