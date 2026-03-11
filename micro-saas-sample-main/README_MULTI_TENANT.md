# 🏋️ Micro-SaaS Multi-Tenant para Academias

Sistema multi-tenant para gestão de academias usando PostgreSQL.

## 📋 Arquitetura Multi-Tenant

### Como funciona

- **Cada academia tem seus próprios dados** isolados através do campo `gymId`
- **Administradores** (`role = 'admin'`) podem ver **todos os dados** de todas as academias
- **Usuários comuns** (`role = 'user'`) veem apenas dados da **sua academia**
- **Banco de dados**: PostgreSQL local (pode ser migrado para produção facilmente)

### Modelo de Dados

```
┌─────────────┐
│    Gym      │ ← Academia (tenant)
├─────────────┤
│ - id        │
│ - name      │
│ - cnpj      │
│ - isActive  │
│ - plan      │
└─────────────┘
       │
       │ 1:N
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │     │   Member    │     │   Trainer   │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ - id        │     │ - id        │     │ - id        │
│ - email     │     │ - name      │     │ - name      │
│ - role      │────▶│ - gymId     │     │ - gymId     │
│ - gymId     │     │ - status    │     │ - specialty │
└─────────────┘     └─────────────┘     └─────────────┘
       │                  │                    │
       │                  │                    │
       ▼                  ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Todo     │     │   Expense   │     │   Workout   │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ - gymId     │     │ - gymId     │     │ - gymId     │
└─────────────┘     └─────────────┘     └─────────────┘
```

## 🚀 Configuração Inicial

### 1. Criar Banco de Dados no PGAdmin

1. **Abra o PGAdmin**
2. **Botão direito em "Databases"** → **"Create" → "Database..."**
3. Preencha:
   - **Database**: `microsaas_gyms`
   - **Owner**: `postgres`
4. Clique em **"Save"**

### 2. Rodar Migrações

```bash
# Gerar cliente Prisma
npx prisma generate

# Criar tabelas no PostgreSQL
npx prisma migrate dev --name init_multi_tenant

# Migrar dados do SQLite para PostgreSQL
npm run db:migrate
```

### 3. Visualizar Dados no PGAdmin

No PGAdmin:
1. Expanda: **Databases → microsaas_gyms → Schemas → public → Tables**
2. Tabelas disponíveis:
   - `gyms` - Academias
   - `users` - Usuários
   - `members` - Membros/Alunos
   - `trainers` - Treinadores
   - `workouts` - Treinos
   - `expenses` - Despesas
   - `todos` - Tarefas
   - `workout_members` - Relação treinos-membros

3. **Botão direito na tabela** → **"View/Edit Data"** → **"All Rows"**

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia Next.js
npx prisma studio        # Abre Prisma Studio (GUI)

# Banco de dados
npm run db:generate      # Gera cliente Prisma
npm run db:push          # Aplica schema ao banco
npm run db:migrate       # Migra dados SQLite → PostgreSQL
npm run db:studio        # Prisma Studio

# Produção
npm run build
npm run start
```

## 📊 Acessando o Sistema

1. **Inicie o servidor**: `npm run dev`
2. **Acesse**: http://localhost:3000
3. **Vá para**: http://localhost:3000/app/gyms (Gestão de Academias)

## 🔐 Controle de Acesso

### Admin (vê tudo)
```typescript
// Usuário com role = 'admin'
const user = await prisma.user.findUnique({
  where: { email: 'seu-email@admin.com' },
  data: { role: 'admin' }
})
```

### User (vê apenas da sua academia)
```typescript
// Filtra automaticamente pelo gymId
const members = await prisma.member.findMany({
  where: { gymId: 'gym-id-do-usuario' }
})
```

## 🌐 Migrar para Produção

Para usar um banco PostgreSQL online (ex: Vercel, Railway, Supabase):

1. Atualize o `.env`:
```env
DATABASE_URL="postgresql://user:senha@host:5432/microsaas_gyms"
```

2. Rode as migrações:
```bash
npx prisma migrate deploy
```

## 🛠️ Utilitários Multi-Tenant

O arquivo `src/lib/multi-tenant.ts` fornece funções úteis:

```typescript
import { getTenantContext, applyTenantFilter } from '@/lib/multi-tenant'

// Obter contexto do tenant
const context = await getTenantContext(userId)

// Aplicar filtro em consultas
const members = await prisma.member.findMany({
  where: applyTenantFilter(context, { status: 'Ativo' })
})
```

## 📝 Dados Migrados

Todos os dados do SQLite foram migrados para uma academia padrão chamada **"Academia Padrão"**:
- ✅ Usuários
- ✅ Membros
- ✅ Treinadores
- ✅ Treinos
- ✅ Despesas
- ✅ Tarefas

## 🎯 Próximos Passos Sugeridos

1. **Criar novas academias** via página `/app/gyms`
2. **Cadastrar usuários** em cada academia
3. **Implementar autenticação** com seleção de academia
4. **Configurar roles** (admin/user) por usuário
5. **Migrar para PostgreSQL online** quando estiver em produção

## 🔗 Links Úteis

- [Prisma Docs](https://www.prisma.io/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Next.js Docs](https://nextjs.org/docs)
- [PGAdmin](https://www.pgadmin.org/docs/)
