import { User } from '../entities/User';
import { Nullable } from '@core/types';

export interface LoginCredentials {
  email: string;
  pass: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }>;
  register(params: RegisterParams): Promise<{ user: User; tokens: AuthTokens }>;
  refreshToken(token: string): Promise<AuthTokens>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<Nullable<User>>;
}
