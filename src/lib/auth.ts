// Temporary auth utilities for development
// This will be replaced with proper authentication later

export type UserRole = "admin" | "member";

export function auth() {
  // Return a mock user for development
  return {
    userId: 'mock-user-id',
    getToken: async () => 'mock-token',
    isSignedIn: true,
  };
}

export async function currentUser() {
  // Return a mock user for development
  return {
    id: 'mock-user-id',
    firstName: 'Test',
    lastName: 'User',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    publicMetadata: { role: 'admin' },
  };
}

export async function requireAuth() {
  const { userId } = auth();
  
  // No redirect for now
  return userId;
}

export async function requireAdmin() {
  const userId = await requireAuth();
  
  // In a real app, we would fetch the user's role from our database
  // For now, we'll assume the user is an admin for demo purposes
  const user = await currentUser();
  const isAdmin = user?.publicMetadata?.role === "admin";
  
  // No redirect for now
  return userId;
}

export async function getUserRole(): Promise<UserRole> {
  const user = await currentUser();
  return (user?.publicMetadata?.role as UserRole) || "member";
}

export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === "admin";
}

export async function useHasPermission(requiredRole: UserRole = "member"): Promise<boolean> {
  const role = await getUserRole();
  
  if (requiredRole === "admin") {
    return role === "admin";
  }
  
  // A user with any role can access member resources
  return !!role;
} 