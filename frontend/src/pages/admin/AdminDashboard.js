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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2" data-testid="admin-dashboard-title">Dashboard Administrativo</h1>
        <p className="text-gray-400">Visão geral do sistema</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : (
        <>
          {/* Subscription Card */}
          <SubscriptionCard />

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6">
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
    </div>
  );
};

export default AdminDashboard;
