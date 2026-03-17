import React, { useState, useEffect, useMemo } from "react";
import axios from "../lib/api";

import { Users, Search, MapPin } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";

const PlayerCard = React.memo(({ player, onClick }) => {
  return (
    <Card
      className="bg-slate-800/50 border-green-500/20 hover:border-green-400/40 transition-all cursor-pointer"
      onClick={() => onClick(player)}
    >
      <CardContent className="pt-6">
        <div className="flex items-center space-x-4 mb-3">
          <Avatar className="w-16 h-16">
            <AvatarImage src={player.photo_url} loading="lazy" />
            <AvatarFallback className="bg-green-500 text-white text-xl">
              {player.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg">
              {player.name}
            </h3>

            {player.main_class && (
              <Badge className="bg-blue-500 mt-1">
                {player.main_class}
              </Badge>
            )}
          </div>
        </div>

        {player.city && (
          <p className="text-gray-400 text-sm flex items-center">
            <MapPin className="w-3 h-3 mr-1" />
            {player.city}
          </p>
        )}
      </CardContent>
    </Card>
  );
});

const Players = () => {


  const [players, setPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerDetails, setPlayerDetails] = useState(null);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await axios.get(`${API}/players`);

      setPlayers(response.data);
    } catch (error) {
      toast.error("Erro ao carregar jogadores");
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = useMemo(() => {
    if (!searchTerm) return players.slice(0, 50);

    return players
      .filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 50);
  }, [searchTerm, players]);

  const handlePlayerClick = async (player) => {
    setSelectedPlayer(player);

    try {
      const response = await axios.get(
        `${API}/players/${player.id}/details`
      );

      setPlayerDetails(response.data);
    } catch {
      toast.error("Erro ao carregar detalhes");
    }
  };

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-4xl font-bold text-white mb-2">
          Jogadores
        </h1>

        <p className="text-gray-400">
          Todos os atletas cadastrados
        </p>
      </div>

      <Card className="bg-slate-800/50 border-green-500/20">
        <CardContent className="pt-6">

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

            <Input
              placeholder="Buscar jogador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white"
            />
          </div>

        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-gray-400">
          Carregando...
        </div>
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

          {filteredPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onClick={handlePlayerClick}
            />
          ))}

        </div>
      )}

      <Dialog
        open={!!selectedPlayer}
        onOpenChange={() => {
          setSelectedPlayer(null);
          setPlayerDetails(null);
        }}
      >
        <DialogContent className="bg-slate-800 border-green-500/20 max-w-3xl">

          {selectedPlayer && (
            <div className="space-y-4">

              <div className="flex items-center space-x-4">

                <Avatar className="w-20 h-20">
                  <AvatarImage src={selectedPlayer.photo_url} />
                  <AvatarFallback className="bg-green-500 text-white text-2xl">
                    {selectedPlayer.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <h2 className="text-white text-2xl font-bold">
                    {selectedPlayer.name}
                  </h2>

                  {selectedPlayer.main_class && (
                    <Badge className="bg-blue-500 mt-1">
                      {selectedPlayer.main_class}
                    </Badge>
                  )}
                </div>

              </div>

              {playerDetails ? (
                <div className="text-gray-300">
                  Detalhes carregados
                </div>
              ) : (
                <div className="text-gray-400">
                  Carregando detalhes...
                </div>
              )}

            </div>
          )}

        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Players;
