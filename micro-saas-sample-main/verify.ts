import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Verifying Data ---')
  const gymCount = await prisma.gym.count()
  const userCount = await prisma.user.count()
  const memberCount = await prisma.member.count()
  const trainerCount = await prisma.trainer.count()
  
  console.log(`Gyms: ${gymCount}`)
  console.log(`Users: ${userCount}`)
  console.log(`Members: ${memberCount}`)
  console.log(`Trainers: ${trainerCount}`)
  
  const defaultGym = await prisma.gym.findFirst()
  if (defaultGym) {
    console.log(`Default Gym: ${defaultGym.name}`)
  } else {
    console.log('No gym found!')
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
