-- =====================================================
-- Script para criar o banco de dados microsaas_gyms
-- =====================================================
-- Execute no PGAdmin Query Tool ou via terminal:
-- psql -U postgres -h localhost -f create_db_postgres.sql
-- =====================================================

-- Criar banco de dados
CREATE DATABASE microsaas_gyms;

-- Conectar ao banco (apenas no psql)
\c microsaas_gyms;

-- Listar bancos para confirmar
-- \l

-- =====================================================
-- Após criar o banco, rode as migrações do Prisma:
-- =====================================================
-- npx prisma migrate dev --name init_multi_tenant
-- npm run db:migrate
-- =====================================================
