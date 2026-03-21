import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import EmailProvider from "next-auth/providers/email"
import { getUrl } from "@/lib/get-url"
import { compare } from "bcryptjs"
import * as db from "@/services/database"
import type { UserRole } from "@/types/database"

// Constrói array de providers dinamicamente
const providers: any[] = [
  // Credentials Provider (Email/Senha)
  Credentials({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Senha', type: 'password' }
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error('Email e senha são obrigatórios')
      }

      const user = await db.findUserByEmail(credentials.email as string)

      if (!user || !user.passwordHash) {
        throw new Error('Email ou senha inválidos')
      }

      const isPasswordValid = await compare(
        credentials.password as string,
        user.passwordHash
      )

      if (!isPasswordValid) {
        throw new Error('Email ou senha inválidos')
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        emailVerified: user.emailVerified,
      }
    },
  }),
]

// Adiciona Google Provider apenas se credenciais existirem
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  )
}

// Adiciona GitHub Provider apenas se credenciais existirem
if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  )
}

// Adiciona Email Provider apenas se credenciais existirem
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  providers.push(
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER,
        port: Number(process.env.EMAIL_PORT),
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    })
  )
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,

  pages: {
    signIn: '/auth',
    verifyRequest: '/auth/verify',
    error: '/auth/error',
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },

  cookies: {
    sessionToken: {
      name: 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Permitir signIn para todos os providers
      return true
    },

    async jwt({ token, user, trigger, session }) {
      // Quando o usuário faz login pela primeira vez, adiciona informações ao token
      if (user) {
        token.id = user.id
        token.email = user.email
        token.role = user.role

        // Buscar informações do usuário no banco (apenas se user.id existir)
        if (user.id) {
          const dbUser = await db.findUserById(user.id)
          const userGyms = await db.findUserGymsByUserId(user.id)

          if (dbUser) {
            token.role = dbUser.role
            token.gyms = userGyms.map((userGym: any) => ({
              gymId: userGym.gymId,
              gymName: (userGym as any).gym?.name,
              role: userGym.role,
              status: userGym.status,
              plan: (userGym as any).gym?.plan,
              isActive: (userGym as any).gym?.isActive,
            }))

            // Define activeGymId para usuários com academias
            // Para Gym Admin, usa a academia onde é admin
            // Para User, usa a primeira academia disponível
            if (userGyms.length > 0 && !token.activeGymId) {
              if (dbUser.role === 'GYM_ADMIN') {
                const adminGym = userGyms.find((g: any) => g.role === 'GYM_ADMIN')
                token.activeGymId = adminGym?.gymId || userGyms[0].gymId
                token.activeGymRole = adminGym?.role || userGyms[0].role
              } else if (userGyms.length === 1) {
                // User com apenas uma academia
                token.activeGymId = userGyms[0].gymId
                token.activeGymRole = userGyms[0].role
              }
            }
          }
        }
      }

      // Atualizar token quando a sessão for atualizada
      if (trigger === "update" && session) {
        if (session.activeGymId) {
          token.activeGymId = session.activeGymId
        }
        if (session.activeGymRole) {
          token.activeGymRole = session.activeGymRole
        }
      }

      return token
    },

    async session({ session, token }) {
      // Com JWT, usamos o token em vez do user
      session.user.id = token.id as string
      session.user.role = token.role as UserRole | undefined
      session.user.gyms = token.gyms as any

      if (token.activeGymId) {
        session.user.activeGymId = token.activeGymId as string
        session.user.activeGymRole = token.activeGymRole as any
      }

      return session
    },
  },

  events: {
    async createUser({ user }) {
      // Quando um novo usuário é criado, definir role padrão (apenas se user.id existir)
      if (user.id) {
        await db.updateUser(user.id, { role: 'USER' as import('@/types/database').UserRole })
      }
    },
  },
})
