import axios, { AxiosError } from 'axios';
import { getToken } from '@/shared/lib/utils/token-storage';

/** Базовый URL берём из .env (EXPO_PUBLIC_API_URL). Для дева можно fallback на localhost. */
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

/** Единый axios-инстанс */
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

/** → Request interceptor: добавляем Bearer-токен ко всем запросам */
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await getToken();
    if (token) {
      // В Axios v1 headers может быть класс AxiosHeaders -> используем .set
      const h: any = config.headers ?? {};
      if (typeof h.set === 'function') {
        h.set('Authorization', `Bearer ${token}`);
        h.set('Content-Type', h.get?.('Content-Type') ?? 'application/json');
      } else {
        config.headers = {
          ...h,
          Authorization: `Bearer ${token}`,
          'Content-Type': h['Content-Type'] ?? 'application/json',
        };
      }
    }
  } catch {
    // без токена просто идём дальше — сервер вернёт 401
  }

  if (__DEV__) {
    const method = (config.method || 'GET').toUpperCase();
    const url = `${config.baseURL}${config.url}`;
    console.log(`🌐 ${method} ${url}`);
    if (config.params) console.log('🔎 Params:', config.params);
    if (config.data) console.log('📤 Request data:', config.data);
  }
  return config;
});

/** → Response interceptor: лог + единая обработка ошибок */
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log('📥 Response:', response.data);
      console.log('📥 Status:', response.status);
    }
    return response;
  },
  (error: AxiosError<any>) => {
    if (__DEV__) {
      console.error('❌ API Error Details:');
      console.error('- Message:', error.message);
      console.error('- Code:', (error as any).code);
      console.error('- Response:', error.response?.data);
      console.error('- Status:', error.response?.status);
      console.error('- Headers:', error.response?.headers);
    }

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
      const serverMsg: string | undefined =
        typeof data === 'string' ? data : data?.message || data?.error;

      switch (status) {
        case 401:
          throw new Error(serverMsg || 'Требуется авторизация');
        case 422:
          throw new Error(serverMsg || 'Ошибка валидации данных');
        case 500:
          throw new Error(serverMsg || 'Ошибка сервера. Попробуйте позже');
        default:
          throw new Error(serverMsg || `Ошибка сервера (${status})`);
      }
    } else if (error.request) {
      if (String(error.message).toLowerCase().includes('network')) {
        throw new Error('Нет соединения с сервером');
      }
      throw new Error('Проблема сети или CORS');
    } else {
      throw new Error('Произошла ошибка запроса');
    }
  }
);

/** ===== Типы ===== */
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
  user: {
    id: number;
    email: string;
    username: string;
    uniqueId: string;
  };
}

export interface User {
  id: number;
  email: string;
  username: string;
  uniqueId: string;
}

/** ===== Auth API ===== */

/** POST /auth/login */
export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  return data;
}

/** POST /auth/register */
export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
  return data;
}

/**
 * GET /auth/me
 * Параметр token не обязателен — интерсептор и так подставит.
 * Оставлен для обратной совместимости: если передан, мы явно проставим header.
 */
export async function getCurrentUser(token?: string): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me', {
    headers: token
      ? (h => {
          // тот же трюк с AxiosHeaders
          if (typeof (h as any).set === 'function') {
            (h as any).set('Authorization', `Bearer ${token}`);
            return h;
          }
          return { ...(h || {}), Authorization: `Bearer ${token}` };
        })((apiClient.defaults.headers.common as any) ?? {})
      : undefined,
  });
  return data;
}

/**
 * POST /auth/logout (если у бэка нет — можно удалять этот метод)
 * Параметр token не обязателен — интерсептор и так подставит.
 */
export async function logout(token?: string): Promise<void> {
  await apiClient.post(
    '/auth/logout',
    {},
    {
      headers: token
        ? (h => {
            if (typeof (h as any).set === 'function') {
              (h as any).set('Authorization', `Bearer ${token}`);
              return h;
            }
            return { ...(h || {}), Authorization: `Bearer ${token}` };
          })((apiClient.defaults.headers.common as any) ?? {})
        : undefined,
    }
  );
}
