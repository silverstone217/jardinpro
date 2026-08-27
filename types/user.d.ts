export type UserRole = "MANAGER" | "EMPLOYEE" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  telephone: string;
  image: string | null;
  role: UserRole;
  createdAt: string;
}

export interface LoginCredentials {
  telephone: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
