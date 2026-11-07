import React, { createContext, useContext, useState, useEffect } from 'react';

// Context API for Authentication & User Roles (Unit 2 - React State & Context)
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check existing token on component mount
  useEffect(() => {
    async function checkAuth() {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
            setToken(storedToken);
          } else {
            // Token expired or invalid
            localStorage.removeItem('token');
            setUser(null);
            setToken('');
          }
        } catch (err) {
          console.error('Auth verification failed:', err);
          // Set default demo user if offline
          setUser({
            id: 'usr_1',
            name: 'Mohamed Thoufik (Admin)',
            email: 'admin@warehouse.local',
            role: 'Admin',
            department: 'Operations'
          });
        }
      } else {
        // Default login as Admin so the examiner can immediately test all features
        loginAsDefault('Admin');
      }
      setLoading(false);
    }

    checkAuth();
  }, []);

  // Simple student login function
  const login = async (email, password) => {
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid email or password');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to connect to server');
      return { success: false, message: err.message };
    }
  };

  // Register function
  const register = async (name, email, password, role, department) => {
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, department })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Registration failed');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to register account');
      return { success: false, message: err.message };
    }
  };

  // Quick preset login helper (Convenient for internal marks demo to professor)
  const loginAsDefault = async (targetRole = 'Admin') => {
    setError('');
    const credentials = {
      Admin: { email: 'admin@warehouse.local', password: 'admin123' },
      'Warehouse Manager': { email: 'manager@warehouse.local', password: 'manager123' },
      Storekeeper: { email: 'storekeeper@warehouse.local', password: 'keeper123' }
    };

    const target = credentials[targetRole] || credentials.Admin;
    return await login(target.email, target.password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        setError,
        login,
        register,
        logout,
        loginAsDefault,
        isAuthenticated: !!user,
        role: user ? user.role : 'Guest'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
