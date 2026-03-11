# 🐘 Configuração do PostgreSQL - PGAdmin

## Passo 1: Criar o Banco de Dados no PGAdmin

1. **Abra o PGAdmin** no seu computador
2. **Conecte-se ao servidor PostgreSQL** (geralmente já vem configurado)
3. **Clique com o botão direito** em "Databases"
4. Selecione **"Create" > "Database..."**
5. Preencha:
   - **Database**: `microsaas_gyms`
   - **Owner**: `postgres`
6. Clique em **"Save"**

## Passo 2: Rodar as Migrações

Após criar o banco, volte ao terminal e execute:

```bash
# Rodar migrações do Prisma (cria as tabelas)
npx prisma migrate dev --name init_multi_tenant

# Rodar script de migração dos dados (SQLite -> PostgreSQL)
npm run db:migrate
```

## Passo 3: Visualizar os Dados

No PGAdmin:
1. Expanda **"Databases" > "microsaas_gyms" > "Schemas" > "public" > "Tables"**
2. Você verá as tabelas:
   - `gyms` - Suas academias (multi-tenant)
   - `users` - Usuários (cada um vinculado a uma academia)
   - `members` - Membros/alunos
   - `trainers` - Treinadores
   - `workouts` - Treinos
   - `expenses` - Despesas
   - `todos` - Tarefas
   - `workout_members` - Relação treinos-membros

3. **Clique com botão direito** em qualquer tabela e selecione **"View/Edit Data"**

## 📊 Estrutura Multi-Tenant

- Cada academia tem seu próprio `gym_id`
- Usuários com `role = 'admin'` podem ver todos os dados
- Usuários com `role = 'user'` veem apenas dados da sua academia
- A academia padrão criada se chama **"Academia Padrão"**

## 🔗 String de Conexão

O arquivo `.env` já está configurado com:
```
DATABASE_URL="postgresql://postgres:2002@localhost:5432/microsaas_gyms?schema=public"
```

Se sua senha for diferente, atualize o `.env` e rode:
```bash
npx prisma generate
```
