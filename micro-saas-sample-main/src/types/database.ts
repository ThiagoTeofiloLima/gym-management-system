// Tipos para os modelos do banco de dados no Supabase

export interface Gym {
  id: string
  name: string
  cnpj: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  isActive: boolean
  plan: string
  planExpiresAt: string | null
  maxMembers: number
  maxUsers: number
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  name: string | null
  email: string | null
  emailVerified: string | null
  image: string | null
  passwordHash: string | null
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  stripeSubscriptionStatus: string | null
  stripePriceId: string | null
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface UserGym {
  id: string
  userId: string
  gymId: string
  role: UserRole
  status: UserGymStatus
  createdAt: string
  updatedAt: string
}

export interface UserGymWithGym extends UserGym {
  gym?: Gym | null
}

export interface Member {
  id: string
  name: string
  email: string
  phone: string
  plan: string
  status: string
  lastVisit: string
  trainerId: string | null
  userId: string
  planRenewalDate: string
  paymentDate: string
  gymId: string | null
  gymPlanId?: string | null
  createdAt: string
  updatedAt: string
}

export interface Trainer {
  id: string
  name: string
  email: string
  phone: string
  specialty: string
  status: string
  certifications: string
  userId: string
  gymId: string | null
  createdAt: string
  updatedAt: string
}

export interface Workout {
  id: string
  name: string
  type: string
  duration: string
  level: string
  description: string | null
  userId: string
  gymId: string | null
  trainerId: string | null
  createdAt: string
  updatedAt: string
}

export interface WorkoutMember {
  id: string
  workoutId: string
  memberId: string
  assignedAt: string
}

export interface Attendance {
  id: string
  date: string
  memberId: string
  memberEmail: string
  checkIn: string | null
  checkOut: string | null
  status: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface Expense {
  id: string
  title: string
  description: string | null
  amount: number
  category: string
  date: string
  userId: string
  gymId: string | null
  createdAt: string
  updatedAt: string
}

export interface Todo {
  id: string
  title: string
  userId: string
  gymId?: string | null
  createdAt: string
  updatedAt: string
  doneAt: string | null
}

export interface GymPlan {
  id: string
  gymId: string
  name: string
  description: string | null
  price: number
  duration: number
  maxMembers: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ManagerTempPassword {
  id: string
  managerId: string
  gymId: string
  password: string
  createdAt: string
  updatedAt: string
}

export interface Account {
  id: string
  userId: string
  type: string
  provider: string
  providerAccountId: string
  refresh_token: string | null
  access_token: string | null
  expires_at: number | null
  token_type: string | null
  scope: string | null
  id_token: string | null
  session_state: string | null
}

export interface Session {
  id: string
  sessionToken: string
  userId: string
  expires: string
}

export interface VerificationToken {
  identifier: string
  token: string
  expires: string
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  GYM_ADMIN = 'GYM_ADMIN',
  USER = 'USER',
}

export enum UserGymStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
}

// Tipos para filtros e queries
export interface MemberFilters {
  gymId?: string
  status?: string
  plan?: string
  search?: string
  userId?: string
  trainerId?: string
}

export interface TrainerFilters {
  gymId?: string
  userId?: string
}

export interface WorkoutFilters {
  gymId?: string
  userId?: string
  trainerId?: string
}

export interface ExpenseFilters {
  gymId?: string
  userId?: string
  category?: string
  dateFrom?: string
  dateTo?: string
}

export interface TodoFilters {
  gymId?: string
  userId?: string
}

export interface AttendanceFilters {
  memberId?: string
  dateFrom?: string
  dateTo?: string
  status?: string
  userId?: string
}
