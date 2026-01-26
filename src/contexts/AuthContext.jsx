import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing cookie/token on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Since we use httpOnly cookies, we can't read the token via JS easily.
        // However, we could have a /api/auth/me endpoint to verify the session.
        // For now, let's just check if we have a locally stored user preference or wait for 401.
        const storedToken = localStorage.getItem('auth_token');
        if (storedToken) {
          setToken(storedToken);
          // Optional: Verify token with backend
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem('auth_token', newToken);
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('auth_token');
    // Clear cookie via backend if needed
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout }}>
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
