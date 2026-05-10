export type UserRole = 'passenger' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
}