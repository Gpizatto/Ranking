import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../lib/api';
import axios, { API } from '../lib/api';

export const AdminGuard = ({ children }) => {
  const [status, setStatus] = useState('loading'); // loading | approved | pending

  useEffect(() => {
    // Garante que o token está no header ANTES de qualquer chamada
    const token = localStorage.getItem('token');
    if (!token) {
      setStatus('unauthenticated');
      return;
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    axios.get(`${API}/auth/approval-status`)
      .then(res => {
        setStatus(res.data.is_approved ? 'approved' : 'pending');
      })
      .catch((err) => {
        // 401 = token inválido/expirado → mandar para login
        // Qualquer outro erro → assumir pendente
        if (err?.response?.status === 401) {
          setStatus('unauthenticated');
        } else {
          setStatus('pending');
        }
      });
  }, []);

  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (status === 'loading') return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <p className="text-gray-400">Verificando acesso...</p>
    </div>
  );
  if (status === 'pending') return <Navigate to="/pending" replace />;
  return children;
};
