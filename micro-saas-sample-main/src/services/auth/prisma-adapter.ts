import { prisma } from "@/lib/prisma";

// Prisma adapter for NextAuth
export const prismaAdapter = {
  async getUser(id: string) {
    return await prisma.user.findUnique({
      where: { id },
    });
  },

  async getUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
    });
  },

  async createUser(user: any) {
    return await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
        image: user.image,
        passwordHash: user.passwordHash,
        role: user.role || 'USER',
      },
    });
  },

  async updateUser(user: any) {
    return await prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
        image: user.image,
      },
    });
  },

  async deleteUser(userId: string) {
    return await prisma.user.delete({
      where: { id: userId },
    });
  },

  async linkAccount(account: any) {
    return await prisma.account.create({
      data: {
        id: account.id,
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
      },
    });
  },

  async getUserByAccount(account: any) {
    const dbAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        },
      },
      include: { user: true },
    });
    return dbAccount?.user ?? null;
  },

  async createSession(data: any) {
    return await prisma.session.create({
      data: {
        id: data.id,
        userId: data.userId,
        sessionToken: data.sessionToken,
        expires: new Date(data.expires),
      },
    });
  },

  async getSessionAndUser(sessionToken: string) {
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });
    if (!session) return null;
    return {
      user: session.user,
      session: {
        id: session.id,
        userId: session.userId,
        sessionToken: session.sessionToken,
        expires: session.expires,
      },
    };
  },

  async updateSession(data: any) {
    return await prisma.session.update({
      where: { sessionToken: data.sessionToken },
      data: {
        expires: data.expires ? new Date(data.expires) : undefined,
      },
    });
  },

  async deleteSession(sessionToken: string) {
    return await prisma.session.delete({
      where: { sessionToken },
    });
  },

  async createVerificationToken(token: any) {
    return await prisma.verificationToken.create({
      data: {
        identifier: token.identifier,
        token: token.token,
        expires: new Date(token.expires),
      },
    });
  },

  async useVerificationToken(identifier_token: { identifier: string; token: string }) {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: identifier_token.identifier,
          token: identifier_token.token,
        },
      },
    });
    if (!verificationToken) return null;
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: identifier_token.identifier,
          token: identifier_token.token,
        },
      },
    });
    return verificationToken;
  },
};
