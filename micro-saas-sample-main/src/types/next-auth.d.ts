import { UserRole, UserGymStatus } from "@prisma/client"

declare module "next-auth" {
  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    emailVerified?: Date | null
    role?: UserRole
  }

  interface Session {
    user: User & {
      id: string
      role?: UserRole
      emailVerified?: Date | null
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
