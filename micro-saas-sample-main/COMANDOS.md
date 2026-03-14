# 🚀 Guia Rápido de Comandos

## Configuração Inicial

```bash
# 1. Instalar dependências
npm install

# 2. Gerar cliente Prisma
npx prisma generate

# 3. Criar migrations do banco
npx prisma migrate dev --name init_multi_tenant

# 4. Popular banco com dados de exemplo
npm run db:seed
```

## Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Abrir Prisma Studio (visualizar banco)
npx prisma studio

# Rodar linter
npm run lint
```

## Produção

```bash
# Build de produção
npm run build

# Iniciar servidor de produção
npm run start
```

## Banco de Dados

```bash
# Criar nova migration
npx prisma migrate dev --name nome_da_migration

# Aplicar migrations em produção
npx prisma migrate deploy

# Resetar banco (cuidado: apaga tudo!)
npx prisma migrate reset

# Rodar seed manualmente
npm run db:seed

# Push direto do schema (dev apenas)
npx prisma db push
```

## Comandos Úteis

```bash
# Verificar status do git
git status

# Instalar nova dependência
npm install nome-pacote

# Instalar dependência de dev
npm install -D nome-pacote-dev
```

## Login - Dados de Teste

**Super Admin:**
- Email: `admin@gymmanager.com.br`
- Senha: `admin123`

**Gerentes:**
- `carlos@irongym.com.br` / `admin123`
- `ana@fitlife.com.br` / `admin123`
- `roberto@bodytech.com.br` / `admin123`

## URLs

- **App**: http://localhost:3000
- **Auth**: http://localhost:3000/auth
- **Dashboard**: http://localhost:3000/app
- **Prisma Studio**: http://localhost:5555

## Troubleshooting

### Erro no build
```bash
# Limpar cache
rm -rf .next node_modules
npm install
npm run build
```

### Erro no Prisma
```bash
# Regenerar cliente
npx prisma generate

# Resetar migrations
rm -rf prisma/migrations
npx prisma migrate dev --name init
```

### Erro de autenticação
```bash
# Verificar .env
cat .env

# Gerar nova AUTH_SECRET
openssl rand -base64 32
```

## Deploy (Vercel)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy preview
vercel

# Deploy produção
vercel --prod
```

### Variáveis de Ambiente na Vercel

Configurar no dashboard da Vercel:
- `DATABASE_URL` (Supabase/Neon/Railway)
- `AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`
- `STRIPE_*`

## Monitoramento

```bash
# Ver logs em tempo real (Vercel)
vercel logs

# Verificar build
npm run build

# Testar produção localmente
npm run start
```

---

**Dica**: Mantenha sempre o `.env` atualizado e nunca o commit no git!
