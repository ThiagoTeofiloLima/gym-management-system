import { UserRole, UserGymStatus } from "@/types/database"

declare module "next-auth" {
  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    emailVerified?: string | null
    role?: UserRole
  }

  interface Session {
    user: User & {
      id: string
      role?: UserRole
      emailVerified?: string | null
      gyms?: Array<{
        gymId: string
        gymName: string
        role: UserRole
        status: UserGymStatus
        plan: string
        isActive: boolean
      }>
      activeGymId?: string
      activeGymRole?: UserRole
    }
    expires: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role?: UserRole
    gyms?: Array<{
      gymId: string
      gymName: string
      role: UserRole
      status: UserGymStatus
      plan: string
      isActive: boolean
    }>
    activeGymId?: string
    activeGymRole?: UserRole
  }
}
