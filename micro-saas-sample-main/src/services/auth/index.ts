// Create a mock session for development without authentication
export async function auth() {
  // Return a mock session with a default user
  return {
    user: {
      id: "user-1",
      name: "Thiago Lima",
      email: "thiago.lima.amazoniatelecom@gmail.com",
      image: undefined,
    },
    expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
  };
}

// Mock handlers for NextAuth compatibility
export const handlers = {
  GET: () => new Response('OK'),
  POST: () => new Response('OK'),
};

// Mock signIn and signOut functions
export async function signIn() {
  return { url: '/app' };
}

export async function signOut() {
  return { url: '/auth' };
}

