import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, type AuthUser } from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await authAPI.getMe();
          setUser(response.data);
        } catch (error) {
          // Token might be expired, try to refresh
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const refreshResponse = await authAPI.refreshToken();
              localStorage.setItem('accessToken', refreshResponse.data.accessToken);
              localStorage.setItem('refreshToken', refreshResponse.data.refreshToken);
              const meResponse = await authAPI.getMe();
              setUser(meResponse.data);
            } catch {
              // Refresh failed, clear tokens
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
            }
          }
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authAPI.login({ email, password });
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    setUser(response.data.user);
  };

  const register = async (data: { email: string; password: string; name: string; phone?: string }) => {
    const response = await authAPI.register(data);
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    setUser(response.data.user);
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const updateProfile = async (data: Partial<AuthUser>) => {
    const response = await authAPI.updateProfile(data as any);
    setUser(response.data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
