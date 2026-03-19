import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== BUSCANDO USUÁRIO dabomba@gmail.com ===\n')
  
  const dabombaUser = await prisma.user.findUnique({
    where: { email: 'dabomba@gmail.com' },
    include: {
      gyms: {
        include: {
          gym: true
        }
      }
    }
  })
  
  if (dabombaUser) {
    console.log('✅ Usuário dabomba@gmail.com ENCONTRADO:')
    console.log('   Nome:', dabombaUser.name)
    console.log('   Role:', dabombaUser.role)
    console.log('   Academias vinculadas:')
    dabombaUser.gyms.forEach(ug => {
      console.log(`   - ${ug.gym.name} (${ug.gym.cnpj})`)
    })
  } else {
    console.log('❌ Usuário dabomba@gmail.com NÃO encontrado')
  }
  
  console.log('\n=== TODAS AS ACADEMIAS NO BANCO ===\n')
  const gyms = await prisma.gym.findMany({
    select: { id: true, name: true, cnpj: true, email: true, city: true, state: true }
  })
  
  gyms.forEach((gym, i) => {
    console.log(`${i + 1}. ${gym.name}`)
    console.log(`   CNPJ: ${gym.cnpj}`)
    console.log(`   Email: ${gym.email}`)
    console.log(`   Local: ${gym.city}/${gym.state}`)
    console.log()
  })
  
  console.log(`\nTotal: ${gyms.length} academias`)
  
  console.log('\n=== TODOS OS GESTORES (GYM_ADMIN) ===\n')
  const admins = await prisma.user.findMany({
    where: { role: 'GYM_ADMIN' },
    include: {
      gyms: {
        include: {
          gym: true
        }
      }
    }
  })
  
  admins.forEach(admin => {
    console.log(`👤 ${admin.name} - ${admin.email}`)
    admin.gyms.forEach(ug => {
      console.log(`   🏋️ ${ug.gym.name}`)
    })
    console.log()
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
