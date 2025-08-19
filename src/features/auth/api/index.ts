import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
apiClient.interceptors.request.use((config) => {
  if (__DEV__) {
    console.log(`🌐 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    if (config.data) {
      console.log('📤 Request data:', config.data);
    }
  }
  return config;
});

// Add response interceptor for debugging and error handling
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log('📥 Response:', response.data);
      console.log('📥 Status:', response.status);
    }
    return response;
  },
  (error) => {
    if (__DEV__) {
      console.error('❌ API Error Details:');
      console.error('- Message:', error.message);
      console.error('- Code:', error.code);
      console.error('- Response:', error.response?.data);
      console.error('- Status:', error.response?.status);
      console.error('- Headers:', error.response?.headers);
    }
    
    // Handle common errors
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 401:
          throw new Error('Неверные учетные данные');
        case 422:
          throw new Error(data.message || 'Ошибка валидации данных');
        case 500:
          throw new Error('Ошибка сервера. Попробуйте позже');
        default:
          throw new Error(data.message || `Ошибка сервера (${status})`);
      }
    } else if (error.request) {
      // CORS or network error
      if (error.message.includes('CORS') || error.message.includes('Network Error')) {
        throw new Error('Проблема с CORS или сетью. Обратитесь к разработчику бэкенда');
      }
      throw new Error('Нет соединения с сервером');
    } else {
      throw new Error('Произошла ошибка запроса');
    }
  }
);

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

// Auth API functions
export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  return data;
}

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
  return data;
}

export async function getCurrentUser(token: string): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
}

export async function logout(token: string): Promise<void> {
  await apiClient.post('/auth/logout', {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Export configured axios instance for other modules
export { apiClient };