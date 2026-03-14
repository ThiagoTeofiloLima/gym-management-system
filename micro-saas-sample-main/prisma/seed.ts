/**
 * Script de Seed - Dados iniciais para o Micro-SaaS de Academias
 * 
 * Cria dados REALISTAS e DIFERENCIADOS para cada academia:
 * - 10 Academias com perfis diferentes
 * - Membros, treinadores, workouts e despesas únicos por academia
 */

import { PrismaClient, UserRole } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// Dados do Super Admin
const SUPER_ADMIN_EMAIL = 'thiago.lima.amazoniatelecom@gmail.com'
const SUPER_ADMIN_PASSWORD = 'admin123'

// Dados do Gerente (para testes)
const GYM_ADMIN_EMAIL = 'thiagolima112358@gmail.com'
const GYM_ADMIN_PASSWORD = 'admin123'

// Dados realistas de academias com perfis diferentes
const gymsData = [
  {
    name: 'Iron Gym - Centro',
    cnpj: '12.345.678/0001-00',
    email: 'contato@irongym.com.br',
    phone: '(11) 3456-7890',
    address: 'Rua das Academias, 100 - Centro',
    city: 'São Paulo',
    state: 'SP',
    plan: 'enterprise',
    maxMembers: 500,
    maxUsers: 20,
    manager: { name: 'Carlos Silva', email: 'carlos@irongym.com.br', phone: '(11) 99999-1111' },
    description: 'Academia de musculação tradicional, foco em bodybuilding',
    membersCount: 487,
    trainersCount: 12,
    workoutsCount: 35,
    expensesCount: 18,
  },
  {
    name: 'FitLife Academia',
    cnpj: '23.456.789/0001-11',
    email: 'contato@fitlife.com.br',
    phone: '(21) 2345-6789',
    address: 'Av. Paulista, 500 - Bela Vista',
    city: 'Rio de Janeiro',
    state: 'RJ',
    plan: 'pro',
    maxMembers: 200,
    maxUsers: 10,
    manager: { name: 'Ana Santos', email: 'ana@fitlife.com.br', phone: '(21) 98888-2222' },
    description: 'Academia familiar com foco em saúde e bem-estar',
    membersCount: 178,
    trainersCount: 8,
    workoutsCount: 22,
    expensesCount: 12,
  },
  {
    name: 'BodyTech Studio',
    cnpj: '34.567.890/0001-22',
    email: 'contato@bodytech.com.br',
    phone: '(31) 3210-9876',
    address: 'Rua da Bahia, 300 - Centro',
    city: 'Belo Horizonte',
    state: 'MG',
    plan: 'basic',
    maxMembers: 100,
    maxUsers: 5,
    manager: { name: 'Roberto Costa', email: 'roberto@bodytech.com.br', phone: '(31) 97777-3333' },
    description: 'Studio boutique com atendimento personalizado',
    membersCount: 87,
    trainersCount: 5,
    workoutsCount: 15,
    expensesCount: 8,
  },
  {
    name: 'Smart Fit Plaza',
    cnpj: '45.678.901/0001-33',
    email: 'contato@smartfitplaza.com.br',
    phone: '(11) 2345-6789',
    address: 'Av. Brigadeiro Faria Lima, 1500',
    city: 'São Paulo',
    state: 'SP',
    plan: 'enterprise',
    maxMembers: 800,
    maxUsers: 25,
    manager: { name: 'Patricia Oliveira', email: 'patricia@smartfitplaza.com.br', phone: '(11) 98888-4444' },
    description: 'Academia de rede, grande porte, 24 horas',
    membersCount: 756,
    trainersCount: 18,
    workoutsCount: 45,
    expensesCount: 25,
  },
  {
    name: 'Blue Fit Academia',
    cnpj: '56.789.012/0001-44',
    email: 'contato@bluefit.com.br',
    phone: '(41) 3456-7890',
    address: 'Rua XV de Novembro, 800',
    city: 'Curitiba',
    state: 'PR',
    plan: 'pro',
    maxMembers: 300,
    maxUsers: 12,
    manager: { name: 'Marcos Pereira', email: 'marcos@bluefit.com.br', phone: '(41) 97777-5555' },
    description: 'Academia moderna com foco em tecnologia',
    membersCount: 267,
    trainersCount: 10,
    workoutsCount: 28,
    expensesCount: 14,
  },
  {
    name: 'Power House Gym',
    cnpj: '67.890.123/0001-55',
    email: 'contato@powerhousegym.com.br',
    phone: '(51) 2345-6789',
    address: 'Av. Ipiranga, 1200',
    city: 'Porto Alegre',
    state: 'RS',
    plan: 'basic',
    maxMembers: 150,
    maxUsers: 8,
    manager: { name: 'Fernanda Lima', email: 'fernanda@powerhousegym.com.br', phone: '(51) 96666-6666' },
    description: 'Academia de bairro, ambiente familiar',
    membersCount: 134,
    trainersCount: 6,
    workoutsCount: 18,
    expensesCount: 9,
  },
  {
    name: 'CrossFit Box',
    cnpj: '78.901.234/0001-66',
    email: 'contato@crossfitbox.com.br',
    phone: '(71) 3456-7890',
    address: 'Rua Chile, 50 - Pelourinho',
    city: 'Salvador',
    state: 'BA',
    plan: 'pro',
    maxMembers: 200,
    maxUsers: 10,
    manager: { name: 'Ricardo Souza', email: 'ricardo@crossfitbox.com.br', phone: '(71) 95555-7777' },
    description: 'Box de CrossFit com treinos intensivos',
    membersCount: 189,
    trainersCount: 9,
    workoutsCount: 32,
    expensesCount: 13,
  },
  {
    name: 'Yoga & Zen Studio',
    cnpj: '89.012.345/0001-77',
    email: 'contato@yogazen.com.br',
    phone: '(85) 2345-6789',
    address: 'Av. Beira Mar, 3000',
    city: 'Fortaleza',
    state: 'CE',
    plan: 'basic',
    maxMembers: 80,
    maxUsers: 5,
    manager: { name: 'Juliana Martins', email: 'juliana@yogazen.com.br', phone: '(85) 94444-8888' },
    description: 'Studio de yoga e meditação à beira mar',
    membersCount: 72,
    trainersCount: 4,
    workoutsCount: 20,
    expensesCount: 7,
  },
  {
    name: 'Titan Gym',
    cnpj: '90.123.456/0001-88',
    email: 'contato@titangym.com.br',
    phone: '(61) 3456-7890',
    address: 'SCS Quadra 2, Bloco C',
    city: 'Brasília',
    state: 'DF',
    plan: 'enterprise',
    maxMembers: 600,
    maxUsers: 20,
    manager: { name: 'Alexandre Pires', email: 'alexandre@titangym.com.br', phone: '(61) 93333-9999' },
    description: 'Academia de alto padrão no centro de Brasília',
    membersCount: 542,
    trainersCount: 15,
    workoutsCount: 40,
    expensesCount: 20,
  },
  {
    name: 'Fit & Health Club',
    cnpj: '01.234.567/0001-99',
    email: 'contato@fithealthclub.com.br',
    phone: '(81) 2345-6789',
    address: 'Av. Boa Viagem, 5000',
    city: 'Recife',
    state: 'PE',
    plan: 'pro',
    maxMembers: 250,
    maxUsers: 12,
    manager: { name: 'Camila Rodrigues', email: 'camila@fithealthclub.com.br', phone: '(81) 92222-0000' },
    description: 'Clube fitness com piscina e spa',
    membersCount: 231,
    trainersCount: 11,
    workoutsCount: 30,
    expensesCount: 16,
  },
]

// Nomes brasileiros comuns para membros (varia por região)
const namesByRegion = {
  'SP': ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Souza', 'Lucas Rodrigues', 'Julia Ferreira', 'Gabriel Alves', 'Mariana Pereira', 'Rafael Lima', 'Fernanda Gomes', 'Bruno Costa', 'Patricia Ribeiro', 'Rodrigo Martins', 'Camila Carvalho', 'Felipe Almeida'],
  'RJ': ['Carlos Eduardo', 'Fernanda Rio', 'Bruno Carioca', 'Juliana Flamengo', 'Ricardo Botafogo', 'Patricia Vasco', 'Marcos Fluminense', 'Camila Bangu', 'Felipe Tijuca', 'Amanda Copacabana', 'Gabriel Ipanema', 'Beatriz Leblon', 'Thiago Barra', 'Larissa Gávea', 'Gustavo Lapa'],
  'MG': ['João Mineiro', 'Maria Belo', 'Pedro Horizonte', 'Ana Gerais', 'Lucas Pão', 'Julia Queijo', 'Gabriel Doce', 'Mariana Trem', 'Rafael Inconfidência', 'Fernanda Tiradentes', 'Bruno Liberdade', 'Patricia Independência', 'Rodrigo Minas', 'Camila Ouro', 'Felipe Diamantina'],
  'PR': ['João Pinhão', 'Maria Araucária', 'Pedro Iguaçu', 'Ana Curitiba', 'Lucas Cataratas', 'Julia Foz', 'Gabriel Londrina', 'Mariana Maringá', 'Rafael Ponta', 'Fernanda Guarapuava', 'Bruno Cascavel', 'Patricia Umuarama', 'Rodrivo Apucarana', 'Camila Toledo', 'Felipe Paranaguá'],
  'RS': ['João Gaúcho', 'Maria Pampa', 'Pedro Chimarrão', 'Ana Porto', 'Lucas Guaíba', 'Julia Serra', 'Gabriel Campana', 'Mariana Farroupilha', 'Rafael Revolução', 'Fernanda Liberdade', 'Bruno Independência', 'Patricia República', 'Rodrigo Federação', 'Camila Autonomia', 'Felipe Soberania'],
  'BA': ['João Baiano', 'Maria Salvador', 'Pedro Pelourinho', 'Ana Bahia', 'Lucas Acarajé', 'Julia Abaré', 'Gabriel Oxum', 'Mariana Iansã', 'Rafael Ogum', 'Fernanda Yemanjá', 'Bruno Oxalá', 'Patricia Xangô', 'Rodrigo Exu', 'Camila Cosme', 'Felipe Damião'],
  'CE': ['João Cearense', 'Maria Jangada', 'Pedro Praia', 'Ana Fortaleza', 'Lucas Sol', 'Julia Mar', 'Gabriel Iracema', 'Mariana Iracema', 'Rafael Mucuripe', 'Fernanda Beira', 'Bruno Meireles', 'Patricia Aldeota', 'Rodrigo Dionísio', 'Camila Tirol', 'Felipe Papicu'],
  'DF': ['João Candango', 'Maria Brasília', 'Pedro Plano', 'Ana Asa', 'Lucas Sul', 'Julia Norte', 'Gabriel Lago', 'Mariana Ponte', 'Rafael JK', 'Fernanda Palácio', 'Bruno Congresso', 'Patricia Supremo', 'Rodrigo Esplanada', 'Camila Ministérios', 'Felipe Setor'],
  'PE': ['João Pernambucano', 'Maria Recife', 'Pedro Boa', 'Ana Viagem', 'Lucas Marco', 'Julia Zero', 'Gabriel Ricardo', 'Mariana Paiva', 'Rafael Derby', 'Fernanda Madalena', 'Bruno Apipucos', 'Patricia Casa', 'Rodrigo Forte', 'Camila Torre', 'Felipe Prado'],
}

// Planos de membros (varia por tipo de academia)
const memberPlans = {
  'enterprise': ['mensal', 'trimestral', 'anual', 'semestral', 'vitalício'],
  'pro': ['mensal', 'trimestral', 'anual'],
  'basic': ['mensal', 'trimestral'],
}

// Status de membros (proporção realista)
const memberStatus = ['Ativo', 'Ativo', 'Ativo', 'Ativo', 'Inativo', 'Pendente']

// Treinadores com especialidades por tipo de academia
const trainerSpecialtiesByType = {
  'musculacao': ['Musculação', 'Hipertrofia', 'Força', 'Resistência', 'Emagrecimento'],
  'crossfit': ['CrossFit', 'Funcional', 'HIIT', 'Olympic Lifting', 'Ginástica'],
  'yoga': ['Yoga', 'Pilates', 'Meditação', 'Alongamento', 'Respiração'],
  'geral': ['Musculação', 'Funcional', 'Spinning', 'Zumba', 'Natação'],
}

// Despesas típicas de academia
const expensesByCategory = {
  'Infraestrutura': [
    { title: 'Aluguel do Imóvel', avgAmount: 15000 },
    { title: 'Condomínio', avgAmount: 3500 },
    { title: 'IPTU', avgAmount: 2800 },
    { title: 'Seguro Predial', avgAmount: 1200 },
  ],
  'Contas': [
    { title: 'Energia Elétrica', avgAmount: 4500 },
    { title: 'Água e Esgoto', avgAmount: 1800 },
    { title: 'Internet Fibra', avgAmount: 450 },
    { title: 'Telefone/Cellular', avgAmount: 350 },
  ],
  'Equipamentos': [
    { title: 'Manutenção de Equipamentos', avgAmount: 2500 },
    { title: 'Compra de Pesos', avgAmount: 8000 },
    { title: 'Reparos Gerais', avgAmount: 1500 },
    { title: 'Substituição de Colchonetes', avgAmount: 800 },
  ],
  'Pessoal': [
    { title: 'Salário Instrutores', avgAmount: 12000 },
    { title: 'Salário Recepcionistas', avgAmount: 5000 },
    { title: 'Encargos Trabalhistas', avgAmount: 8000 },
    { title: 'Vale Transporte', avgAmount: 2000 },
  ],
  'Marketing': [
    { title: 'Google Ads', avgAmount: 2000 },
    { title: 'Instagram/Facebook', avgAmount: 1500 },
    { title: 'Panfletos', avgAmount: 800 },
    { title: 'Site/Hospedagem', avgAmount: 350 },
  ],
  'Limpeza': [
    { title: 'Produtos de Limpeza', avgAmount: 1200 },
    { title: 'Serviço de Limpeza', avgAmount: 2500 },
    { title: 'Higienização de Equipamentos', avgAmount: 600 },
  ],
  'Suplementos': [
    { title: 'Whey Protein (Revenda)', avgAmount: 5000 },
    { title: 'Creatina', avgAmount: 2000 },
    { title: 'Pré-Treino', avgAmount: 1500 },
  ],
}

// Gerador de membros realistas
function generateMembers(count: number, city: string, state: string, plan: string) {
  const members = []
  const names = namesByRegion[state as keyof typeof namesByRegion] || namesByRegion.SP
  const plans = memberPlans[plan as keyof typeof memberPlans] || memberPlans.basic
  
  const firstNames = ['João', 'Maria', 'Pedro', 'Ana', 'Lucas', 'Julia', 'Gabriel', 'Mariana', 'Rafael', 'Fernanda', 'Bruno', 'Patricia', 'Rodrigo', 'Camila', 'Felipe', 'Amanda', 'Gustavo', 'Beatriz', 'Henrique', 'Larissa']
  const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida']
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const name = `${firstName} ${lastName}`
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`
    
    const dddMap: Record<string, string> = {
      'SP': '11', 'RJ': '21', 'MG': '31', 'PR': '41', 'RS': '51',
      'BA': '71', 'CE': '85', 'DF': '61', 'PE': '81',
    }
    const ddd = dddMap[state] || '11'
    const phone = `(${ddd}) 9${Math.floor(Math.random() * 90000000 + 10000000)}`
    
    const memberPlan = plans[Math.floor(Math.random() * plans.length)]
    const status = memberStatus[Math.floor(Math.random() * memberStatus.length)]
    
    // Datas realistas
    const now = new Date()
    const daysAgo = Math.floor(Math.random() * 90)
    const lastVisit = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    
    const planDays = memberPlan === 'anual' ? 365 : memberPlan === 'semestral' ? 180 : memberPlan === 'trimestral' ? 90 : 30
    const planRenewalDate = new Date(now.getTime() + Math.floor(Math.random() * planDays + 10) * 24 * 60 * 60 * 1000)
    
    const paymentDate = new Date(now.getTime() - Math.floor(Math.random() * 15) * 24 * 60 * 60 * 1000)
    
    members.push({
      id: `member-${email.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
      name,
      email,
      phone,
      plan: memberPlan,
      status,
      lastVisit: lastVisit.toISOString().split('T')[0],
      planRenewalDate: planRenewalDate.toISOString().split('T')[0],
      paymentDate: paymentDate.toISOString().split('T')[0],
    })
  }
  
  return members
}

// Gerador de treinadores com especialidades
function generateTrainers(count: number, gymEmail: string, gymType: string) {
  const trainers = []
  const specialties = trainerSpecialtiesByType[gymType as keyof typeof trainerSpecialtiesByType] || trainerSpecialtiesByType.geral
  
  const firstNames = ['Carlos', 'Ana', 'Roberto', 'Patricia', 'Marcos', 'Fernanda', 'Ricardo', 'Juliana', 'Alexandre', 'Camila']
  const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes']
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const name = `Prof. ${firstName} ${lastName}`
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${gymEmail.split('@')[1]}`
    const specialty = specialties[Math.floor(Math.random() * specialties.length)]
    const cref = Math.floor(Math.random() * 900000 + 100000)
    const certifications = `CREF ${cref}/${specialty.substring(0, 2).toUpperCase()}`
    
    trainers.push({
      id: `trainer-${email.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
      name,
      email,
      phone: `(11) 9${Math.floor(Math.random() * 90000000 + 10000000)}`,
      specialty,
      status: 'Ativo',
      certifications,
    })
  }
  
  return trainers
}

// Gerador de workouts por tipo de academia
function generateWorkouts(count: number, gymType: string) {
  const workouts = []
  
  const workoutTemplates: Record<string, Array<{name: string, type: string, level: string, duration: string}>> = {
    'musculacao': [
      { name: 'Treino A - Peito e Tríceps', type: 'Musculação', level: 'Intermediário', duration: '60 min' },
      { name: 'Treino B - Costas e Bíceps', type: 'Musculação', level: 'Intermediário', duration: '60 min' },
      { name: 'Treino C - Pernas', type: 'Musculação', level: 'Avançado', duration: '75 min' },
      { name: 'Treino D - Ombros', type: 'Musculação', level: 'Iniciante', duration: '45 min' },
      { name: 'HIIT Cardio', type: 'HIIT', level: 'Todos', duration: '30 min' },
    ],
    'crossfit': [
      { name: 'WOD - Fran', type: 'CrossFit', level: 'Avançado', duration: '45 min' },
      { name: 'WOD - Murph', type: 'CrossFit', level: 'Avançado', duration: '60 min' },
      { name: 'WOD - Cindy', type: 'CrossFit', level: 'Intermediário', duration: '45 min' },
      { name: 'Técnica de Levantamento', type: 'Olympic Lifting', level: 'Intermediário', duration: '60 min' },
      { name: 'Ginástica para CrossFit', type: 'Ginástica', level: 'Iniciante', duration: '45 min' },
    ],
    'yoga': [
      { name: 'Hatha Yoga Básico', type: 'Yoga', level: 'Iniciante', duration: '60 min' },
      { name: 'Vinyasa Flow', type: 'Yoga', level: 'Intermediário', duration: '75 min' },
      { name: 'Yoga Nidra', type: 'Meditação', level: 'Todos', duration: '45 min' },
      { name: 'Alongamento Profundo', type: 'Alongamento', level: 'Todos', duration: '50 min' },
      { name: 'Pranayama - Respiração', type: 'Respiração', level: 'Iniciante', duration: '30 min' },
    ],
    'geral': [
      { name: 'Musculação Livre', type: 'Musculação', level: 'Todos', duration: '60 min' },
      { name: 'Spinning Intenso', type: 'Spinning', level: 'Intermediário', duration: '45 min' },
      { name: 'Zumba Fitness', type: 'Dança', level: 'Todos', duration: '60 min' },
      { name: 'Funcional 30 min', type: 'Funcional', level: 'Iniciante', duration: '30 min' },
      { name: 'Natação Livre', type: 'Natação', level: 'Todos', duration: '50 min' },
    ],
  }
  
  const templates = workoutTemplates[gymType] || workoutTemplates.geral
  
  for (let i = 0; i < count; i++) {
    const template = templates[Math.floor(Math.random() * templates.length)]
    workouts.push({
      id: `workout-${i}-${Date.now()}`,
      name: `${template.name} - Turma ${String.fromCharCode(65 + (i % 5))}`,
      type: template.type,
      duration: template.duration,
      level: template.level,
      description: `${template.name} com duração de ${template.duration} para nível ${template.level.toLowerCase()}`,
    })
  }
  
  return workouts
}

// Gerador de despesas realistas
function generateExpenses(count: number) {
  const expenses = []
  const categories = Object.keys(expensesByCategory)
  
  for (let i = 0; i < count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)]
    const categoryExpenses = expensesByCategory[category as keyof typeof expensesByCategory]
    const expense = categoryExpenses[Math.floor(Math.random() * categoryExpenses.length)]
    
    // Variação de ±20% no valor
    const variance = 0.2
    const amount = Math.floor(expense.avgAmount * (1 + (Math.random() * variance * 2 - variance)))
    
    expenses.push({
      title: expense.title,
      category,
      amount,
      description: `${expense.title} - Mês de referência`,
    })
  }
  
  return expenses
}

async function main() {
  console.log('🌱 Iniciando seed do banco de dados com dados REALISTAS...\n')

  // ============================================
  // 1. Criar Super Admin
  // ============================================
  console.log('👑 Criando Super Admin...')

  const hashedPassword = await hash(SUPER_ADMIN_PASSWORD, 12)
  const hashedGymAdminPassword = await hash(GYM_ADMIN_PASSWORD, 12)

  const superAdmin = await prisma.user.upsert({
    where: { email: SUPER_ADMIN_EMAIL },
    update: {
      role: UserRole.SUPER_ADMIN,
      name: 'Administrador do Sistema',
      passwordHash: hashedPassword,
    },
    create: {
      email: SUPER_ADMIN_EMAIL,
      name: 'Administrador do Sistema',
      role: UserRole.SUPER_ADMIN,
      emailVerified: new Date(),
      passwordHash: hashedPassword,
    },
  })

  console.log(`   ✅ Super Admin criado: ${superAdmin.email}`)

  // ============================================
  // 2. Criar Academias com dados únicos
  // ============================================
  console.log('\n🏋️ Criando academias com dados REALISTAS e DIFERENCIADOS...\n')

  let totalMembers = 0
  let totalTrainers = 0
  let totalWorkouts = 0
  let totalExpenses = 0
  let totalUsers = 0

  const gymTypes = ['musculacao', 'geral', 'yoga', 'musculacao', 'geral', 'musculacao', 'crossfit', 'yoga', 'musculacao', 'geral']

  for (let i = 0; i < gymsData.length; i++) {
    const gymData = gymsData[i]
    const gymType = gymTypes[i]
    
    console.log(`   📦 ${gymData.name} (${gymData.city}/${gymData.state}) - ${gymData.description}`)

    // Criar ou atualizar academia
    const gym = await prisma.gym.upsert({
      where: { cnpj: gymData.cnpj },
      update: {
        name: gymData.name,
        email: gymData.email,
        phone: gymData.phone,
        address: gymData.address,
        city: gymData.city,
        state: gymData.state,
        plan: gymData.plan,
        maxMembers: gymData.maxMembers,
        maxUsers: gymData.maxUsers,
        isActive: true,
      },
      create: {
        name: gymData.name,
        cnpj: gymData.cnpj,
        email: gymData.email,
        phone: gymData.phone,
        address: gymData.address,
        city: gymData.city,
        state: gymData.state,
        plan: gymData.plan,
        maxMembers: gymData.maxMembers,
        maxUsers: gymData.maxUsers,
        isActive: true,
        planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    })

    console.log(`      ✅ Academia criada (ID: ${gym.id.substring(0, 8)}...)`)

    // Criar gerente da academia
    const managerEmail = i === 1 ? GYM_ADMIN_EMAIL : gymData.manager.email
    const managerName = i === 1 ? 'Thiago Lima' : gymData.manager.name
    
    let manager = await prisma.user.findUnique({
      where: { email: managerEmail },
    })

    if (!manager) {
      manager = await prisma.user.create({
        data: {
          email: managerEmail,
          name: managerName,
          role: UserRole.GYM_ADMIN,
          emailVerified: new Date(),
          passwordHash: hashedGymAdminPassword,
        },
      })
    }

    // Vincular gerente à academia
    await prisma.userGym.upsert({
      where: {
        userId_gymId: {
          userId: manager.id,
          gymId: gym.id,
        },
      },
      update: {
        role: UserRole.GYM_ADMIN,
        status: 'ACTIVE',
      },
      create: {
        userId: manager.id,
        gymId: gym.id,
        role: UserRole.GYM_ADMIN,
        status: 'ACTIVE',
      },
    })

    console.log(`      ✅ Gerente: ${managerName}`)

    // Criar usuários comuns (varia conforme plano)
    const userCount = gymData.plan === 'enterprise' ? 5 : gymData.plan === 'pro' ? 3 : 2
    const userNames = ['Instrutor Chefe', 'Recepcionista', 'Auxiliar', 'Gerente', 'Coordenador']
    
    for (let j = 0; j < userCount; j++) {
      const userName = `${userNames[j % userNames.length]} ${j + 1}`
      const userEmail = `${userName.toLowerCase().replace(' ', '.')}@${gymData.name.toLowerCase().replace(/[^a-z]/g, '')}.com.br`

      let user = await prisma.user.findUnique({
        where: { email: userEmail },
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: userEmail,
            name: userName,
            role: UserRole.USER,
            emailVerified: new Date(),
          },
        })
      }

      await prisma.userGym.upsert({
        where: {
          userId_gymId: {
            userId: user.id,
            gymId: gym.id,
          },
        },
        update: {
          role: UserRole.USER,
          status: 'ACTIVE',
        },
        create: {
          userId: user.id,
          gymId: gym.id,
          role: UserRole.USER,
          status: 'ACTIVE',
        },
      })
      totalUsers++
    }

    console.log(`      ✅ ${userCount} usuários comuns`)

    // Gerar e criar membros (quantidade REALISTA por academia)
    const members = generateMembers(gymData.membersCount, gymData.city, gymData.state, gymData.plan)
    
    for (const memberData of members) {
      await prisma.member.upsert({
        where: { id: memberData.id },
        update: { gymId: gym.id, userId: manager.id },
        create: {
          ...memberData,
          gymId: gym.id,
          userId: manager.id,
        },
      })
    }
    totalMembers += members.length
    console.log(`      ✅ ${members.length} membros (Total: ${members.length})`)

    // Gerar e criar treinadores com especialidades
    const trainers = generateTrainers(gymData.trainersCount, gymData.email, gymType)
    
    for (const trainerData of trainers) {
      await prisma.trainer.upsert({
        where: { id: trainerData.id },
        update: { gymId: gym.id, userId: manager.id },
        create: {
          ...trainerData,
          gymId: gym.id,
          userId: manager.id,
        },
      })
    }
    totalTrainers += trainers.length
    console.log(`      ✅ ${trainers.length} treinadores (Especialidades únicas)`)

    // Gerar e criar workouts por tipo
    const workouts = generateWorkouts(gymData.workoutsCount, gymType)
    
    for (const workoutData of workouts) {
      await prisma.workout.upsert({
        where: { id: workoutData.id },
        update: { gymId: gym.id, userId: manager.id },
        create: {
          ...workoutData,
          gymId: gym.id,
          userId: manager.id,
        },
      })
    }
    totalWorkouts += workouts.length
    console.log(`      ✅ ${workouts.length} workouts (Tipo: ${gymType})`)

    // Gerar e criar despesas realistas
    const expenses = generateExpenses(gymData.expensesCount)
    
    for (const expenseData of expenses) {
      await prisma.expense.create({
        data: {
          ...expenseData,
          gymId: gym.id,
          userId: manager.id,
          date: new Date(),
        },
      })
    }
    totalExpenses += expenses.length
    console.log(`      ✅ ${expenses.length} despesas (Valores realistas)`)

    console.log('')
  }

  // ============================================
  // 3. Criar usuário de teste
  // ============================================
  console.log('🧪 Criando usuário de teste...')

  const testUser = await prisma.user.upsert({
    where: { email: 'teste@email.com' },
    update: {},
    create: {
      email: 'teste@email.com',
      name: 'Usuário Teste',
      role: UserRole.USER,
      emailVerified: new Date(),
    },
  })

  console.log(`   ✅ Usuário teste criado: ${testUser.email}`)

  // ============================================
  // Resumo
  // ============================================
  console.log('\n🎉 Seed concluído com SUCESSO!\n')
  console.log('📊 Resumo dos dados REALISTAS:')
  console.log(`   - 1 Super Admin`)
  console.log(`   - ${gymsData.length} Academias com PERFIS DIFERENTES`)
  console.log(`   - ${gymsData.length} Gerentes (GYM_ADMIN)`)
  console.log(`   - ${totalUsers} Usuários comuns (USER)`)
  console.log(`   - ${totalMembers} Membros (Nomes regionalizados)`)
  console.log(`   - ${totalTrainers} Treinadores (Especialidades por academia)`)
  console.log(`   - ${totalWorkouts} Workouts (Tipos variados)`)
  console.log(`   - ${totalExpenses} Despesas (Valores realistas)`)
  
  console.log('\n💡 Dados de login:')
  console.log('   Super Admin: thiago.lima.amazoniatelecom@gmail.com / admin123')
  console.log('   Gerente Iron Gym: thiagolima112358@gmail.com / admin123')
  console.log('   Gerente FitLife: ana@fitlife.com.br / admin123')
  console.log('   Gerente BodyTech: roberto@bodytech.com.br / admin123')
  
  console.log('\n🏋️ Perfil das Academias:')
  gymsData.forEach((gym, i) => {
    console.log(`   ${i + 1}. ${gym.name} (${gym.city}) - ${gym.membersCount} membros, ${gym.trainersCount} treinadores, ${gym.workoutsCount} workouts`)
  })
  
  console.log('\n🔐 Em produção, altere as senhas imediatamente!')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
