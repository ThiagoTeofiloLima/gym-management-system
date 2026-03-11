# 🎯 Configuração Completa - PostgreSQL Multi-Tenant

## ✅ O que foi feito

1. **Schema Prisma atualizado** para PostgreSQL com modelo `Gym` (academia)
2. **Multi-tenancy implementado**: cada academia vê apenas seus dados
3. **Admin pode ver tudo**: usuários com `role = 'admin'` têm acesso global
4. **Script de migração** dos dados do SQLite para PostgreSQL
5. **API de academias** criada em `/api/gyms`
6. **Página de gestão** de academias em `/app/gyms`

---

## 📋 PASSOS PARA FINALIZAR

### Passo 1: Criar Banco de Dados no PGAdmin

1. **Abra o PGAdmin** no seu computador
2. No painel esquerdo, expanda **Servers** → **PostgreSQL** (ou o nome do seu servidor)
3. **Clique com botão direito** em **Databases**
4. Selecione **Create** → **Database...**
5. Preencha:
   - **Database**: `microsaas_gyms`
   - **Owner**: `postgres`
6. Clique em **Save**

✅ **Banco criado!**

---

### Passo 2: Rodar Migrações no Terminal

Volte ao terminal do projeto e execute:

```bash
# Gerar o cliente Prisma (atualizado com o novo schema)
npx prisma generate

# Criar as tabelas no PostgreSQL
npx prisma migrate dev --name init_multi_tenant
```

Quando perguntado sobre o nome da migration, digite: `init_multi_tenant`

---

### Passo 3: Migrar os Dados do SQLite

```bash
# Este comando copia todos os dados do db.json para o PostgreSQL
npm run db:migrate
```

✅ **Dados migrados!**

---

### Passo 4: Visualizar no PGAdmin

1. No PGAdmin, expanda:
   ```
   Databases → microsaas_gyms → Schemas → public → Tables
   ```

2. Você verá estas tabelas:
   - `gyms` - Suas academias
   - `users` - Usuários
   - `members` - Membros/Alunos
   - `trainers` - Treinadores
   - `workouts` - Treinos
   - `expenses` - Despesas
   - `todos` - Tarefas
   - `workout_members` - Relação treinos-membros
   - `accounts`, `sessions`, `verification_tokens` - Auth

3. Para ver os dados:
   - **Botão direito** na tabela (ex: `gyms`)
   - **View/Edit Data** → **All Rows**

4. **Dados esperados**:
   - 1 academia chamada **"Academia Padrão"**
   - 2 usuários (Thiago Lima e Maria Silva)
   - ~75 membros
   - Demais dados do db.json

---

### Passo 5: Testar a Aplicação

```bash
# Iniciar o servidor de desenvolvimento
npm run dev
```

Acesse:
- **Home**: http://localhost:3000
- **Academias**: http://localhost:3000/app/gyms

No dashboard, você verá um **card azul** "Gestão de Academias (Multi-Tenant)"

---

## 🔐 Como Funciona o Multi-Tenancy

### Estrutura

```
┌─────────────────────────────────────────┐
│            Academia (Gym)               │
│  - ID: gym-1                            │
│  - Nome: Academia Padrão                │
└─────────────────────────────────────────┘
                    │
                    │ Todos os dados têm gymId
                    ▼
┌─────────────────────────────────────────┐
│  Users  │  Members  │  Trainers  │ ...  │
│  gymId  │  gymId    │  gymId      │      │
└─────────────────────────────────────────┘
```

### Controle de Acesso

- **Admin** (`role = 'admin'`): `WHERE 1=1` (vê tudo)
- **User** (`role = 'user'`): `WHERE gymId = 'gym-do-usuario'`

No código:
```typescript
import { applyTenantFilter } from '@/lib/multi-tenant'

const context = await getTenantContext(userId)

// Admin vê tudo, user vê só da sua academia
const members = await prisma.member.findMany({
  where: applyTenantFilter(context, { status: 'Ativo' })
})
```

---

## 🎯 Criando Novas Academias

### Via Interface (Recomendado)

1. Acesse `/app/gyms`
2. Clique em **"Nova Academia"**
3. Preencha os dados
4. Clique em **Criar**

### Via API

```bash
curl -X POST http://localhost:3000/api/gyms \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Minha Academia",
    "cnpj": "12.345.678/0001-90",
    "email": "contato@minhaacademia.com",
    "phone": "(11) 99999-9999",
    "city": "São Paulo",
    "state": "SP"
  }'
```

### Via PGAdmin

```sql
INSERT INTO gyms (id, name, cnpj, email, city, state, created_at, updated_at)
VALUES (gen_random_uuid(), 'Nova Academia', '12.345.678/0001-90', 'email@teste.com', 'Cidade', 'SP', NOW(), NOW());
```

---

## 📊 Comandos Úteis

```bash
# Ver dados no terminal (Prisma Studio)
npx prisma studio

# Gerar cliente Prisma
npm run db:generate

# Resetar banco (cuidado: apaga tudo!)
npx prisma migrate reset

# Ver status das migrations
npx prisma migrate status
```

---

## 🌐 Migrar para Produção (Online)

Quando quiser usar um banco online:

1. **Contrate um PostgreSQL** (Vercel Postgres, Railway, Supabase, AWS RDS)
2. **Atualize o `.env`**:
   ```env
   DATABASE_URL="postgresql://user:senha@host:5432/microsaas_gyms"
   ```
3. **Rode as migrations**:
   ```bash
   npx prisma migrate deploy
   ```

---

## ❓ Problemas Comuns

### "Erro de conexão com o banco"
- Verifique se o PostgreSQL está rodando
- Confirme a senha no `.env`: `postgresql://postgres:2002@localhost:5432/microsaas_gyms`

### "Tabela não existe"
- Rode: `npx prisma migrate dev`

### "Dados não apareceram"
- Rode: `npm run db:migrate`

---

## 📚 Arquivos Criados/Modificados

| Arquivo | Descrição |
|---------|-----------|
| `prisma/schema.prisma` | Schema PostgreSQL com `Gym` |
| `.env` | Connection string do PostgreSQL |
| `prisma/migrate.ts` | Script de migração dos dados |
| `src/lib/multi-tenant.ts` | Utilitários multi-tenant |
| `src/app/api/gyms/route.ts` | API de academias |
| `src/app/app/gyms/page.tsx` | Página de gestão de academias |
| `INSTRUCOES_PGADMIN.md` | Guia rápido do PGAdmin |
| `README_MULTI_TENANT.md` | Documentação completa |

---

## ✅ Checklist Final

- [ ] Banco `microsaas_gyms` criado no PGAdmin
- [ ] `npx prisma generate` rodou sem erros
- [ ] `npx prisma migrate dev` criou as tabelas
- [ ] `npm run db:migrate` migrou os dados
- [ ] Conseguiu ver os dados no PGAdmin
- [ ] `npm run dev` iniciou sem erros
- [ ] Acessou `/app/gyms` e viu a academia padrão

---

**🎉 Tudo pronto! Seu micro-SaaS multi-tenant está configurado!**
