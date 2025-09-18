import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '@/services/auth.service';

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'CLINICIAN' | 'KIOSK' | 'PUBLIC_HEALTH' | 'AUDITOR';
  facility?: string;
  department?: string;
  isActive: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'AUTH_UPDATE_USER'; payload: User };

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'AUTH_UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };

    default:
      return state;
  }
};

// Context
interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  updateUser: (user: User) => void;
  hasRole: (roles: string | string[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('kerala-health-token');
        if (token) {
          // Set token in auth service
          authService.setToken(token);
          
          // Try to get user profile
          const user = await authService.getProfile();
          dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
        } else {
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } catch (error) {
        // Token might be expired or invalid
        localStorage.removeItem('kerala-health-token');
        localStorage.removeItem('kerala-health-refresh-token');
        authService.clearToken();
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authService.login(email, password);
      const { user, token, refreshToken } = response.data;
      
      // Store tokens
      localStorage.setItem('kerala-health-token', token);
      localStorage.setItem('kerala-health-refresh-token', refreshToken);
      
      // Set token in auth service
      authService.setToken(token);
      
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Call logout endpoint if authenticated
      if (state.isAuthenticated) {
        await authService.logout();
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('kerala-health-token');
      localStorage.removeItem('kerala-health-refresh-token');
      authService.clearToken();
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Refresh token function
  const refreshToken = async (): Promise<void> => {
    try {
      const refreshTokenValue = localStorage.getItem('kerala-health-refresh-token');
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const response = await authService.refreshToken(refreshTokenValue);
      const { token } = response.data;
      
      // Update stored token
      localStorage.setItem('kerala-health-token', token);
      authService.setToken(token);
      
      // Update state with new token (user remains the same)
      if (state.user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: { user: state.user, token } });
      }
    } catch (error) {
      // Refresh failed, logout user
      await logout();
      throw error;
    }
  };

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  };

  // Update user function
  const updateUser = (user: User): void => {
    dispatch({ type: 'AUTH_UPDATE_USER', payload: user });
  };

  // Check if user has specific role(s)
  const hasRole = (roles: string | string[]): boolean => {
    if (!state.user) return false;
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(state.user.role);
  };

  // Check if user has specific permission
  const hasPermission = (permission: string): boolean => {
    if (!state.user) return false;

    // Define role-based permissions
    const rolePermissions: Record<string, string[]> = {
      ADMIN: ['*'], // Admin has all permissions
      CLINICIAN: [
        'patients:read',
        'patients:write',
        'encounters:read',
        'encounters:write',
        'observations:read',
        'observations:write',
        'immunizations:read',
        'immunizations:write',
        'files:upload',
        'qr:scan',
        'cards:generate',
      ],
      PUBLIC_HEALTH: [
        'patients:read',
        'encounters:read',
        'observations:read',
        'immunizations:read',
        'analytics:read',
        'alerts:read',
        'alerts:write',
        'reports:read',
        'surveillance:read',
      ],
      KIOSK: [
        'patients:write',
        'patients:read',
        'qr:scan',
        'cards:generate',
        'biometric:scan',
      ],
      AUDITOR: [
        'audit:read',
        'patients:read',
        'encounters:read',
        'logs:read',
      ],
    };

    const userPermissions = rolePermissions[state.user.role] || [];
    
    // Admin has all permissions
    if (userPermissions.includes('*')) return true;
    
    // Check specific permission
    return userPermissions.includes(permission);
  };

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!state.isAuthenticated || !state.token) return;

    // Try to refresh token every 30 minutes
    const interval = setInterval(async () => {
      try {
        await refreshToken();
      } catch (error) {
        console.error('Auto token refresh failed:', error);
        // User will be logged out by the refreshToken function
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [state.isAuthenticated, state.token]);

  const contextValue: AuthContextType = {
    state,
    login,
    logout,
    refreshToken,
    clearError,
    updateUser,
    hasRole,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};