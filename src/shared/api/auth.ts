import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://example.com';

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    uniqueId: string;
  };
}

export async function login(username: string, password: string) {
  const { data } = await axios.post<AuthResponse>(`${API_URL}/auth/login`, {
    username,
    password,
  });
  return data;
}

export async function register(
  username: string,
  email: string,
  password: string,
) {
  const { data } = await axios.post<AuthResponse>(`${API_URL}/auth/register`, {
    username,
    email,
    password,
  });
  return data;
}
