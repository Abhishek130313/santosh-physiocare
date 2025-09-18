import axios, { AxiosResponse } from 'axios';
import { User } from '@/contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kerala-health-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('kerala-health-refresh-token');
        if (refreshToken) {
          const response = await authService.refreshToken(refreshToken);
          const { token } = response.data;
          
          localStorage.setItem('kerala-health-token', token);
          authService.setToken(token);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('kerala-health-token');
        localStorage.removeItem('kerala-health-refresh-token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth service interface
interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
    refreshToken: string;
  };
}

interface RefreshTokenResponse {
  success: boolean;
  data: {
    token: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const authService = {
  // Set token for API requests
  setToken: (token: string): void => {
    localStorage.setItem('kerala-health-token', token);
  },

  // Clear token
  clearToken: (): void => {
    localStorage.removeItem('kerala-health-token');
    localStorage.removeItem('kerala-health-refresh-token');
  },

  // Get current token
  getToken: (): string | null => {
    return localStorage.getItem('kerala-health-token');
  },

  // Login
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response: AxiosResponse<LoginResponse> = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response: AxiosResponse<RefreshTokenResponse> = await api.post('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  // Get user profile
  getProfile: async (): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.get('/auth/profile');
    return response.data.data;
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  // Register new user (admin only)
  register: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    licenseNumber?: string;
    facility?: string;
    department?: string;
  }): Promise<ApiResponse<{ user: User }>> => {
    const response: AxiosResponse<ApiResponse<{ user: User }>> = await api.post('/auth/register', userData);
    return response.data;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('kerala-health-token');
    return !!token;
  },

  // Get user role from token (client-side check only)
  getUserRole: (): string | null => {
    const token = localStorage.getItem('kerala-health-token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || null;
    } catch (error) {
      return null;
    }
  },

  // Check if token is expired (client-side check)
  isTokenExpired: (): boolean => {
    const token = localStorage.getItem('kerala-health-token');
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  },
};

export default api;