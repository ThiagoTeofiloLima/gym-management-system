import * as db from "@/services/database"

// Adapter para NextAuth usando Supabase
export const jsonAdapter = {
  async getUser(id: string) {
    return await db.findUserById(id)
  },

  async getUserByEmail(email: string) {
    return await db.findUserByEmail(email)
  },

  async createUser(user: any) {
    const userData = {
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified ? new Date(user.emailVerified).toISOString() : null,
      image: user.image,
      passwordHash: user.passwordHash || null,
      role: user.role || 'USER',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripeSubscriptionStatus: null,
      stripePriceId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return await db.createUser(userData)
  },

  async updateUser(user: any) {
    return await db.updateUser(user.id, {
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified ? new Date(user.emailVerified).toISOString() : null,
      image: user.image,
    })
  },

  async deleteUser(userId: string) {
    return await db.deleteUser(userId)
  },

  async linkAccount(account: any) {
    return await db.createAccount({
      userId: account.userId,
      type: account.type,
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      refresh_token: account.refresh_token,
      access_token: account.access_token,
      expires_at: account.expires_at,
      token_type: account.token_type,
      scope: account.scope,
      id_token: account.id_token,
      session_state: account.session_state,
    })
  },

  async getUserByAccount(account: any) {
    const userAccount = await db.findAccountByProviderAndAccountId(
      account.provider,
      account.providerAccountId
    )
    if (!userAccount) return null
    return await db.findUserById(userAccount.userId)
  },

  async createSession(data: any) {
    return await db.createSession({
      userId: data.userId,
      sessionToken: data.sessionToken,
      expires: new Date(data.expires).toISOString(),
    })
  },

  async getSessionAndUser(sessionToken: string) {
    const session = await db.findSessionBySessionToken(sessionToken)
    if (!session) return null
    const user = await db.findUserById(session.userId)
    if (!user) return null
    return {
      session: {
        id: session.id,
        userId: session.userId,
        sessionToken: session.sessionToken,
        expires: new Date(session.expires),
      },
      user,
    }
  },

  async updateSession(data: any) {
    return await db.updateSession(data.sessionToken, {
      expires: data.expires ? new Date(data.expires).toISOString() : undefined,
    })
  },

  async deleteSession(sessionToken: string) {
    await db.deleteSession(sessionToken)
  },

  async createVerificationToken(token: any) {
    return await db.createVerificationToken({
      identifier: token.identifier,
      token: token.token,
      expires: new Date(token.expires).toISOString(),
    })
  },

  async useVerificationToken(params: { identifier: string; token: string }) {
    const verificationToken = await db.findVerificationToken(params.identifier, params.token)
    if (!verificationToken) return null
    await db.deleteVerificationToken(params.identifier, params.token)
    return verificationToken
  },
}
