import React, { useState, useEffect } from 'react';
import axios from '../../lib/api';
import { API } from '../../lib/api';
import { Trophy, Users, Calendar, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';
import SubscriptionCard from '../../components/SubscriptionCard';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    players: 0,
    tournaments: 0,
    results: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
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
        </CardContent>
      </Card>
      {/* Migração */}
      {!migrationDone && (
        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardHeader>
            <CardTitle className="text-orange-400 text-sm">🔧 Migração de Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm mb-3">
              Atualiza os registros do banco de dados para o novo formato de classes (1a → 1ª, 2a → 2ª...).
              Execute apenas uma vez após o deploy.
            </p>
            <Button
              onClick={runMigration}
              disabled={migrating}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {migrating ? 'Migrando...' : 'Executar Migração'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
