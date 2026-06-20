// C:\Mauli\GradTwin\Project\food-processing-system\frontend\src\hooks\useAuth.js
import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser } from '../services/authApi';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    console.log('useAuth: refresh() called, fetching /auth/me/');
    setLoading(true);
    getCurrentUser()
      .then((res) => {
        console.log('useAuth: /auth/me/ succeeded:', res.data);
        setUser(res.data.user || res.data);
      })
      .catch((err) => {
        console.log('useAuth: /auth/me/ failed:', err.response?.status, err.response?.data);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { user, loading, refresh };
}