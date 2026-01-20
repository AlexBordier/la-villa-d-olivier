'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../../lib/types';

interface UserContextType {
  user: User | null;
  users: User[];
  login: (userId: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger la liste des utilisateurs au démarrage
  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data, error } = await supabase
          .from('app_users')
          .select('*')
          .order('username');
        
        if (error) {
          console.error('Erreur chargement utilisateurs:', error);
        } else {
          setUsers(data || []);
        }
      } catch (err) {
        console.error('Erreur inattendue:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsers();
  }, []);

  // Vérifier s'il y a une session locale (pseudo-auth)
  useEffect(() => {
    const storedUserId = localStorage.getItem('vacances_user_id');
    if (storedUserId && users.length > 0) {
      const foundUser = users.find(u => u.id === storedUserId);
      if (foundUser) {
        setUser(foundUser);
      }
    }
  }, [users]);

  const login = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('vacances_user_id', userId);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vacances_user_id');
  };

  return (
    <UserContext.Provider value={{ user, users, login, logout, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
