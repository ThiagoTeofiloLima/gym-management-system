/**
 * Script para gerar dados de frequência realistas
 * Gera registros de attendance para os membros existentes
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Gerador de números aleatórios
function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Gerador de horário de entrada (entre 06:00 e 22:00)
function generateCheckIn() {
  const hour = randomInt(6, 21)
  const minute = randomInt(0, 59)
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

// Gerador de horário de saída (1-3 horas após entrada)
function generateCheckOut(checkIn: string) {
  const [inHour, inMinute] = checkIn.split(':').map(Number)
  const duration = randomInt(1, 3)
  let outHour = inHour + duration
  if (outHour > 23) outHour = 23
  const outMinute = randomInt(0, 59)
  return `${String(outHour).padStart(2, '0')}:${String(outMinute).padStart(2, '0')}`
}

// Gerador de data aleatória nos últimos 90 dias
function generateDate(daysAgo: number) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().split('T')[0]
}

async function main() {
  console.log('🏋️ Gerando dados de frequência realistas...\n')

  // Buscar todos os membros ativos
  const members = await prisma.member.findMany({
    where: {
      status: 'Ativo',
    },
    select: {
      id: true,
      name: true,
      email: true,
      userId: true,
      gymId: true,
    },
  })

  console.log(`📊 Encontrados ${members.length} membros ativos\n`)

  let totalRecords = 0
  let membersWithAttendance = 0

  for (const member of members) {
    // Cada membro frequenta entre 1 e 5 vezes por semana em média
    const attendanceFrequency = randomInt(1, 5)
    const weeksToGenerate = 12 // 12 semanas = ~3 meses
    const totalAttendances = attendanceFrequency * weeksToGenerate

    console.log(`📅 Gerando ${totalAttendances} registros para ${member.name}...`)

    // Gerar datas de frequência
    const attendanceDates: number[] = []
    for (let i = 0; i < totalAttendances; i++) {
      const daysAgo = randomInt(0, 84) // Últimos 84 dias (12 semanas)
      if (!attendanceDates.includes(daysAgo)) {
        attendanceDates.push(daysAgo)
      }
    }

    // Criar registros de attendance
    for (const daysAgo of attendanceDates) {
      const date = generateDate(daysAgo)
      const checkIn = generateCheckIn()
      const checkOut = generateCheckOut(checkIn)

      try {
        await prisma.attendance.create({
          data: {
            date,
            memberId: member.id,
            memberEmail: member.email,
            checkIn,
            checkOut,
            status: 'Presente',
            userId: member.userId,
          },
        })
        totalRecords++
      } catch (error: any) {
        // Ignora duplicatas
        if (!error.code || error.code !== 'P2002') {
          console.error(`   ❌ Erro: ${error.message}`)
        }
      }
    }

    // Atualizar última visita do membro
    if (attendanceDates.length > 0) {
      const lastVisit = generateDate(Math.min(...attendanceDates))
      await prisma.member.update({
        where: { id: member.id },
        data: { lastVisit },
      })
      membersWithAttendance++
    }
  }

  console.log('\n✅ Dados gerados com sucesso!')
  console.log(`📊 Resumo:`)
  console.log(`   - ${members.length} membros encontrados`)
  console.log(`   - ${membersWithAttendance} membros com frequência registrada`)
  console.log(`   - ${totalRecords} registros de frequência criados`)
  console.log(`\n💡 Dados disponíveis no PostgreSQL!`)
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
