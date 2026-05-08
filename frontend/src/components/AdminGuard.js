import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../lib/api';
import axios, { API } from '../lib/api';
import { getCached, cachedGet } from '../lib/cache';

const STATUS_URL = `${API}/auth/approval-status`;
const TTL_APPROVAL = 300; // 5 minutos

export const AdminGuard = ({ children }) => {
  // Inicializa do cache imediatamente — sem spinner se já verificou antes
  const [status, setStatus] = useState(() => {
    const token = localStorage.getItem('token');
    if (!token) return 'unauthenticated';
    const cached = getCached(STATUS_URL);
    if (cached) return cached.is_approved ? 'approved' : 'pending';
    return 'loading';
  });

  useEffect(() => {
    if (status !== 'loading') return; // cache resolveu — não precisa buscar

    const token = localStorage.getItem('token');
    if (!token) { setStatus('unauthenticated'); return; }

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    cachedGet(STATUS_URL, TTL_APPROVAL, axios)
      .then(data => {
        setStatus(data.is_approved ? 'approved' : 'pending');
      })
      .catch(err => {
        if (err?.response?.status === 401) setStatus('unauthenticated');
        else setStatus('pending');
      });
  }, []);

  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (status === 'loading') return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <p className="text-gray-400">Verificando acesso...</p>
    </div>
  );
  if (status === 'unauthenticated') return <Navigate to="/login" replace />;
  if (status === 'pending') return <Navigate to="/pending" replace />;
  return children;
};
