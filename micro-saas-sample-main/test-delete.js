// Teste de exclusão de academia
async function testDelete() {
  const gymId = 'cmmxut5zh00026fstne3n0ap8'
  const password = 'admin123'
  
  try {
    console.log('Testando exclusão da academia:', gymId)
    
    const res = await fetch(`http://localhost:3000/api/superadmin/gyms/${gymId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    
    const data = await res.json()
    console.log('Status:', res.status)
    console.log('Resposta:', data)
  } catch (error) {
    console.error('Erro:', error)
  }
}

testDelete()
