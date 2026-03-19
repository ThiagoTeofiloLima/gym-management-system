import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== VERIFICANDO VÍNCULOS DE USUÁRIOS ===\n')
  
  // Buscar todos os usuários com seus vínculos
  const users = await prisma.user.findMany({
    include: {
      gyms: {
        include: {
          gym: true
        }
      }
    }
  })
  
  users.forEach(user => {
    console.log(`\n👤 ${user.name} (${user.email})`)
    console.log(`   Role: ${user.role}`)
    console.log(`   ID: ${user.id}`)
    
    if (user.gyms.length > 0) {
      console.log(`   Academias vinculadas (${user.gyms.length}):`)
      user.gyms.forEach(ug => {
        console.log(`   - ${ug.gym.name} (${ug.gym.id})`)
        console.log(`     Role: ${ug.role}, Status: ${ug.status}`)
      })
    } else {
      console.log(`   ❌ Sem academias vinculadas`)
    }
  })
  
  console.log('\n\n=== RESUMO ===')
  console.log(`Total de usuários: ${users.length}`)
  console.log(`Super Admins: ${users.filter(u => u.role === 'SUPER_ADMIN').length}`)
  console.log(`Gym Admins: ${users.filter(u => u.role === 'GYM_ADMIN').length}`)
  console.log(`Users: ${users.filter(u => u.role === 'USER').length}`)
  console.log(`Usuários com academias: ${users.filter(u => u.gyms.length > 0).length}`)
  console.log(`Usuários SEM academias: ${users.filter(u => u.gyms.length === 0).length}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
