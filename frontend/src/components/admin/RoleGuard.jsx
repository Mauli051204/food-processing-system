// C:\Mauli\GradTwin\Project\food-processing-system\frontend\src\components\admin\RoleGuard.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loader from './Loader';

function RoleGuard({ allowedRole, children }) {
  const { user, loading } = useAuth();

  console.log('RoleGuard render — loading:', loading, 'user:', user);

  if (loading) return <Loader />;

  if (!user) {
    console.warn('RoleGuard: no user returned from useAuth(), redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  const actualRole = (user.role || '').toString().toLowerCase();
  const expectedRole = (allowedRole || '').toString().toLowerCase();

  if (actualRole !== expectedRole) {
    console.warn(
      `RoleGuard: role mismatch. Expected "${expectedRole}", got "${actualRole}" from user object:`,
      user
    );
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default RoleGuard;