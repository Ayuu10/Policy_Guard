import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api_client';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { username: string; email: string } | null;
  loading: boolean;
  login: (body: any) => Promise<void>;
  signup: (body: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (body: any) => {
    const data = await api.login(body);
    localStorage.setItem('token', data.access_token);
    const userInfo = { username: body.username, email: body.username + '@policyguard.ai' };
    localStorage.setItem('user', JSON.stringify(userInfo));
    setUser(userInfo);
    setIsAuthenticated(true);
  };

  const signup = async (body: any) => {
    await api.signup(body);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
