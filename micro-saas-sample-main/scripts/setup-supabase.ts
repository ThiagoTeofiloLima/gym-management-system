/**
 * Script para criar o schema no Supabase
 * 
 * Instruções:
 * 1. Acesse o dashboard do Supabase: https://supabase.com/dashboard/project/rzurauvqczgrpbblvcpj
 * 2. Vá em: Database → Query Editor (ou SQL Editor)
 * 3. Copie o conteúdo do arquivo scripts/create-schema.sql
 * 4. Cole no editor e execute
 * 
 * Alternativamente, use a CLI do Supabase:
 * npx supabase db execute --file scripts/create-schema.sql
 */

import * as fs from 'fs'
import * as path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const sqlPath = path.join(__dirname, 'create-schema.sql')
const sqlContent = fs.readFileSync(sqlPath, 'utf-8')

console.log('╔════════════════════════════════════════════════╗')
console.log('║   Supabase - Criar Schema                      ║')
console.log('╚════════════════════════════════════════════════╝\n')

console.log('📄 SQL Schema carregado com sucesso!')
console.log(`   Arquivo: ${sqlPath}`)
console.log(`   Tamanho: ${sqlContent.length} caracteres\n`)

console.log('📋 INSTRUÇÕES PARA CRIAR O SCHEMA:\n')
console.log('Opção 1 - Dashboard do Supabase (Recomendado):')
console.log('   1. Acesse: https://supabase.com/dashboard/project/rzurauvqczgrpbblvcpj')
console.log('   2. Vá em: Database → Query Editor')
console.log('   3. Copie o conteúdo do arquivo: scripts/create-schema.sql')
console.log('   4. Cole no editor e clique em "Run"\n')

console.log('Opção 2 - Supabase CLI:')
console.log('   1. Instale a CLI: npm install -g supabase')
console.log('   2. Login: supabase login')
console.log('   3. Link: supabase link --project-ref rzurauvqczgrpbblvcpj')
console.log('   4. Execute: supabase db execute --file scripts/create-schema.sql\n')

console.log('Opção 3 - psql (Conexão direta):')
console.log('   1. Obtenha a senha do banco em: Database → Connection string')
console.log('   2. Execute:')
console.log('      psql "postgresql://postgres:[SUA-SENHA]@db.rzurauvqczgrpbblvcpj.supabase.co:5432/postgres" -f scripts/create-schema.sql\n')

console.log('='.repeat(50))
console.log('\n📄 Conteúdo do SQL pronto para copiar:\n')
console.log(sqlContent)
