/**
 * Script de migração dos dados do SQLite para PostgreSQL
 * Cria uma academia padrão e migra todos os dados existentes
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Iniciando migração dos dados para PostgreSQL...')

  // Ler dados do db.json
  const dbJsonPath = path.join(process.cwd(), 'db.json')
  const dbJson = JSON.parse(fs.readFileSync(dbJsonPath, 'utf-8'))

  // Criar academia padrão (para os dados existentes)
  console.log('📦 Criando academia padrão...')
  const defaultGym = await prisma.gym.upsert({
    where: { cnpj: '00.000.000/0001-00' },
    update: {},
    create: {
      name: 'Academia Padrão',
      cnpj: '00.000.000/0001-00',
      email: 'contato@academiapadrao.com.br',
      phone: '(11) 99999-9999',
      address: 'Rua Principal, 1000',
      city: 'São Paulo',
      state: 'SP',
      isActive: true,
      plan: 'premium',
    },
  })
  console.log(`✅ Academia criada: ${defaultGym.name} (ID: ${defaultGym.id})`)

  // Migrar usuários
  console.log('👥 Migrando usuários...')
  const userMap = new Map<string, string>()
  
  for (const userData of dbJson.users || []) {
    const newUser = await prisma.user.upsert({
      where: { id: userData.id },
      update: {
        gymId: defaultGym.id,
        role: userData.email === process.env.NEXT_PUBLIC_USER_EMAIL ? 'admin' : 'user',
      },
      create: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        emailVerified: userData.emailVerified ? new Date(userData.emailVerified) : null,
        image: userData.image,
        stripeCustomerId: userData.stripeCustomerId,
        stripeSubscriptionId: userData.stripeSubscriptionId,
        stripeSubscriptionStatus: userData.stripeSubscriptionStatus,
        stripePriceId: userData.stripePriceId,
        gymId: defaultGym.id,
        role: userData.email === process.env.NEXT_PUBLIC_USER_EMAIL ? 'admin' : 'user',
      },
    })
    userMap.set(userData.id, newUser.id)
  }
  console.log(`✅ ${userMap.size} usuários migrados`)

  // Migrar treinadores (antes dos members por causa da FK)
  console.log('🎯 Migrando treinadores...')
  const trainerMap = new Map<string, string>()
  
  for (const trainerData of dbJson.trainers || []) {
    // Converter certifications de array para string se necessário
    const certifications = Array.isArray(trainerData.certifications) 
      ? trainerData.certifications.join(', ') 
      : (trainerData.certifications || '')
    
    const newTrainer = await prisma.trainer.upsert({
      where: { id: trainerData.id },
      update: {
        gymId: defaultGym.id,
      },
      create: {
        id: trainerData.id,
        name: trainerData.name,
        email: trainerData.email || `trainer${trainerData.id}@academia.com`,
        phone: trainerData.phone,
        specialty: trainerData.specialty,
        status: trainerData.status,
        certifications: certifications,
        userId: trainerData.userId,
        gymId: defaultGym.id,
      },
    })
    trainerMap.set(trainerData.id, newTrainer.id)
  }
  console.log(`✅ ${trainerMap.size} treinadores migrados`)

  // Migrar membros
  console.log('🏋️ Migrando membros...')
  const memberMap = new Map<string, string>()
  
  // Obter IDs válidos de usuários e treinadores
  const validUserIds = new Set(userMap.keys())
  const validTrainerIds = new Set(trainerMap.keys())
  
  let skippedCount = 0
  
  for (const memberData of dbJson.members || []) {
    // Verificar se userId existe
    if (!validUserIds.has(memberData.userId)) {
      console.log(`⚠️  Member ${memberData.name} pulado: userId ${memberData.userId} não existe`)
      skippedCount++
      continue
    }
    
    // Verificar se trainerId existe (se houver)
    let trainerId = null
    if (memberData.trainerId) {
      if (validTrainerIds.has(memberData.trainerId)) {
        trainerId = memberData.trainerId
      } else {
        console.log(`⚠️  Member ${memberData.name}: trainerId ${memberData.trainerId} não existe, usando null`)
      }
    }
    
    const newMember = await prisma.member.upsert({
      where: { id: memberData.id },
      update: {
        gymId: defaultGym.id,
      },
      create: {
        id: memberData.id,
        name: memberData.name,
        email: memberData.email,
        phone: memberData.phone,
        plan: memberData.plan,
        status: memberData.status,
        lastVisit: memberData.lastVisit,
        planRenewalDate: memberData.planRenewalDate,
        paymentDate: memberData.paymentDate,
        userId: memberData.userId,
        gymId: defaultGym.id,
        trainerId: trainerId,
      },
    })
    memberMap.set(memberData.id, newMember.id)
  }
  console.log(`✅ ${memberMap.size} membros migrados (${skippedCount} pulados)`)

  // Migrar workouts
  console.log('💪 Migrando workouts...')
  const workoutMap = new Map<string, string>()
  
  for (const workoutData of dbJson.workouts || []) {
    const newWorkout = await prisma.workout.upsert({
      where: { id: workoutData.id },
      update: {
        gymId: defaultGym.id,
      },
      create: {
        id: workoutData.id,
        name: workoutData.name,
        type: workoutData.type,
        duration: workoutData.duration,
        level: workoutData.level,
        description: workoutData.description,
        userId: workoutData.userId,
        gymId: defaultGym.id,
        trainerId: workoutData.trainerId || null,
      },
    })
    workoutMap.set(workoutData.id, newWorkout.id)
  }
  console.log(`✅ ${workoutMap.size} workouts migrados`)

  // Migrar workout_members
  console.log('📋 Migrando workout_members...')
  let workoutMembersCount = 0
  
  for (const workoutMemberData of dbJson.workout_members || []) {
    await prisma.workoutMember.upsert({
      where: {
        workoutId_memberId: {
          workoutId: workoutMemberData.workoutId,
          memberId: workoutMemberData.memberId,
        },
      },
      update: {},
      create: {
        id: workoutMemberData.id,
        workoutId: workoutMemberData.workoutId,
        memberId: workoutMemberData.memberId,
        assignedAt: workoutMemberData.assignedAt ? new Date(workoutMemberData.assignedAt) : new Date(),
      },
    })
    workoutMembersCount++
  }
  console.log(`✅ ${workoutMembersCount} workout_members migrados`)

  // Migrar expenses
  console.log('💰 Migrando expenses...')
  const expenseMap = new Map<string, string>()
  
  for (const expenseData of dbJson.expenses || []) {
    const newExpense = await prisma.expense.upsert({
      where: { id: expenseData.id },
      update: {
        gymId: defaultGym.id,
      },
      create: {
        id: expenseData.id,
        title: expenseData.title,
        description: expenseData.description,
        amount: expenseData.amount,
        category: expenseData.category,
        date: expenseData.date ? new Date(expenseData.date) : new Date(),
        userId: expenseData.userId,
        gymId: defaultGym.id,
      },
    })
    expenseMap.set(expenseData.id, newExpense.id)
  }
  console.log(`✅ ${expenseMap.size} expenses migrados`)

  // Migrar todos
  console.log('✅ Migrando todos...')
  const todoMap = new Map<string, string>()
  
  for (const todoData of dbJson.todos || []) {
    const newTodo = await prisma.todo.upsert({
      where: { id: todoData.id },
      update: {
        gymId: defaultGym.id,
      },
      create: {
        id: todoData.id,
        title: todoData.title,
        userId: todoData.userId,
        gymId: defaultGym.id,
        createdAt: todoData.createdAt ? new Date(todoData.createdAt) : new Date(),
        updatedAt: todoData.updatedAt ? new Date(todoData.updatedAt) : new Date(),
        doneAt: todoData.doneAt ? new Date(todoData.doneAt) : null,
      },
    })
    todoMap.set(todoData.id, newTodo.id)
  }
  console.log(`✅ ${todoMap.size} todos migrados`)

  console.log('\n🎉 Migração concluída com sucesso!')
  console.log(`📊 Resumo:`)
  console.log(`   - 1 academia criada`)
  console.log(`   - ${userMap.size} usuários`)
  console.log(`   - ${memberMap.size} membros`)
  console.log(`   - ${trainerMap.size} treinadores`)
  console.log(`   - ${workoutMap.size} workouts`)
  console.log(`   - ${workoutMembersCount} workout_members`)
  console.log(`   - ${expenseMap.size} expenses`)
  console.log(`   - ${todoMap.size} todos`)
  console.log(`\n💡 Agora você pode visualizar os dados no PGAdmin!`)
  console.log(`   Conecte-se em: localhost:5432`)
  console.log(`   Banco: microsaas_gyms`)
  console.log(`   Usuário: postgres`)
  console.log(`   Senha: 2002`)
}

main()
  .catch((e) => {
    console.error('❌ Erro na migração:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
