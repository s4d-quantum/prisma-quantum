import React, { createContext, useContext } from 'react';

// Simple mock user for development
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Simple auth context without actual authentication
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Mock user for development - no actual authentication
  const user: User = {
    id: "1",
    name: "Developer",
    email: "developer@example.com",
    role: "admin"
  };

  // Always return true for isAuthenticated since we're removing auth
  const isAuthenticated = true;

  // Provide the mock user and auth status
  const contextValue: AuthContextType = {
    user,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};