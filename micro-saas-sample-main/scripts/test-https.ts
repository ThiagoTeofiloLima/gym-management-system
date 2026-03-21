/**
 * Script para testar conexão com Supabase - Versão robusta
 */

import * as https from 'https'

const SUPABASE_URL = 'https://rzurauvqczgrpbblvcpj.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6dXJhdXZxY3pncnBiYmx2Y3BqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mjg1NzQ1OSwiZXhwIjoyMDU4NDMzNDU5fQ.4Z1Hj6qVZLH6v3zKqT8K5qJZvL6qH8vN9xR2yF3mK4w'

console.log('🔍 Testando conexão com Supabase via HTTPS...')
console.log('URL:', SUPABASE_URL)
console.log('Key (primeiros 30 chars):', SUPABASE_SERVICE_ROLE_KEY.substring(0, 30) + '...')

function makeRequest(): Promise<void> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'rzurauvqczgrpbblvcpj.supabase.co',
      port: 443,
      path: '/rest/v1/gyms?select=*&limit=1',
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'count=exact'
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        console.log('\n📡 Resposta:')
        console.log('Status:', res.statusCode)
        console.log('Headers:', JSON.stringify(res.headers, null, 2))
        console.log('Body:', data.substring(0, 500))
        
        if (res.statusCode === 200) {
          console.log('\n✅ Conexão bem-sucedida!')
          resolve()
        } else {
          console.log('\n❌ Erro na conexão. Status:', res.statusCode)
          reject(new Error(`Status ${res.statusCode}`))
        }
      })
    })

    req.on('error', (error) => {
      console.error('❌ Erro na requisição:', error.message)
      reject(error)
    })

    req.end()
  })
}

makeRequest().catch(console.error)
