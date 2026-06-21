import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loader from './Loader';

function RoleGuard({ allowedRole, children }) {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const actualRole = (user.role || '').toString().toLowerCase();
  const expectedRole = (allowedRole || '').toString().toLowerCase();

  if (actualRole !== expectedRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default RoleGuard;