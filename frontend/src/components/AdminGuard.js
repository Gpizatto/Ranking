import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../lib/api';

export const AdminGuard = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};
