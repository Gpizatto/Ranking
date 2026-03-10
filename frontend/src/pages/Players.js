import React, { useState, useEffect } from 'react';
import axios from '../lib/api';
import { API } from '../lib/api';
import { Users, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

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
            <Card key={player.id} className="bg-slate-800/50 border-green-500/20 hover:border-green-400/40 transition-all" data-testid={`player-card-${player.id}`}>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={player.photo_url} />
                    <AvatarFallback className="bg-green-500 text-white text-xl">
                      {player.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-white font-semibold text-lg">{player.name}</h3>
                    <p className="text-gray-400 text-sm">Atleta</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Players;
