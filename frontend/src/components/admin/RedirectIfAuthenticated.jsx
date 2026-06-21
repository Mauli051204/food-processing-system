import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loader from './Loader';

const ROLE_DASHBOARDS = {
  admin: '/admin/dashboard',
  vendor: '/vendor/dashboard',
  purchase: '/purchase/dashboard',
  tech: '/tech/dashboard',
  production: '/production/dashboard',
};

function RedirectIfAuthenticated({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;

  if (user) {
    const role = (user.role || '').toLowerCase();
    return <Navigate to={ROLE_DASHBOARDS[role] || '/'} replace />;
  }

  return children;
}

export default RedirectIfAuthenticated;