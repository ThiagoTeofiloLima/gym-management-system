# Migração para Supabase - Concluída ✅

## 📋 Resumo

Todo o banco de dados local (Prisma + PostgreSQL local) foi removido e substituído pelo **Supabase** como banco de dados principal.

---

## 🔄 O que foi alterado

### 1. **Dependências**

**Removidas:**
- `prisma`
- `@prisma/client`
- `@auth/prisma-adapter`

**Adicionadas:**
- `@supabase/supabase-js`

### 2. **Arquivos Removidos**

- `prisma/` (pasta completa com schema.prisma, migrations, seeds)
- `db.json` (banco de dados JSON legado)
- `src/services/json-db.ts`
- `src/services/database.ts` (legado)
- `verify.ts`, `check-users.ts`, `check-db.ts` (scripts de verificação do Prisma)

### 3. **Novos Arquivos Criados**

- `src/lib/supabase.ts` - Cliente Supabase
- `src/types/database.ts` - Tipos TypeScript para todos os modelos

### 4. **Arquivos Atualizados**

#### Serviços Principais
- `src/services/database/index.ts` - Reescrito completamente para usar Supabase
- `src/services/auth/index.ts` - Atualizado para usar o database service
- `src/services/auth/prisma-adapter.ts` - Renomeado para `supabaseAdapter`
- `src/services/auth/json-adapter.ts` - Atualizado para usar Supabase
- `src/lib/prisma.ts` - Agora é um wrapper para `src/services/database`
- `src/lib/multi-tenant.ts` - Atualizado para usar funções do database service

#### APIs (Todas as rotas da API)
- `src/app/api/members/route.ts`
- `src/app/api/members/[id]/route.ts`
- `src/app/api/members/get-by-user/route.ts`
- `src/app/api/trainers/route.ts`
- `src/app/api/trainers/[id]/route.ts`
- `src/app/api/workouts/route.ts`
- `src/app/api/workouts/[id]/route.ts`
- `src/app/api/expenses/route.ts`
- `src/app/api/expenses/[id]/route.ts`
- `src/app/api/attendance/route.ts`
- `src/app/api/attendance/[id]/route.ts`
- `src/app/api/gym-plans/route.ts`
- `src/app/api/gym-plans/[id]/route.ts`
- `src/app/api/gyms/route.ts`
- `src/app/api/gyms/[id]/route.ts`
- `src/app/api/gyms/users/route.ts`
- `src/app/api/data/route.ts`
- `src/app/api/db/route.ts`
- `src/app/api/dashboard/route.ts`
- `src/app/api/financial/data/route.ts`
- `src/app/api/test/route.ts`
- `src/app/api/users/change-password/route.ts`
- Todas as APIs de superadmin

#### Componentes e Actions
- `src/app/app/(home)/actions.ts`
- `src/app/app/settings/(main)/actions.ts`

#### Tipos
- `src/types/next-auth.d.ts`
- `src/types/database.ts` (novo)

#### Configuração
- `.env` - Atualizado com variáveis do Supabase
- `.env.example` - Atualizado com variáveis do Supabase
- `package.json` - Removidos scripts do Prisma

---

## 📦 Variáveis de Ambiente Necessárias

```env
# SUPABASE
SUPABASE_URL="https://seu-projeto.supabase.co"
SUPABASE_ANON_KEY="sua-anon-key"
SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"

# AUTENTICAÇÃO
AUTH_SECRET="sua-chave-secreta"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_USER_EMAIL="admin@gymmanager.com.br"

# OAUTH PROVIDERS (opcional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""

# EMAIL (opcional)
EMAIL_SERVER="smtp.mailtrap.io"
EMAIL_PORT="2525"
EMAIL_USER=""
EMAIL_PASSWORD=""
EMAIL_FROM="noreply@gymmanager.com.br"

# STRIPE (opcional)
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

---

## 🗄️ Schema do Banco de Dados no Supabase

O schema do banco de dados no Supabase deve seguir a mesma estrutura do schema.prisma anterior. As principais tabelas são:

- `gyms` - Academias
- `users` - Usuários
- `user_gyms` - Vínculo entre usuários e academias
- `members` - Membros/Alunos
- `trainers` - Treinadores
- `workouts` - Treinos
- `workout_members` - Vínculo entre treinos e membros
- `attendance` - Presenças
- `expenses` - Despesas
- `todos` - Tarefas
- `gym_plans` - Planos das academias
- `manager_temp_passwords` - Senhas temporárias de gestores
- `accounts`, `sessions`, `verification_tokens` - NextAuth

---

## 🚀 Como Rodar o Projeto

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
# Copie .env.example para .env e preencha com suas credenciais do Supabase

# 3. Rodar o projeto
npm run dev
```

---

## 🔧 Principais Diferenças: Prisma → Supabase

### 1. **Consultas**

**Prisma:**
```typescript
const members = await prisma.member.findMany({
  where: { gymId, status: 'Ativo' },
  include: { trainer: true }
})
```

**Supabase:**
```typescript
const members = await db.findMembers({ 
  gymId, 
  status: 'Ativo' 
})
// trainer já vem incluído automaticamente
```

### 2. **Criação**

**Prisma:**
```typescript
const member = await prisma.member.create({
  data: { name, email, phone, plan, gymId, userId }
})
```

**Supabase:**
```typescript
const member = await db.createMember({
  name, email, phone, plan, gymId, userId
})
```

### 3. **Atualização**

**Prisma:**
```typescript
const member = await prisma.member.update({
  where: { id },
  data: { status: 'Inativo' }
})
```

**Supabase:**
```typescript
const member = await db.updateMember(id, {
  status: 'Inativo'
})
```

### 4. **Exclusão**

**Prisma:**
```typescript
await prisma.member.delete({
  where: { id }
})
```

**Supabase:**
```typescript
await db.deleteMember(id)
```

### 5. **Transações**

**Prisma:**
```typescript
await prisma.$transaction(async (tx) => {
  await tx.user.create({...})
  await tx.userGym.create({...})
})
```

**Supabase:**
```typescript
// Operações sequenciais com rollback manual
const user = await db.createUser({...})
try {
  await db.createUserGym({...})
} catch (error) {
  await db.deleteUser(user.id) // Rollback
  throw error
}
```

---

## ✅ Checklist de Migração

- [x] Instalar @supabase/supabase-js
- [x] Remover dependências do Prisma
- [x] Criar cliente Supabase
- [x] Criar tipos TypeScript
- [x] Reescrever database service para Supabase
- [x] Atualizar autenticação (NextAuth)
- [x] Atualizar todas as APIs
- [x] Atualizar actions e components
- [x] Remover arquivos do Prisma
- [x] Remover db.json
- [x] Atualizar package.json
- [x] Atualizar .env e .env.example
- [x] Atualizar documentação

---

## 📝 Notas Importantes

1. **SERVICE_ROLE_KEY**: Use sempre a `service_role_key` no backend para ter acesso total ao banco de dados.

2. **RLS (Row Level Security)**: Se habilitar RLS no Supabase, certifique-se de configurar as políticas corretamente para cada tabela.

3. **Datas**: O Supabase trabalha com strings ISO 8601 (`"2024-01-15T10:30:00Z"`) ao invés de objetos Date do JavaScript.

4. **Includes**: O Supabase não suporta `include` como o Prisma. As relações são buscadas separadamente ou através de `select` com joins.

5. **Transações**: O Supabase não tem transações no cliente. Para operações atômicas, use:
   - Operações sequenciais com rollback manual
   - RPC (Remote Procedure Calls) no Supabase
   - Edge Functions para lógica complexa

---

## 🔗 Links Úteis

- [Documentação do Supabase](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [Dashboard do Projeto](https://rzurauvqczgrpbblvcpj.supabase.com)

---

**✅ Migração concluída em: 20 de março de 2026**
