/**
 * Script para criar o banco de dados PostgreSQL
 * Usa conexão direta sem especificar banco
 */

const { Client } = require('pg');

async function createDatabase() {
  // Conecta ao servidor PostgreSQL (banco padrão 'postgres')
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '2002',
    database: 'postgres', // Conecta ao banco padrão para criar o novo
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL');

    // Verifica se o banco já existe
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'microsaas_gyms'"
    );

    if (result.rows.length > 0) {
      console.log('⚠️  Banco "microsaas_gyms" já existe!');
      return;
    }

    // Cria o banco de dados
    await client.query('CREATE DATABASE microsaas_gyms');
    console.log('✅ Banco "microsaas_gyms" criado com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar banco:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();
