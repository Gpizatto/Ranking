import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../lib/api';
import { API } from '../lib/api';
import { Calendar, MapPin, Trophy, Medal, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Tournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await axios.get(`${API}/tournaments`);
      setTournaments(response.data);
    } catch (error) {
      toast.error('Erro ao carregar torneios');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2" data-testid="tournaments-title">Torneios</h1>
        <p className="text-gray-400">Histórico de torneios disputados</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : tournaments.length === 0 ? (
        <Card className="bg-slate-800/50 border-green-500/20">
          <CardContent className="py-12">
            <div className="text-center text-gray-400">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Nenhum torneio cadastrado</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="tournaments-grid">
          {tournaments.map((tournament) => (
            <Link key={tournament.id} to={`/tournaments/${tournament.id}`}>
              <Card 
                className="bg-slate-800/50 border-green-500/20 hover:border-green-400/40 transition-all cursor-pointer h-full" 
                data-testid={`tournament-card-${tournament.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-white flex-1">{tournament.name}</CardTitle>
                    <Badge 
                      className={tournament.is_completed ? 'bg-green-500' : 'bg-yellow-500'}
                    >
                      {tournament.is_completed ? (
                        <><CheckCircle className="w-3 h-3 mr-1 inline" />Concluído</>
                      ) : (
                        <><Clock className="w-3 h-3 mr-1 inline" />Em andamento</>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center text-gray-400">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{format(new Date(tournament.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                  </div>
                  {tournament.location && (
                    <div className="flex items-center text-gray-400">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{tournament.location}</span>
                    </div>
                  )}
                  <p className="text-sm text-green-400 mt-2">Clique para ver detalhes →</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tournaments;
