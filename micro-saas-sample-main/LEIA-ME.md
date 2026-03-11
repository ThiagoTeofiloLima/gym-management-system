# ⚡ Instruções Rápidas - Configurar PostgreSQL

## 🎯 Siga estes 3 passos

### 1️⃣ Criar Banco no PGAdmin

```
PGAdmin → Botão direito em "Databases" 
  → Create → Database...
  → Database: microsaas_gyms
  → Owner: postgres
  → Save
```

---

### 2️⃣ Rodar Comandos no Terminal

```bash
# 1. Criar tabelas
npx prisma migrate dev --name init_multi_tenant

# 2. Migrar dados
npm run db:migrate

# 3. Iniciar app
npm run dev
```

---

### 3️⃣ Visualizar Dados

**PGAdmin:**
```
Databases → microsaas_gyms → Tables
→ Botão direito em "gyms" → View/Edit Data
```

**Navegador:**
```
http://localhost:3000/app/gyms
```

---

## ✅ Esperado

- 1 academia: "Academia Padrão"
- 2 usuários
- ~75 membros
- Todos os dados do `db.json` migrados

---

## 🔗 Links

- **Dashboard**: http://localhost:3000/app/gyms
- **Prisma Studio**: `npx prisma studio`
- **Documentação completa**: `CONFIGURACAO_POSTGRES.md`

---

**🎉 Pronto! Seu micro-SaaS multi-tenant está configurado!**
