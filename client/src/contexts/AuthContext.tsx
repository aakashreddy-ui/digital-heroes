import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../../../shared/types';
import { api } from '../api/client';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSubscriber: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { email: string; password: string; full_name: string; phone?: string }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  loginAsDemo: (type: 'subscriber' | 'admin' | 'inactive' | 'winner') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('dh_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { error, success } = useToast();

  const refreshProfile = useCallback(async () => {
    try {
      if (!localStorage.getItem('dh_token')) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const profile = await api.auth.getMe();
      setUser(profile);
    } catch {
      localStorage.removeItem('dh_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login({ email, password });
      localStorage.setItem('dh_token', res.token);
      setToken(res.token);
      setUser(res.user);
      success(`Welcome back, ${res.user.full_name}!`);
    } catch (err: any) {
      error(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: { email: string; password: string; full_name: string; phone?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.auth.signup(data);
      localStorage.setItem('dh_token', res.token);
      setToken(res.token);
      setUser(res.user);
      success(`Account created! Welcome to Digital Heroes, ${res.user.full_name}!`);
    } catch (err: any) {
      error(err.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('dh_token');
    setToken(null);
    setUser(null);
    success('Logged out successfully');
  };

  const loginAsDemo = async (type: 'subscriber' | 'admin' | 'inactive' | 'winner') => {
    const creds = {
      subscriber: { email: 'subscriber@digitalheroes.test', pass: 'Password123!' },
      admin: { email: 'admin@digitalheroes.test', pass: 'Admin123!' },
      inactive: { email: 'inactive@digitalheroes.test', pass: 'Password123!' },
      winner: { email: 'winner@digitalheroes.test', pass: 'Password123!' },
    }[type];

    await login(creds.email, creds.pass);
  };

  const isAuthenticated = Boolean(user && token);
  const isSubscriber = Boolean(user?.subscription?.status === 'active' || user?.role === 'admin');
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isSubscriber,
        isAdmin,
        login,
        signup,
        logout,
        refreshProfile,
        loginAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
