/**
 * Script de migração dos dados do JSON para PostgreSQL
 * Migra todos os dados do db.json para o PostgreSQL
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Iniciando migração dos dados para PostgreSQL...\n')

  // Ler dados do db.json
  const dbJsonPath = path.join(process.cwd(), 'db.json')
  const dbJson = JSON.parse(fs.readFileSync(dbJsonPath, 'utf-8'))

  // Criar academia padrão (para os dados existentes)
  console.log('📦 Criando/Atualizando academia padrão...')
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
  console.log(`   ✅ Academia: ${defaultGym.name} (ID: ${defaultGym.id})\n`)

  // Migrar usuários
  console.log('👥 Migrando usuários...')
  const userMap = new Map<string, string>()
  let userCreated = 0
  let userUpdated = 0

  for (const userData of dbJson.users || []) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email || '' },
      })

      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: userData.name,
            email: userData.email,
            emailVerified: userData.emailVerified ? new Date(userData.emailVerified) : null,
            image: userData.image,
            stripeCustomerId: userData.stripeCustomerId,
            stripeSubscriptionId: userData.stripeSubscriptionId,
            stripeSubscriptionStatus: userData.stripeSubscriptionStatus,
            stripePriceId: userData.stripePriceId,
            role: userData.email === process.env.NEXT_PUBLIC_USER_EMAIL ? 'GYM_ADMIN' : 'USER',
          },
        })
        userMap.set(userData.id, existingUser.id)
        userUpdated++
      } else {
        const newUser = await prisma.user.create({
          data: {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            emailVerified: userData.emailVerified ? new Date(userData.emailVerified) : null,
            image: userData.image,
            stripeCustomerId: userData.stripeCustomerId,
            stripeSubscriptionId: userData.stripeSubscriptionId,
            stripeSubscriptionStatus: userData.stripeSubscriptionStatus,
            stripePriceId: userData.stripePriceId,
            role: userData.email === process.env.NEXT_PUBLIC_USER_EMAIL ? 'GYM_ADMIN' : 'USER',
          },
        })
        userMap.set(userData.id, newUser.id)
        userCreated++
      }

      // Criar vínculo com a academia
      await prisma.userGym.upsert({
        where: {
          userId_gymId: {
            userId: userMap.get(userData.id)!,
            gymId: defaultGym.id,
          },
        },
        update: {
          role: userData.email === process.env.NEXT_PUBLIC_USER_EMAIL ? 'GYM_ADMIN' : 'USER',
          status: 'ACTIVE',
        },
        create: {
          userId: userMap.get(userData.id)!,
          gymId: defaultGym.id,
          role: userData.email === process.env.NEXT_PUBLIC_USER_EMAIL ? 'GYM_ADMIN' : 'USER',
          status: 'ACTIVE',
        },
      })
    } catch (error: any) {
      console.error(`   ❌ Erro ao migrar usuário ${userData.email}:`, error.message)
    }
  }
  console.log(`   ✅ ${userCreated} criados, ${userUpdated} atualizados (${userMap.size} total)\n`)

  // Migrar membros (sem trainerId inicialmente para evitar FK issues)
  console.log('🏋️ Migrando membros...')
  const memberMap = new Map<string, string>()
  let memberCreated = 0
  let memberSkipped = 0

  const validUserIds = new Set(userMap.keys())

  for (const memberData of dbJson.members || []) {
    try {
      if (!validUserIds.has(memberData.userId)) {
        memberSkipped++
        continue
      }

      const newMember = await prisma.member.upsert({
        where: { id: memberData.id },
        update: {
          gymId: defaultGym.id,
          userId: userMap.get(memberData.userId)!,
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
          userId: userMap.get(memberData.userId)!,
          gymId: defaultGym.id,
          trainerId: null, // Será atualizado depois
        },
      })
      memberMap.set(memberData.id, newMember.id)
      memberCreated++
    } catch (error: any) {
      console.error(`   ❌ Erro ao migrar membro ${memberData.name}:`, error.message)
    }
  }
  console.log(`   ✅ ${memberCreated} membros migrados (${memberSkipped} pulados)\n`)

  // Migrar treinadores
  console.log('🎯 Migrando treinadores...')
  const trainerMap = new Map<string, string>()
  let trainerCreated = 0

  for (const trainerData of dbJson.trainers || []) {
    try {
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
      trainerCreated++
    } catch (error: any) {
      console.error(`   ❌ Erro ao migrar treinador ${trainerData.name}:`, error.message)
    }
  }
  console.log(`   ✅ ${trainerCreated} treinadores migrados\n`)

  // Atualizar trainerId dos membros agora que os treinadores existem
  console.log('🔗 Vinculando membros aos treinadores...')
  let membersLinked = 0
  for (const memberData of dbJson.members || []) {
    if (memberData.trainerId && trainerMap.has(memberData.trainerId) && memberMap.has(memberData.id)) {
      try {
        await prisma.member.update({
          where: { id: memberMap.get(memberData.id)! },
          data: { trainerId: trainerMap.get(memberData.trainerId)! },
        })
        membersLinked++
      } catch (error: any) {
        // Ignora erros de FK
      }
    }
  }
  console.log(`   ✅ ${membersLinked} membros vinculados a treinadores\n`)

  // Migrar workouts
  console.log('💪 Migrando workouts...')
  const workoutMap = new Map<string, string>()
  let workoutCreated = 0

  for (const workoutData of dbJson.workouts || []) {
    try {
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
          trainerId: workoutData.trainerId && trainerMap.has(workoutData.trainerId)
            ? trainerMap.get(workoutData.trainerId)!
            : null,
        },
      })
      workoutMap.set(workoutData.id, newWorkout.id)
      workoutCreated++
    } catch (error: any) {
      console.error(`   ❌ Erro ao migrar workout ${workoutData.name}:`, error.message)
    }
  }
  console.log(`   ✅ ${workoutCreated} workouts migrados\n`)

  // Migrar expenses
  console.log('💰 Migrando expenses...')
  const expenseMap = new Map<string, string>()
  let expenseCreated = 0

  for (const expenseData of dbJson.expenses || []) {
    try {
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
      expenseCreated++
    } catch (error: any) {
      console.error(`   ❌ Erro ao migrar expense ${expenseData.title}:`, error.message)
    }
  }
  console.log(`   ✅ ${expenseCreated} expenses migrados\n`)

  // Migrar todos
  console.log('📝 Migrando todos...')
  const todoMap = new Map<string, string>()
  let todoCreated = 0

  for (const todoData of dbJson.todos || []) {
    try {
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
      todoCreated++
    } catch (error: any) {
      console.error(`   ❌ Erro ao migrar todo ${todoData.title}:`, error.message)
    }
  }
  console.log(`   ✅ ${todoCreated} todos migrados\n`)

  // Migrar attendance
  console.log('📅 Migrando attendance...')
  const attendanceMap = new Map<string, string>()
  let attendanceCreated = 0

  for (const attendanceData of dbJson.attendance || []) {
    try {
      const member = await prisma.member.findFirst({
        where: {
          email: attendanceData.memberEmail,
          userId: attendanceData.userId,
        },
      })

      if (!member) {
        continue
      }

      const newAttendance = await prisma.attendance.upsert({
        where: { id: attendanceData.id },
        update: {},
        create: {
          id: attendanceData.id,
          date: attendanceData.date,
          memberId: member.id,
          memberEmail: attendanceData.memberEmail,
          checkIn: attendanceData.checkIn,
          checkOut: attendanceData.checkOut,
          status: attendanceData.status,
          userId: attendanceData.userId,
        },
      })
      attendanceMap.set(attendanceData.id, newAttendance.id)
      attendanceCreated++
    } catch (error: any) {
      console.error(`   ❌ Erro ao migrar attendance ${attendanceData.memberEmail}:`, error.message)
    }
  }
  console.log(`   ✅ ${attendanceCreated} attendance migrados\n`)

  console.log('🎉 Migração concluída com sucesso!')
  console.log('📊 Resumo:')
  console.log(`   - 1 academia`)
  console.log(`   - ${userMap.size} usuários (${userCreated} novos, ${userUpdated} atualizados)`)
  console.log(`   - ${memberMap.size} membros`)
  console.log(`   - ${trainerMap.size} treinadores`)
  console.log(`   - ${workoutMap.size} workouts`)
  console.log(`   - ${expenseMap.size} expenses`)
  console.log(`   - ${todoMap.size} todos`)
  console.log(`   - ${attendanceMap.size} attendance`)
  console.log(`\n💡 Dados disponíveis no PostgreSQL!`)
}

main()
  .catch((e) => {
    console.error('❌ Erro na migração:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
