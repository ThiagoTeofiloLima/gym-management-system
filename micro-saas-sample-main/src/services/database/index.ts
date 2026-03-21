import { supabase } from '@/lib/supabase'
import type {
  Gym,
  User,
  UserGym,
  UserGymWithGym,
  Member,
  Trainer,
  Workout,
  WorkoutMember,
  Attendance,
  Expense,
  Todo,
  GymPlan,
  ManagerTempPassword,
  Account,
  Session,
  VerificationToken,
  UserRole,
  MemberFilters,
  TrainerFilters,
  WorkoutFilters,
  ExpenseFilters,
  TodoFilters,
  AttendanceFilters,
} from '@/types/database'

/**
 * Serviço de banco de dados usando Supabase
 *
 * Substitui o Prisma pelo cliente do Supabase
 */

// ============================================
// GYMS
// ============================================

export async function findGymById(id: string): Promise<Gym | null> {
  const { data, error } = await supabase
    .from('gyms')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as Gym
}

export async function findAllGyms(): Promise<Gym[]> {
  const { data, error } = await supabase
    .from('gyms')
    .select('*')
    .order('name', { ascending: true })

  if (error) return []
  return data as Gym[]
}

export async function createGym(gym: Omit<Gym, 'id' | 'createdAt' | 'updatedAt'>): Promise<Gym> {
  const { data, error } = await supabase
    .from('gyms')
    .insert([gym])
    .select()
    .single()

  if (error) throw error
  return data as Gym
}

export async function updateGym(id: string, gym: Partial<Gym>): Promise<Gym> {
  const { data, error } = await supabase
    .from('gyms')
    .update({ ...gym, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Gym
}

export async function deleteGym(id: string): Promise<void> {
  const { error } = await supabase
    .from('gyms')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================
// USERS
// ============================================

export async function findUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as User
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !data) return null
  return data as User
}

export async function createUser(user: {
  name: string | null
  email: string | null
  role: UserRole
  emailVerified: string | null
  passwordHash: string | null
  image?: string | null
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
  stripeSubscriptionStatus?: string | null
  stripePriceId?: string | null
}): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert([user])
    .select()
    .single()

  if (error) throw error
  return data as User
}

export async function updateUser(id: string, user: Partial<User>): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update({ ...user, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as User
}

export async function deleteUser(id: string): Promise<void> {
  // Primeiro remove as relações
  await supabase.from('user_gyms').delete().eq('userId', id)
  await supabase.from('accounts').delete().eq('userId', id)
  await supabase.from('sessions').delete().eq('userId', id)
  
  // Depois remove o usuário
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================
// USER_GYMS
// ============================================

export async function findUserGym(userId: string, gymId: string): Promise<UserGym | null> {
  const { data, error } = await supabase
    .from('user_gyms')
    .select('*')
    .eq('userId', userId)
    .eq('gymId', gymId)
    .single()

  if (error || !data) return null
  return data as UserGym
}

export async function findUserGymsByUserId(userId: string): Promise<UserGymWithGym[]> {
  // Primeiro busca os user_gyms
  const { data: userGyms, error: ugError } = await supabase
    .from('user_gyms')
    .select('*')
    .eq('userId', userId)

  if (ugError || !userGyms) return []
  
  // Se não houver vínculos, retorna vazio
  if (userGyms.length === 0) return []
  
  // Busca as academias separadamente
  const gymIds = userGyms.map(ug => ug.gymId)
  const { data: gyms, error: gymsError } = await supabase
    .from('gyms')
    .select('id, name, isActive, plan')
    .in('id', gymIds)
  
  if (gymsError) return []
  
  // Junta os dados
  return userGyms.map(ug => ({
    ...ug,
    gym: gyms?.find(g => g.id === ug.gymId) || null,
  })) as UserGymWithGym[]
}

export async function createUserGym(userGym: Omit<UserGym, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserGym> {
  const { data, error } = await supabase
    .from('user_gyms')
    .insert([userGym])
    .select()
    .single()

  if (error) throw error
  return data as UserGym
}

export async function updateUserGym(userId: string, gymId: string, userGym: Partial<UserGym>): Promise<UserGym> {
  const { data, error } = await supabase
    .from('user_gyms')
    .update({ ...userGym, updatedAt: new Date().toISOString() })
    .eq('userId', userId)
    .eq('gymId', gymId)
    .select()
    .single()

  if (error) throw error
  return data as UserGym
}

// ============================================
// MEMBERS
// ============================================

export async function findMemberById(id: string): Promise<Member | null> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as Member
}

export async function findMembers(filters: MemberFilters): Promise<Member[]> {
  let query = supabase.from('members').select('*')

  if (filters.gymId) {
    query = query.eq('gymId', filters.gymId)
  }

  if (filters.userId) {
    query = query.eq('userId', filters.userId)
  }

  if (filters.trainerId) {
    query = query.eq('trainerId', filters.trainerId)
  }

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.plan) {
    query = query.eq('plan', filters.plan)
  }

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
  }

  const { data, error } = await query.order('createdAt', { ascending: false })

  if (error) return []
  
  // Busca os treinadores separadamente se houver membros
  if (data && data.length > 0) {
    const trainerIds = data.filter(m => m.trainerId).map(m => m.trainerId)
    if (trainerIds.length > 0) {
      const { data: trainers } = await supabase
        .from('trainers')
        .select('id, name, specialty')
        .in('id', trainerIds)
      
      // Adiciona o trainer a cada membro
      return data.map(member => ({
        ...member,
        trainer: trainers?.find(t => t.id === member.trainerId) || null,
      })) as Member[]
    }
  }
  
  return data as Member[]
}

export async function createMember(member: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>): Promise<Member> {
  const { data, error } = await supabase
    .from('members')
    .insert([member])
    .select()
    .single()

  if (error) throw error
  return data as Member
}

export async function updateMember(id: string, member: Partial<Member>): Promise<Member> {
  const { data, error } = await supabase
    .from('members')
    .update({ ...member, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Member
}

export async function deleteMember(id: string): Promise<void> {
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================
// TRAINERS
// ============================================

export async function findTrainerById(id: string): Promise<Trainer | null> {
  const { data, error } = await supabase
    .from('trainers')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as Trainer
}

export async function findTrainers(filters: TrainerFilters): Promise<Trainer[]> {
  let query = supabase.from('trainers').select('*')

  if (filters.gymId) {
    query = query.eq('gymId', filters.gymId)
  }

  if (filters.userId) {
    query = query.eq('userId', filters.userId)
  }

  const { data, error } = await query.order('name', { ascending: true })

  if (error) return []
  return data as Trainer[]
}

export async function createTrainer(trainer: Omit<Trainer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trainer> {
  const { data, error } = await supabase
    .from('trainers')
    .insert([trainer])
    .select()
    .single()

  if (error) throw error
  return data as Trainer
}

export async function updateTrainer(id: string, trainer: Partial<Trainer>): Promise<Trainer> {
  const { data, error } = await supabase
    .from('trainers')
    .update({ ...trainer, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Trainer
}

export async function deleteTrainer(id: string): Promise<void> {
  const { error } = await supabase
    .from('trainers')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================
// WORKOUTS
// ============================================

export async function findWorkoutById(id: string): Promise<Workout | null> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as Workout
}

export async function findWorkouts(filters: WorkoutFilters): Promise<Workout[]> {
  let query = supabase.from('workouts').select('*')

  if (filters.gymId) {
    query = query.eq('gymId', filters.gymId)
  }

  if (filters.userId) {
    query = query.eq('userId', filters.userId)
  }

  if (filters.trainerId) {
    query = query.eq('trainerId', filters.trainerId)
  }

  const { data, error } = await query.order('createdAt', { ascending: false })

  if (error) return []
  return data as Workout[]
}

export async function createWorkout(workout: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workout> {
  const { data, error } = await supabase
    .from('workouts')
    .insert([workout])
    .select()
    .single()

  if (error) throw error
  return data as Workout
}

export async function updateWorkout(id: string, workout: Partial<Workout>): Promise<Workout> {
  const { data, error } = await supabase
    .from('workouts')
    .update({ ...workout, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Workout
}

export async function deleteWorkout(id: string): Promise<void> {
  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================
// WORKOUT_MEMBERS
// ============================================

export async function findWorkoutMembersByWorkoutId(workoutId: string): Promise<WorkoutMember[]> {
  const { data, error } = await supabase
    .from('workout_members')
    .select('*')
    .eq('workoutId', workoutId)

  if (error) return []
  return data as WorkoutMember[]
}

export async function findWorkoutMembersByMemberId(memberId: string): Promise<WorkoutMember[]> {
  const { data, error } = await supabase
    .from('workout_members')
    .select('*')
    .eq('memberId', memberId)

  if (error) return []
  return data as WorkoutMember[]
}

export async function createWorkoutMember(workoutMember: Omit<WorkoutMember, 'id' | 'assignedAt'>): Promise<WorkoutMember> {
  const { data, error } = await supabase
    .from('workout_members')
    .insert([workoutMember])
    .select()
    .single()

  if (error) throw error
  return data as WorkoutMember
}

export async function deleteWorkoutMember(workoutId: string, memberId: string): Promise<void> {
  const { error } = await supabase
    .from('workout_members')
    .delete()
    .eq('workoutId', workoutId)
    .eq('memberId', memberId)

  if (error) throw error
}

// ============================================
// ATTENDANCE
// ============================================

export async function findAttendanceById(id: string): Promise<Attendance | null> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as Attendance
}

export async function findAttendanceRecords(filters: AttendanceFilters): Promise<Attendance[]> {
  let query = supabase.from('attendance').select('*')

  if (filters.memberId) {
    query = query.eq('memberId', filters.memberId)
  }

  if (filters.userId) {
    query = query.eq('userId', filters.userId)
  }

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.dateFrom) {
    query = query.gte('date', filters.dateFrom)
  }

  if (filters.dateTo) {
    query = query.lte('date', filters.dateTo)
  }

  const { data, error } = await query.order('date', { ascending: false })

  if (error) return []
  return data as Attendance[]
}

export async function createAttendance(attendance: Omit<Attendance, 'id' | 'createdAt' | 'updatedAt'>): Promise<Attendance> {
  console.log('🔵 DB createAttendance: Dados enviados:', attendance)
  
  const { data, error } = await supabase
    .from('attendance')
    .insert([attendance])
    .select()
    .single()

  if (error) {
    console.error('❌ DB createAttendance: Erro no Supabase:')
    console.error('   - Message:', error.message)
    console.error('   - Details:', error.details)
    console.error('   - Hint:', error.hint)
    console.error('   - Code:', error.code)
    console.error('   - Full error:', JSON.stringify(error, null, 2))
    throw error
  }
  
  console.log('✅ DB createAttendance: Registro criado:', data?.id)
  return data as Attendance
}

export async function updateAttendance(id: string, attendance: Partial<Attendance>): Promise<Attendance> {
  const { data, error } = await supabase
    .from('attendance')
    .update({ ...attendance, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Attendance
}

export async function deleteAttendance(id: string): Promise<void> {
  const { error } = await supabase
    .from('attendance')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================
// EXPENSES
// ============================================

export async function findExpenseById(id: string): Promise<Expense | null> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as Expense
}

export async function findExpenses(filters: ExpenseFilters): Promise<Expense[]> {
  let query = supabase.from('expenses').select('*')

  if (filters.gymId) {
    query = query.eq('gymId', filters.gymId)
  }

  if (filters.userId) {
    query = query.eq('userId', filters.userId)
  }

  if (filters.category) {
    query = query.eq('category', filters.category)
  }

  if (filters.dateFrom) {
    query = query.gte('date', filters.dateFrom)
  }

  if (filters.dateTo) {
    query = query.lte('date', filters.dateTo)
  }

  const { data, error } = await query.order('date', { ascending: false })

  if (error) return []
  return data as Expense[]
}

export async function createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert([expense])
    .select()
    .single()

  if (error) throw error
  return data as Expense
}

export async function updateExpense(id: string, expense: Partial<Expense>): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .update({ ...expense, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Expense
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================
// TODOS
// ============================================

export async function findTodoById(id: string): Promise<Todo | null> {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as Todo
}

export async function findTodos(filters: TodoFilters): Promise<Todo[]> {
  let query = supabase.from('todos').select('*')

  if (filters.gymId) {
    query = query.eq('gymId', filters.gymId)
  }

  if (filters.userId) {
    query = query.eq('userId', filters.userId)
  }

  const { data, error } = await query.order('createdAt', { ascending: false })

  if (error) return []
  return data as Todo[]
}

export async function createTodo(todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Todo> {
  const { data, error } = await supabase
    .from('todos')
    .insert([todo])
    .select()
    .single()

  if (error) throw error
  return data as Todo
}

export async function updateTodo(id: string, todo: Partial<Todo>): Promise<Todo> {
  const { data, error } = await supabase
    .from('todos')
    .update({ ...todo, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Todo
}

export async function deleteTodo(id: string): Promise<void> {
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================
// GYM_PLANS
// ============================================

export async function findGymPlanById(id: string): Promise<GymPlan | null> {
  const { data, error } = await supabase
    .from('gym_plans')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as GymPlan
}

export async function findGymPlansByGymId(gymId: string): Promise<GymPlan[]> {
  const { data, error } = await supabase
    .from('gym_plans')
    .select('*')
    .eq('gymId', gymId)
    .order('name', { ascending: true })

  if (error) return []
  return data as GymPlan[]
}

export async function createGymPlan(gymPlan: Omit<GymPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<GymPlan> {
  const { data, error } = await supabase
    .from('gym_plans')
    .insert([gymPlan])
    .select()
    .single()

  if (error) throw error
  return data as GymPlan
}

export async function updateGymPlan(id: string, gymPlan: Partial<GymPlan>): Promise<GymPlan> {
  const { data, error } = await supabase
    .from('gym_plans')
    .update({ ...gymPlan, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as GymPlan
}

export async function deleteGymPlan(id: string): Promise<void> {
  const { error } = await supabase
    .from('gym_plans')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================
// MANAGER_TEMP_PASSWORDS
// ============================================

export async function findManagerTempPassword(managerId: string, gymId: string): Promise<ManagerTempPassword | null> {
  const { data, error } = await supabase
    .from('manager_temp_passwords')
    .select('*')
    .eq('managerId', managerId)
    .eq('gymId', gymId)
    .single()

  if (error || !data) return null
  return data as ManagerTempPassword
}

export async function createManagerTempPassword(password: Omit<ManagerTempPassword, 'id' | 'createdAt' | 'updatedAt'>): Promise<ManagerTempPassword> {
  const { data, error } = await supabase
    .from('manager_temp_passwords')
    .insert([password])
    .select()
    .single()

  if (error) throw error
  return data as ManagerTempPassword
}

export async function updateManagerTempPassword(managerId: string, gymId: string, password: Partial<ManagerTempPassword>): Promise<ManagerTempPassword> {
  const { data, error } = await supabase
    .from('manager_temp_passwords')
    .update({ ...password, updatedAt: new Date().toISOString() })
    .eq('managerId', managerId)
    .eq('gymId', gymId)
    .select()
    .single()

  if (error) throw error
  return data as ManagerTempPassword
}

// ============================================
// AUTH (NextAuth)
// ============================================

export async function findAccountByProviderAndAccountId(provider: string, providerAccountId: string): Promise<Account | null> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('provider', provider)
    .eq('providerAccountId', providerAccountId)
    .single()

  if (error || !data) return null
  return data as Account
}

export async function createAccount(account: Omit<Account, 'id'>): Promise<Account> {
  const { data, error } = await supabase
    .from('accounts')
    .insert([account])
    .select()
    .single()

  if (error) throw error
  return data as Account
}

export async function findSessionBySessionToken(sessionToken: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('sessionToken', sessionToken)
    .single()

  if (error || !data) return null
  return data as Session
}

export async function createSession(session: Omit<Session, 'id'>): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .insert([session])
    .select()
    .single()

  if (error) throw error
  return data as Session
}

export async function updateSession(sessionToken: string, session: Partial<Session>): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .update(session)
    .eq('sessionToken', sessionToken)
    .select()
    .single()

  if (error) throw error
  return data as Session
}

export async function deleteSession(sessionToken: string): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('sessionToken', sessionToken)

  if (error) throw error
}

export async function findVerificationToken(identifier: string, token: string): Promise<VerificationToken | null> {
  const { data, error } = await supabase
    .from('verification_tokens')
    .select('*')
    .eq('identifier', identifier)
    .eq('token', token)
    .single()

  if (error || !data) return null
  return data as VerificationToken
}

export async function createVerificationToken(verificationToken: Omit<VerificationToken, 'id'>): Promise<VerificationToken> {
  const { data, error } = await supabase
    .from('verification_tokens')
    .insert([verificationToken])
    .select()
    .single()

  if (error) throw error
  return data as VerificationToken
}

export async function deleteVerificationToken(identifier: string, token: string): Promise<void> {
  const { error } = await supabase
    .from('verification_tokens')
    .delete()
    .eq('identifier', identifier)
    .eq('token', token)

  if (error) throw error
}

// ============================================
// COUNTS & AGGREGATIONS
// ============================================

export async function countUsersByGymId(gymId: string): Promise<number> {
  const { data, error } = await supabase
    .from('user_gyms')
    .select('*', { count: 'exact', head: true })
    .eq('gymId', gymId)

  if (error) return 0
  return data?.length || 0
}

export async function countMembersByGymId(gymId: string): Promise<number> {
  const { data, error } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('gymId', gymId)

  if (error) return 0
  return data?.length || 0
}

export async function countTrainersByGymId(gymId: string): Promise<number> {
  const { data, error } = await supabase
    .from('trainers')
    .select('*', { count: 'exact', head: true })
    .eq('gymId', gymId)

  if (error) return 0
  return data?.length || 0
}

export async function countWorkoutsByGymId(gymId: string): Promise<number> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*', { count: 'exact', head: true })
    .eq('gymId', gymId)

  if (error) return 0
  return data?.length || 0
}

export async function countExpensesByGymId(gymId: string): Promise<number> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*', { count: 'exact', head: true })
    .eq('gymId', gymId)

  if (error) return 0
  return data?.length || 0
}

export async function getGymCounts(gymId: string) {
  const [users, members, trainers, workouts, expenses] = await Promise.all([
    countUsersByGymId(gymId),
    countMembersByGymId(gymId),
    countTrainersByGymId(gymId),
    countWorkoutsByGymId(gymId),
    countExpensesByGymId(gymId),
  ])

  return { users, members, trainers, workouts, expenses }
}

// ============================================
// USER_GYMS - Additional functions
// ============================================

export async function findUserGymsByGymId(gymId: string): Promise<UserGym[]> {
  // Primeiro busca os user_gyms
  const { data: userGyms, error: ugError } = await supabase
    .from('user_gyms')
    .select('*')
    .eq('gymId', gymId)
    .order('createdAt', { ascending: false })

  if (ugError || !userGyms) return []
  
  // Se não houver vínculos, retorna vazio
  if (userGyms.length === 0) return []
  
  // Busca os usuários separadamente
  const userIds = userGyms.map(ug => ug.userId)
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, email, image, role, emailVerified')
    .in('id', userIds)
  
  if (usersError) return []
  
  // Junta os dados
  return userGyms.map(ug => ({
    ...ug,
    user: users?.find(u => u.id === ug.userId) || null,
  })) as UserGym[]
}

export async function findUserGymByUserIdGymId(userId: string, gymId: string): Promise<UserGym | null> {
  const { data, error } = await supabase
    .from('user_gyms')
    .select('*')
    .eq('userId', userId)
    .eq('gymId', gymId)
    .single()

  if (error || !data) return null
  return data as UserGym
}

export async function deleteUserGym(userId: string, gymId: string): Promise<void> {
  const { error } = await supabase
    .from('user_gyms')
    .delete()
    .eq('userId', userId)
    .eq('gymId', gymId)

  if (error) throw error
}

export async function deleteUserGymsByGymId(gymId: string): Promise<void> {
  const { error } = await supabase
    .from('user_gyms')
    .delete()
    .eq('gymId', gymId)

  if (error) throw error
}

// ============================================
// GYMS - Additional functions
// ============================================

export async function findGymByCnpj(cnpj: string): Promise<Gym | null> {
  const { data, error } = await supabase
    .from('gyms')
    .select('*')
    .eq('cnpj', cnpj)
    .single()

  if (error || !data) return null
  return data as Gym
}

export async function findGymByEmail(email: string): Promise<Gym | null> {
  const { data, error } = await supabase
    .from('gyms')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !data) return null
  return data as Gym
}

export async function findGymsWithFilters(filters: {
  search?: string
  plan?: string
  status?: string
  state?: string
}): Promise<Gym[]> {
  let query = supabase.from('gyms').select('*')

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,city.ilike.%${filters.search}%,cnpj.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
  }

  if (filters.plan && filters.plan !== 'all') {
    query = query.eq('plan', filters.plan)
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('isActive', filters.status === 'active')
  }

  if (filters.state && filters.state !== 'all') {
    query = query.eq('state', filters.state)
  }

  const { data, error } = await query.order('createdAt', { ascending: false })

  if (error) return []
  return data as Gym[]
}

// ============================================
// USERS - Additional functions
// ============================================

export async function findAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('createdAt', { ascending: false })

  if (error) return []
  return data as User[]
}

export async function findUserGymsWithDetails(userId: string): Promise<any[]> {
  // Primeiro busca os user_gyms
  const { data: userGyms, error: ugError } = await supabase
    .from('user_gyms')
    .select('*')
    .eq('userId', userId)

  if (ugError || !userGyms) return []
  
  // Se não houver vínculos, retorna vazio
  if (userGyms.length === 0) return []
  
  // Busca as academias separadamente
  const gymIds = userGyms.map(ug => ug.gymId)
  const { data: gyms, error: gymsError } = await supabase
    .from('gyms')
    .select('id, name, isActive, plan')
    .in('id', gymIds)
  
  if (gymsError) return []
  
  // Junta os dados
  return userGyms.map(ug => ({
    ...ug,
    gym: gyms?.find(g => g.id === ug.gymId) || null,
  }))
}

// ============================================
// MEMBERS - Additional functions
// ============================================

export async function findMembersByGymIds(gymIds: string[]): Promise<Member[]> {
  if (gymIds.length === 0) return []

  const { data, error } = await supabase
    .from('members')
    .select('*')
    .in('gymId', gymIds)
    .order('createdAt', { ascending: false })

  if (error) return []
  
  // Busca os treinadores separadamente se houver membros
  if (data && data.length > 0) {
    const trainerIds = data.filter(m => m.trainerId).map(m => m.trainerId)
    if (trainerIds.length > 0) {
      const { data: trainers } = await supabase
        .from('trainers')
        .select('id, name, specialty')
        .in('id', trainerIds)
      
      // Adiciona o trainer a cada membro
      return data.map(member => ({
        ...member,
        trainer: trainers?.find(t => t.id === member.trainerId) || null,
      })) as Member[]
    }
  }
  
  return data as Member[]
}

// ============================================
// WORKOUT_MEMBERS
// ============================================

export async function deleteWorkoutMembersByWorkoutGymId(gymId: string): Promise<void> {
  // Primeiro buscar todos os workouts da academia
  const workouts = await findWorkouts({ gymId })
  const workoutIds = workouts.map(w => w.id)
  
  if (workoutIds.length === 0) return
  
  const { error } = await supabase
    .from('workout_members')
    .delete()
    .in('workoutId', workoutIds)

  if (error) throw error
}

// ============================================
// CASCADE DELETE HELPERS
// ============================================

export async function deleteAttendanceByGymId(gymId: string): Promise<void> {
  const members = await findMembers({ gymId })
  const memberIds = members.map(m => m.id)
  
  if (memberIds.length === 0) return
  
  const { error } = await supabase
    .from('attendance')
    .delete()
    .in('memberId', memberIds)

  if (error) throw error
}

export async function deleteGymPlansByGymId(gymId: string): Promise<void> {
  const { error } = await supabase
    .from('gym_plans')
    .delete()
    .eq('gymId', gymId)

  if (error) throw error
}

export async function deleteTodosByGymId(gymId: string): Promise<void> {
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('gymId', gymId)

  if (error) throw error
}

export async function deleteManagerTempPasswords(managerId: string, gymId: string): Promise<void> {
  const { error } = await supabase
    .from('manager_temp_passwords')
    .delete()
    .eq('managerId', managerId)
    .eq('gymId', gymId)

  if (error) throw error
}

// ============================================
// HEALTH CHECK
// ============================================

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const { error } = await supabase.from('gyms').select('id').limit(1)
    return !error
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}
