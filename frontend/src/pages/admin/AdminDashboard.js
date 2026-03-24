import React, { useState, useEffect } from 'react';
import axios from '../../lib/api';
import { API } from '../../lib/api';
import { Trophy, Users, Calendar, FileText, Crown, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import SubscriptionCard from '../../components/SubscriptionCard';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    players: 0,
    tournaments: 0,
    results: 0
  });
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchStats();
    // Check owner status and pending registrations
    axios.get(`${API}/auth/me`).then(res => {
      if (res.data.is_owner) {
        setIsOwner(true);
        axios.get(`${API}/owner/pending-registrations`).then(r => setPendingCount(r.data.length)).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const fetchStats = async () => {
    try {
      const [playersRes, tournamentsRes, resultsRes] = await Promise.all([
        axios.get(`${API}/players`),
        axios.get(`${API}/tournaments`),
        axios.get(`${API}/results`)
      ]);
      
      setStats({
        players: playersRes.data.length,
        tournaments: tournamentsRes.data.length,
        results: resultsRes.data.length
      });
    } catch (error) {
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Jogadores', value: stats.players, icon: Users, color: 'from-green-400 to-green-600' },
    { title: 'Torneios', value: stats.tournaments, icon: Calendar, color: 'from-blue-400 to-blue-600' },
    { title: 'Resultados', value: stats.results, icon: FileText, color: 'from-purple-400 to-purple-600' },
  ];

  const [migrating, setMigrating] = useState(false);
  const [migrationDone, setMigrationDone] = useState(false);

  const runMigration = async () => {
    if (!window.confirm('Isso vai atualizar todos os registros no banco (1a→1ª, etc). Fazer apenas uma vez. Continuar?')) return;
    setMigrating(true);
    try {
      const res = await axios.post(`${API}/admin/migrate-class-names`);
      toast.success(`Migração OK — ${res.data.results_updated} resultados, ${res.data.matches_updated} partidas, ${res.data.players_updated} jogadores atualizados`);
      setMigrationDone(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro na migração');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2" data-testid="admin-dashboard-title">Dashboard Administrativo</h1>
        <p className="text-gray-400">Visão geral do sistema</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : (
        <>
          {/* Owner banner */}
          {isOwner && pendingCount > 0 && (
            <div className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/40 rounded-xl px-5 py-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
                <div>
                  <p className="text-yellow-300 font-semibold">{pendingCount} cadastro{pendingCount !== 1 ? 's' : ''} aguardando aprovação</p>
                  <p className="text-yellow-400/70 text-sm">Acesse o painel Owner para aprovar ou rejeitar.</p>
                </div>
              </div>
              <Link to="/admin/owner">
                <button className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors">
                  <Crown className="w-4 h-4" />
                  Ver painel
                </button>
              </Link>
            </div>
          )}

          {/* Subscription Card */}
          <SubscriptionCard />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} className="bg-slate-800/50 border-blue-500/20" data-testid={`stat-card-${stat.title.toLowerCase()}`}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">{stat.title}</CardTitle>
                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">{stat.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Card className="bg-slate-800/50 border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-white">Bem-vindo ao Painel Administrativo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">
            Use o menu acima para gerenciar torneios, jogadores, resultados e configurações do ranking.
          </p>
         
    </div>
  );
};

export default AdminDashboard;
