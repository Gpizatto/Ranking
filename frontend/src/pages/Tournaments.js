import React, { useState, useEffect } from 'react';
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
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tournamentResults, setTournamentResults] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);

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

  const handleTournamentClick = async (tournament) => {
    setSelectedTournament(tournament);
    setResultsLoading(true);
    
    try {
      const response = await axios.get(`${API}/tournaments/${tournament.id}/results`);
      setTournamentResults(response.data);
    } catch (error) {
      toast.error('Erro ao carregar resultados');
    } finally {
      setResultsLoading(false);
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
            <Card 
              key={tournament.id} 
              className="bg-slate-800/50 border-green-500/20 hover:border-green-400/40 transition-all cursor-pointer" 
              onClick={() => handleTournamentClick(tournament)}
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
                <p className="text-sm text-green-400 mt-2">Clique para ver resultados →</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results Modal */}
      <Dialog open={!!selectedTournament} onOpenChange={() => {
        setSelectedTournament(null);
        setTournamentResults(null);
      }}>
        <DialogContent className="bg-slate-800 border-green-500/20 max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">
              {selectedTournament?.name}
            </DialogTitle>
            {selectedTournament && (
              <div className="flex items-center gap-4 text-gray-400 text-sm">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {format(new Date(selectedTournament.date), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
                {selectedTournament.location && (
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {selectedTournament.location}
                  </span>
                )}
              </div>
            )}
          </DialogHeader>
          
          {resultsLoading ? (
            <div className="py-12 text-center text-gray-400">Carregando resultados...</div>
          ) : tournamentResults && tournamentResults.results.length > 0 ? (
            <div className="space-y-6">
              {tournamentResults.results.map((group, idx) => (
                <div key={idx} className="bg-slate-900/50 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3 flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-green-400" />
                    {group.class} - {group.category}
                  </h3>
                  <div className="space-y-2">
                    {group.results.map((result, ridx) => (
                      <div 
                        key={ridx} 
                        className="flex items-center justify-between p-3 bg-slate-800 rounded"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 flex items-center justify-center">
                            {result.placement === 1 && <Trophy className="w-6 h-6 text-yellow-400" />}
                            {result.placement === 2 && <Medal className="w-6 h-6 text-gray-300" />}
                            {result.placement === 3 && <Medal className="w-6 h-6 text-orange-400" />}
                            {result.placement > 3 && (
                              <span className="text-lg font-bold text-gray-400">{result.placement}º</span>
                            )}
                          </div>
                          <span className="text-white font-medium">{result.player_name}</span>
                        </div>
                        <span className="text-green-400 font-semibold">{result.points} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400">
              Nenhum resultado cadastrado para este torneio
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tournaments;
