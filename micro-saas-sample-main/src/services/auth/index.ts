import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import EmailProvider from "next-auth/providers/email"
import { UserRole } from "@prisma/client"
import { getUrl } from "@/lib/get-url"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,

  providers: [
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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            gyms: {
              include: {
                gym: true,
              },
            },
          },
        })

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

    // Google Provider
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),

    // GitHub Provider
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),

    // Email Provider (Magic Link)
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
    }),
  ],
  
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
  
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Permitir signIn para todos os providers
      console.log('SignIn callback - User:', user?.email, 'Account:', account?.provider)
      return true
    },

    async jwt({ token, user, trigger, session }) {
      // Quando o usuário faz login pela primeira vez, adiciona informações ao token
      if (user) {
        token.id = user.id
        token.email = user.email
        token.role = user.role

        // Buscar informações do usuário no banco
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            gyms: {
              include: {
                gym: true,
              },
            },
          },
        })

        if (dbUser) {
          token.role = dbUser.role
          token.gyms = dbUser.gyms.map((userGym) => ({
            gymId: userGym.gymId,
            gymName: userGym.gym.name,
            role: userGym.role,
            status: userGym.status,
            plan: userGym.gym.plan,
            isActive: userGym.gym.isActive,
          }))

          // Define activeGymId para usuários com academias
          // Para Gym Admin, usa a academia onde é admin
          // Para User, usa a primeira academia disponível
          if (dbUser.gyms.length > 0 && !token.activeGymId) {
            if (dbUser.role === 'GYM_ADMIN') {
              const adminGym = dbUser.gyms.find(g => g.role === 'GYM_ADMIN')
              token.activeGymId = adminGym?.gymId || dbUser.gyms[0].gymId
              token.activeGymRole = adminGym?.role || dbUser.gyms[0].role
            } else if (dbUser.gyms.length === 1) {
              // User com apenas uma academia
              token.activeGymId = dbUser.gyms[0].gymId
              token.activeGymRole = dbUser.gyms[0].role
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

      console.log('JWT callback - Token ID:', token.id, 'Email:', token.email, 'ActiveGymId:', token.activeGymId)
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

      console.log('Session callback - User:', session.user.email, 'ID:', session.user.id)
      return session
    },
  },
  
  events: {
    async createUser({ user }) {
      // Quando um novo usuário é criado, definir role padrão
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'USER' },
      })
    },
  },
})
