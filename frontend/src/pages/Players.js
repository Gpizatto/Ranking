import React, { useState, useEffect } from 'react';
import axios from '../lib/api';
import { API } from '../lib/api';
import { Users, Search, MapPin, GraduationCap, User, Trophy, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerDetails, setPlayerDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchPlayers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredPlayers(
        players.filter(p => 
          p.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredPlayers(players);
    }
  }, [searchTerm, players]);

  const fetchPlayers = async () => {
    try {
      const response = await axios.get(`${API}/players`);
      setPlayers(response.data);
      setFilteredPlayers(response.data);
    } catch (error) {
      toast.error('Erro ao carregar jogadores');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerClick = async (player) => {
    setSelectedPlayer(player);
    setDetailsLoading(true);
    
    try {
      const response = await axios.get(`${API}/players/${player.id}/details`);
      setPlayerDetails(response.data);
    } catch (error) {
      toast.error('Erro ao carregar detalhes');
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2" data-testid="players-title">Jogadores</h1>
        <p className="text-gray-400">Todos os atletas cadastrados</p>
      </div>

      {/* Search */}
      <Card className="bg-slate-800/50 border-green-500/20">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar jogador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white"
              data-testid="player-search-input"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : filteredPlayers.length === 0 ? (
        <Card className="bg-slate-800/50 border-green-500/20">
          <CardContent className="py-12">
            <div className="text-center text-gray-400">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Nenhum jogador encontrado</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="players-grid">
          {filteredPlayers.map((player) => (
            <Card 
              key={player.id} 
              className="bg-slate-800/50 border-green-500/20 hover:border-green-400/40 transition-all cursor-pointer" 
              onClick={() => handlePlayerClick(player)}
              data-testid={`player-card-${player.id}`}
            >
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4 mb-3">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={player.photo_url} />
                    <AvatarFallback className="bg-green-500 text-white text-xl">
                      {player.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg">{player.name}</h3>
                    {player.main_class && (
                      <Badge className="bg-blue-500 mt-1">{player.main_class}</Badge>
                    )}
                  </div>
                </div>
                {player.city && (
                  <p className="text-gray-400 text-sm flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {player.city}
                  </p>
                )}
                <p className="text-sm text-green-400 mt-2">Clique para ver detalhes →</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Player Details Modal */}
      <Dialog open={!!selectedPlayer} onOpenChange={() => {
        setSelectedPlayer(null);
        setPlayerDetails(null);
      }}>
        <DialogContent className="bg-slate-800 border-green-500/20 max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedPlayer && (
            <>
              <DialogHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={selectedPlayer.photo_url} />
                    <AvatarFallback className="bg-green-500 text-white text-2xl">
                      {selectedPlayer.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-white text-2xl">{selectedPlayer.name}</DialogTitle>
                    {selectedPlayer.main_class && (
                      <Badge className="bg-blue-500 mt-1">{selectedPlayer.main_class}</Badge>
                    )}
                  </div>
                </div>
              </DialogHeader>
              
              {detailsLoading ? (
                <div className="py-12 text-center text-gray-400">Carregando detalhes...</div>
              ) : playerDetails ? (
                <div className="space-y-6">
                  {/* Info Cards */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedPlayer.city && (
                      <div className="bg-slate-900/50 rounded-lg p-4">
                        <div className="flex items-center text-gray-400 mb-1">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span className="text-sm">Cidade</span>
                        </div>
                        <p className="text-white font-semibold">{selectedPlayer.city}</p>
                      </div>
                    )}
                    {selectedPlayer.academy && (
                      <div className="bg-slate-900/50 rounded-lg p-4">
                        <div className="flex items-center text-gray-400 mb-1">
                          <GraduationCap className="w-4 h-4 mr-2" />
                          <span className="text-sm">Academia</span>
                        </div>
                        <p className="text-white font-semibold">{selectedPlayer.academy}</p>
                      </div>
                    )}
                    {selectedPlayer.coach && (
                      <div className="bg-slate-900/50 rounded-lg p-4">
                        <div className="flex items-center text-gray-400 mb-1">
                          <User className="w-4 h-4 mr-2" />
                          <span className="text-sm">Treinador</span>
                        </div>
                        <p className="text-white font-semibold">{selectedPlayer.coach}</p>
                      </div>
                    )}
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <div className="flex items-center text-gray-400 mb-1">
                        <Trophy className="w-4 h-4 mr-2" />
                        <span className="text-sm">Torneios Disputados</span>
                      </div>
                      <p className="text-white font-semibold text-2xl">{playerDetails.total_tournaments}</p>
                    </div>
                  </div>

                  {/* Rankings */}
                  {Object.keys(playerDetails.rankings).length > 0 && (
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-3 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                        Posição nos Rankings
                      </h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        {Object.values(playerDetails.rankings).map((ranking, idx) => (
                          <div key={idx} className="bg-slate-800 rounded p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-gray-400 text-sm">
                                {ranking.class} - {ranking.category}
                              </span>
                              <Badge className="bg-green-500">{ranking.points} pts</Badge>
                            </div>
                            <p className="text-white font-bold text-xl">
                              {ranking.rank}º lugar <span className="text-sm text-gray-400">de {ranking.total}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Tournaments */}
                  {playerDetails.recent_tournaments.length > 0 && (
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-3 flex items-center">
                        <Trophy className="w-5 h-5 mr-2 text-green-400" />
                        Últimos Torneios
                      </h3>
                      <div className="space-y-2">
                        {playerDetails.recent_tournaments.map((tournament, idx) => (
                          <div key={idx} className="bg-slate-800 rounded p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-white font-medium">{tournament.tournament_name}</span>
                              <span className="text-green-400 font-semibold">{tournament.points} pts</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                              <span>{format(new Date(tournament.tournament_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                              <span>•</span>
                              <span>{tournament.class_category}</span>
                              <span>•</span>
                              <span>{tournament.gender_category}</span>
                              <span>•</span>
                              <span className="text-white font-semibold">{tournament.placement}º lugar</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-400">
                  Nenhum dado disponível
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Players;
