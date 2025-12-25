import { jsonDb } from "../json-db";

// Simple adapter for NextAuth using JSON database
export const jsonAdapter = {
  async getUser(id: string) {
    return await jsonDb.findUserById(id);
  },
  
  async getUserByEmail(email: string) {
    return await jsonDb.findUserByEmail(email);
  },
  
  async createUser(user: any) {
    return await jsonDb.createUser({
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image
    });
  },
  
  async updateUser(user: any) {
    return await jsonDb.updateUser(user.id, {
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image
    });
  },
  
  async deleteUser(userId: string) {
    // In a real implementation, you would also delete related records
    // For now, we'll just return the user that would be deleted
    return await jsonDb.findUserById(userId);
  },
  
  async linkAccount(account: any) {
    // For simplicity, we're not implementing account linking in this JSON adapter
    return null;
  },
  
  async getUserByAccount(account: any) {
    // For simplicity, we're not implementing account linking in this JSON adapter
    return null;
  },
  
  async createSession(data: any) {
    // For simplicity, sessions are not implemented in this JSON adapter
    return null;
  },
  
  async getSessionAndUser(sessionToken: string) {
    // For simplicity, sessions are not implemented in this JSON adapter
    return null;
  },
  
  async updateSession(data: any) {
    // For simplicity, sessions are not implemented in this JSON adapter
    return null;
  },
  
  async deleteSession(sessionToken: string) {
    // For simplicity, sessions are not implemented in this JSON adapter
    return null;
  },
  
  async createVerificationToken(token: any) {
    // For simplicity, verification tokens are not implemented in this JSON adapter
    return null;
  },
  
  async useVerificationToken(identifier_token: { identifier: string; token: string }) {
    // For simplicity, verification tokens are not implemented in this JSON adapter
    return null;
  },
};