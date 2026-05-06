import React, { useState, useEffect, useCallback } from 'react';
import axios, { API } from '../../lib/api';
import {
  Crown, UserCheck, UserX, Users, Clock, CheckCircle,
  XCircle, ShieldOff, RefreshCw, BadgeAlert
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminUsers = () => {
  const [tab, setTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, allRes] = await Promise.all([
        axios.get(`${API}/admin/pending-users`),
        axios.get(`${API}/admin/all-users`),
      ]);
      setPending(pendingRes.data);
      setAllUsers(allRes.data);
    } catch {
      toast.error('Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (username, label) => {
    setActionLoading(username + '_approve');
    try {
      await axios.post(`${API}/admin/approve-user/${encodeURIComponent(username)}`);
      toast.success(`${label} aprovado com sucesso!`);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erro ao aprovar');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (username, label) => {
    if (!window.confirm(`Revogar acesso de "${label}"?`)) return;
    setActionLoading(username + '_revoke');
    try {
      await axios.post(`${API}/admin/revoke-user/${encodeURIComponent(username)}`);
      toast.success(`Acesso de ${label} revogado.`);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erro ao revogar');
    } finally {
      setActionLoading(null);
    }
  };

  // Listas derivadas
  const approved  = allUsers.filter(u => u.is_approved && !u.is_owner);
  const blocked   = allUsers.filter(u => !u.is_approved && !u.is_owner);

  // KPIs
  const kpis = [
    { label: 'Aguardando',  value: pending.length,  color: '#92400e', alert: pending.length > 0 },
    { label: 'Aprovados',   value: approved.length, color: '#065f46' },
    { label: 'Bloqueados',  value: blocked.length,  color: '#991b1b' },
    { label: 'Total',       value: allUsers.length, color: 'var(--color-text-primary)' },
  ];

  const tabs = [
    { key: 'pending',  label: `Pendentes (${pending.length})`,  icon: Clock },
    { key: 'approved', label: `Aprovados (${approved.length})`, icon: CheckCircle },
    { key: 'blocked',  label: `Bloqueados (${blocked.length})`, icon: XCircle },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Gestão de Usuários</h1>
            <p className="text-gray-400 text-sm">Aprove ou revogue acessos administrativos</p>
          </div>
        </div>
        <Button
          onClick={fetchData}
          variant="outline"
          className="border-slate-600 text-gray-300 hover:bg-slate-700"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map(({ label, value, color, alert }) => (
          <Card key={label} className={`bg-slate-800/50 ${alert ? 'border-yellow-500/40' : 'border-blue-500/20'}`}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">{label}</span>
                {alert && <BadgeAlert className="w-4 h-4 text-yellow-400 animate-pulse" />}
              </div>
              <div className="text-2xl font-bold" style={{ color }}>{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
              tab === key
                ? 'border-blue-500 text-white bg-slate-800/50'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-slate-800/30'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {key === 'pending' && pending.length > 0 && (
              <span className="ml-1 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 opacity-50" />
          Carregando...
        </div>
      ) : (
        <>
          {/* ── PENDENTES ── */}
          {tab === 'pending' && (
            <div className="space-y-3">
              {pending.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3 opacity-60" />
                    <p className="text-gray-400">Nenhum cadastro aguardando aprovação.</p>
                  </CardContent>
                </Card>
              ) : pending.map(user => (
                <Card key={user.id} className="bg-slate-800/50 border-yellow-500/30">
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white">{user.federation_name || user.username}</span>
                          <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs">
                            Aguardando
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400">{user.username}</p>
                        <p className="text-xs text-gray-500">
                          Cadastrado em {user.created_at
                            ? format(new Date(user.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                            : '—'}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          onClick={() => handleApprove(user.username, user.federation_name || user.username)}
                          disabled={actionLoading === user.username + '_approve'}
                          className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                          size="sm"
                        >
                          <UserCheck className="w-4 h-4" />
                          {actionLoading === user.username + '_approve' ? 'Aprovando...' : 'Aprovar'}
                        </Button>
                        <Button
                          onClick={() => handleRevoke(user.username, user.federation_name || user.username)}
                          disabled={actionLoading === user.username + '_revoke'}
                          variant="outline"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10 gap-1.5"
                          size="sm"
                        >
                          <UserX className="w-4 h-4" />
                          {actionLoading === user.username + '_revoke' ? 'Rejeitando...' : 'Rejeitar'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ── APROVADOS ── */}
          {tab === 'approved' && (
            <div className="space-y-3">
              {approved.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="py-12 text-center text-gray-400">
                    Nenhuma conta aprovada ainda.
                  </CardContent>
                </Card>
              ) : approved.map(user => (
                <Card key={user.id} className="bg-slate-800/50 border-green-500/20">
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white">{user.federation_name || user.username}</span>
                          <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 text-xs">
                            Aprovado
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400">{user.username}</p>
                        <p className="text-xs text-gray-500">
                          Cadastrado em {user.created_at
                            ? format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR })
                            : '—'}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleRevoke(user.username, user.federation_name || user.username)}
                        disabled={actionLoading === user.username + '_revoke'}
                        variant="outline"
                        className="border-red-500/40 text-red-400 hover:bg-red-500/10 gap-1.5 shrink-0"
                        size="sm"
                      >
                        <ShieldOff className="w-4 h-4" />
                        {actionLoading === user.username + '_revoke' ? 'Revogando...' : 'Revogar acesso'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ── BLOQUEADOS ── */}
          {tab === 'blocked' && (
            <div className="space-y-3">
              {blocked.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="py-12 text-center text-gray-400">
                    Nenhuma conta bloqueada.
                  </CardContent>
                </Card>
              ) : blocked.map(user => (
                <Card key={user.id} className="bg-slate-800/50 border-red-500/20">
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white">{user.federation_name || user.username}</span>
                          <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs">
                            Bloqueado
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400">{user.username}</p>
                      </div>
                      <Button
                        onClick={() => handleApprove(user.username, user.federation_name || user.username)}
                        disabled={actionLoading === user.username + '_approve'}
                        className="bg-green-600 hover:bg-green-700 text-white gap-1.5 shrink-0"
                        size="sm"
                      >
                        <UserCheck className="w-4 h-4" />
                        {actionLoading === user.username + '_approve' ? 'Reativando...' : 'Reativar'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminUsers;
