# 🔐 Sistema de Autenticação e Multi-Tenant Implementado

## ✅ O que foi implementado

### 1. **Schema do Banco de Dados Atualizado**

O Prisma schema foi atualizado com:
- **Enums de Roles**: `SUPER_ADMIN`, `GYM_ADMIN`, `USER`
- **Enum de Status**: `ACTIVE`, `INACTIVE`, `PENDING`
- **Modelo `UserGym`**: Tabela pivô para relação many-to-many entre usuários e academias
- **Campos de plano**: `maxMembers`, `maxUsers`, `planExpiresAt`

### 2. **Hierarquia de Papéis (Roles)**

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPER_ADMIN (Você)                       │
│  - Acesso total a TODAS as academias e dados do sistema     │
│  - Pode criar/gerenciar academias                           │
│  - Pode adicionar/remover gerentes                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    GYM_ADMIN (Gerente)                      │
│  - Acesso APENAS aos dados da SUA academia                  │
│  - Pode gerenciar membros, treinadores, treinos             │
│  - Não vê dados de outras academias                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      USER (Instrutor)                       │
│  - Acesso limitado à sua academia                           │
│  - Pode visualizar membros e treinos                        │
│  - Permissões restritas para edição                         │
└─────────────────────────────────────────────────────────────┘
```

### 3. **Script de Seed com Dados Reais**

Execute: `npm run db:seed`

O script cria:
- **1 Super Admin**: `admin@gymmanager.com.br` / `admin123`
- **3 Academias**:
  - Iron Gym - Centro (Enterprise)
  - FitLife Academia (Pro)
  - BodyTech Studio (Basic)
- **3 Gerentes** (um por academia)
- **9 Usuários comuns** (3 por academia)
- **20 Membros** distribuídos
- **6 Treinadores**
- **9 Workouts**
- **15 Despesas**

### 4. **NextAuth Configurado**

Providers habilitados:
- ✅ Google OAuth
- ✅ GitHub OAuth
- ✅ Email Magic Link (nodemailer)

Callbacks implementados:
- `session`: Adiciona role, academias e contexto do usuário
- `jwt`: Mantém informações no token

### 5. **Middleware de Segurança**

O middleware (`src/middleware.ts`):
- Protege todas as rotas `/app/*`
- Redireciona não-autenticados para `/auth`
- Permite rotas públicas: `/`, `/auth`, `/api/auth`

### 6. **Utilitário Multi-Tenant**

Arquivo: `src/lib/multi-tenant.ts`

Funções principais:
- `getTenantContext()`: Obtém contexto do usuário atual
- `hasPermission()`: Verifica se tem role necessária
- `applyTenantFilter()`: Aplica filtro automático por academia
- `canAccessGym()`: Verifica acesso a academia específica
- `getUserAccessibleGyms()`: Lista academias acessíveis

### 7. **APIs Atualizadas**

Todas as APIs agora:
- ✅ Verificam autenticação via `auth()`
- ✅ Obtêm contexto via `getTenantContext()`
- ✅ Aplicam filtro multi-tenant automaticamente
- ✅ Super Admin vê tudo, outros veem apenas sua academia

APIs atualizadas:
- `/api/members` - GET, POST
- `/api/members/[id]` - PUT, DELETE
- `/api/trainers` - GET, POST
- `/api/trainers/[id]` - PUT, DELETE
- `/api/workouts` - GET, POST
- `/api/workouts/[id]` - PUT, DELETE
- `/api/expenses` - GET, POST
- `/api/expenses/[id]` - PUT, DELETE
- `/api/gyms` - GET, POST
- `/api/gyms/[id]` - PATCH, DELETE
- `/api/gyms/users` - GET, POST

### 8. **UI Atualizada**

**Sidebar com Seletor de Academia:**
- Usuários com múltiplas academias veem dropdown
- Super Admin vê todas as academias
- Indicação visual de role (badge "Admin", coroa para Super Admin)

**User Dropdown:**
- Mostra role do usuário
- Mostra academia ativa
- Links específicos para Super Admin

**Página de Academias (Super Admin):**
- Lista todas as academias
- Mostra contagem de dados (membros, usuários, etc)
- Ativa/desativa academias
- Cria novas academias

## 🚀 Como Usar

### 1. Configurar Banco de Dados

```bash
# Garantir PostgreSQL rodando
# Criar banco: microsaas_gyms

# Rodar migrações
npx prisma migrate dev --name init_multi_tenant

# Popular banco com seed
npm run db:seed
```

### 2. Configurar Variáveis de Ambiente

Edite `.env`:
```env
DATABASE_URL="postgresql://postgres:2002@localhost:5432/microsaas_gyms"
AUTH_SECRET="sua-chave-secreta"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# OAuth (obter nos respectivos consoles)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""

# Email (Mailtrap para dev)
EMAIL_SERVER="smtp.mailtrap.io"
EMAIL_PORT="2525"
EMAIL_USER=""
EMAIL_PASSWORD=""
EMAIL_FROM="noreply@gymmanager.com.br"

# Stripe
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 3. Rodar Aplicação

```bash
npm run dev
```

### 4. Fazer Login

**Super Admin:**
- Email: `admin@gymmanager.com.br`
- Senha: `admin123`

**Gerentes:**
- Iron Gym: `carlos@irongym.com.br` / `admin123`
- FitLife: `ana@fitlife.com.br` / `admin123`
- BodyTech: `roberto@bodytech.com.br` / `admin123`

## 🔒 Fluxo de Autenticação

1. Usuário acessa `/app` → Middleware verifica token
2. Sem token → Redireciona para `/auth`
3. Após login → NextAuth cria sessão + cookie
4. Callbacks adicionam informações de role e academias
5. Layout do app obtém contexto via `getTenantContext()`
6. Sidebar mostra seletor de academia (se múltiplas)
7. APIs filtram dados automaticamente pelo tenant

## 📊 Acessando Dados

### Super Admin (vê tudo)
```typescript
const context = await getTenantContext()
// context.isSuperAdmin = true
// Pode acessar todas as academias
```

### Gym Admin (vê apenas sua academia)
```typescript
const context = await getTenantContext()
// context.gymId = "id-da-academia"
// context.isGymAdmin = true
// Dados filtrados automaticamente
```

## 🛠️ Próximos Passos Sugeridos

1. **Configurar OAuth Real:**
   - Google Cloud Console
   - GitHub Developer Settings

2. **Configurar Email de Produção:**
   - Resend, SendGrid ou AWS SES

3. **Deploy em Produção:**
   - Vercel (recomendado)
   - Banco: Supabase, Neon ou Railway

4. **Stripe em Produção:**
   - Criar produtos e preços
   - Atualizar chaves para `pk_live`, `sk_live`
   - Configurar webhook

5. **Melhorias de Segurança:**
   - Rate limiting nas APIs
   - Validação de input com Zod
   - HTTPS em produção

## 📝 Arquivos Importantes

```
src/
├── services/
│   ├── auth/index.ts         # Configuração NextAuth
│   └── database/index.ts     # Prisma Client
├── lib/
│   └── multi-tenant.ts       # Utilitários de tenant
├── app/
│   ├── auth/                 # Páginas de autenticação
│   └── app/                  # Páginas do app (protegidas)
│       ├── layout.tsx        # Layout com contexto
│       └── __components/
│           ├── main-sidebar.tsx
│           └── user-dropdown.tsx
└── hooks/
    └── use-tenant.ts         # Hooks React
```

## ⚠️ Importante

- **Em produção**, gere nova `AUTH_SECRET`: `openssl rand -base64 32`
- **Altere todas as senhas** do seed imediatamente
- **Use HTTPS** em produção
- **Configure CORS** se necessário
- **Habilite rate limiting** para APIs

---

**Build Status**: ✅ Aprovado
**Pronto para Produção**: ⚠️ Configure variáveis de ambiente reais
