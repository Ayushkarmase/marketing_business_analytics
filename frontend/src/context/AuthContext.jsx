import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState({
    id: 1,
    email: 'owner@aurora.com',
    full_name: 'Business Owner',
    role: 'business_owner'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getCurrentUser()
      .then(res => {
        if (res.user) setCurrentUser(res.user);
      })
      .catch(err => console.warn('User fetch notice:', err));
  }, []);

  const switchRole = async (newRole) => {
    try {
      const res = await api.switchRole(newRole);
      if (res.user) setCurrentUser(res.user);
    } catch (e) {
      // Local fallback for role simulation
      setCurrentUser(prev => ({
        ...prev,
        role: newRole,
        full_name: newRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
      }));
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, switchRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
