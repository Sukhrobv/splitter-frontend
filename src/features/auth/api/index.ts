import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const { data } = await axios.post<AuthResponse>(`${API_URL}/auth/login`, payload);
  return data;
}

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  const { data } = await axios.post<AuthResponse>(`${API_URL}/auth/register`, payload);
  return data;
}
