import { useState, useEffect } from 'react';
import { User } from '../types';
import { getCurrentUser } from '../api/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored) as User;
      setUser(parsed);
      // Refresh from API if needed
      getCurrentUser()
        .then((freshUser) => {
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        })
        .catch(() => {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const isLandlord = user?.vai_tro === 'CHU_TRO' || user?.vai_tro === 'ADMIN';
  const isTenant = user?.vai_tro === 'NGUOI_THUE';

  return {
    user,
    isLandlord,
    isTenant,
    loading,
    login: (userData: User) => {
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    },
    logout: () => {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };
}
