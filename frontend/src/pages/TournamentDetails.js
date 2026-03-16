import React, { useState, useEffect, useCallback } from 'react';
import axios from '../lib/api';
import { useFederation } from '../context/FederationContext';
import { Trophy, Medal, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

const CLASSES = ['1a', '2a', '3a', '4a', '5a', '6a', 'Duplas'];
const CATEGORIES = ['Masculino', 'Feminino'];

const Rankings = () => {

  const { API } = useFederation();

  const [rankings, setRankings] = useState([]);
  const [selectedClass, setSelectedClass] = useState('1a');
  const [selectedCategory, setSelectedCategory] = useState('Masculino');

  const [loading, setLoading] = useState(false);

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerDetails, setPlayerDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [logoBase64, setLogoBase64] = useState('');

  /*
  =========================
  FETCH RANKINGS OTIMIZADO
  =========================
  */

  const fetchRankings = useCallback(async () => {

    setLoading(true);

    try {

      const response = await axios.get(
        `${API}/rankings?class_category=${selectedClass}&gender_category=${selectedCategory}`
      );

      setRankings(response.data);

    } catch (error) {

      toast.error('Erro ao carregar rankings');

    } finally {

      setLoading(false);

    }

  }, [API, selectedClass, selectedCategory]);

  useEffect(() => {

    fetchRankings();

  }, [fetchRankings]);

  /*
  =========================
  CONVERTER LOGO PARA BASE64
  =========================
  */

  useEffect(() => {

    const img = new Image();

    img.crossOrigin = 'anonymous';

    img.onload = () => {

      const canvas = document.createElement('canvas');

      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');

      ctx.drawImage(img, 0, 0);

      setLogoBase64(canvas.toDataURL('image/jpeg'));

    };

    img.src = '/fsp.jpeg';

  }, []);

  /*
  =========================
  PLAYER CLICK OTIMIZADO
  =========================
  */

  const handlePlayerClick = async (player) => {

    setSelectedPlayer(player);

    setDetailsLoading(true);

    try {

      const detailsResponse = await axios.get(
        `${API}/players/${player.player_id}/details`
      );

      setPlayerDetails(detailsResponse.data);

    } catch (error) {

      toast.error('Erro ao carregar detalhes do jogador');

    } finally {

      setDetailsLoading(false);

    }

  };

  /*
  =========================
  GERAR IMAGEM
  =========================
  */

  const generateTop10Image = async () => {

    const element = document.getElementById('top10-card');

    if (!element) return;

    try {

      const canvas = await html2canvas(element, {
        backgroundColor: '#0a1628',
        scale: 2,
        useCORS: true
      });

      const link = document.createElement('a');

      link.download = `top10-${selectedClass}-${selectedCategory}.png`;

      link.href = canvas.toDataURL('image/png');

      link.click();

      toast.success('Imagem gerada com sucesso!');

    } catch {

      toast.error('Erro ao gerar imagem');

    }

  };

  const top10 = rankings.slice(0, 10);
  const top5 = rankings.slice(0, 5);

  return (

    <div className="space-y-8">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-4xl font-bold text-white mb-2">
            Rankings Oficiais
          </h1>

          <p className="text-gray-400">
            Classificação atualizada dos jogadores
          </p>

        </div>

        <Button
          onClick={generateTop10Image}
          className="bg-purple-500 hover:bg-purple-600"
        >

          <Download className="w-4 h-4 mr-2" />

          Gerar Imagem Top 10

        </Button>

      </div>

      {/* FILTERS */}

      <div className="grid md:grid-cols-2 gap-4">

        <Card className="bg-slate-800/50">

          <CardHeader>
            <CardTitle className="text-white">Classe</CardTitle>
          </CardHeader>

          <CardContent>

            <div className="flex flex-wrap gap-2">

              {CLASSES.map((cls) => (

                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedClass === cls
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-700 text-gray-300'
                  }`}
                >

                  {cls}

                </button>

              ))}

            </div>

          </CardContent>

        </Card>

        <Card className="bg-slate-800/50">

          <CardHeader>
            <CardTitle className="text-white">Categoria</CardTitle>
          </CardHeader>

          <CardContent>

            <div className="flex gap-2">

              {CATEGORIES.map((cat) => (

                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold ${
                    selectedCategory === cat
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700 text-gray-300'
                  }`}
                >

                  {cat}

                </button>

              ))}

            </div>

          </CardContent>

        </Card>

      </div>

      {/* TOP 5 */}

      {!loading && rankings.length > 0 && (

        <div className="grid grid-cols-5 gap-3">

          {top5.map((player, index) => (

            <div
              key={player.player_id}
              onClick={() => handlePlayerClick(player)}
              className="cursor-pointer"
            >

              {player.photo_url ? (

                <img
                  src={player.photo_url}
                  alt={player.player_name}
                  loading="lazy"
                  className="w-full h-60 object-cover rounded-lg"
                />

              ) : (

                <div className="h-60 bg-slate-700 flex items-center justify-center rounded-lg">
                  {player.player_name.charAt(0)}
                </div>

              )}

              <div className="mt-2 text-white font-bold">
                {player.player_name}
              </div>

              <div className="text-green-400">
                {player.total_points} pts
              </div>

            </div>

          ))}

        </div>

      )}

      {/* TABELA */}

      <Card className="bg-slate-800/50">

        <CardHeader>

          <CardTitle className="text-white">
            Ranking Completo
          </CardTitle>

        </CardHeader>

        <CardContent>

          {loading ? (

            <div className="text-center text-gray-400">
              Carregando...
            </div>

          ) : (

            <table className="w-full">

              <tbody>

                {rankings.map((player, index) => (

                  <tr
                    key={player.player_id}
                    className="border-b border-slate-700 cursor-pointer"
                    onClick={() => handlePlayerClick(player)}
                  >

                    <td className="py-3 px-2 text-white">
                      {index + 1}
                    </td>

                    <td className="py-3 px-2 text-white">
                      {player.player_name}
                    </td>

                    <td className="py-3 px-2 text-green-400 text-right">
                      {player.total_points}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          )}

        </CardContent>

      </Card>

      {/* MODAL PLAYER */}

      <Dialog
        open={!!selectedPlayer}
        onOpenChange={() => {
          setSelectedPlayer(null);
          setPlayerDetails(null);
        }}
      >

        <DialogContent className="bg-slate-800">

          {selectedPlayer && (

            <>
              <DialogHeader>

                <DialogTitle className="text-white text-2xl">
                  {selectedPlayer.player_name}
                </DialogTitle>

              </DialogHeader>

              {detailsLoading ? (

                <div className="text-gray-400">
                  Carregando detalhes...
                </div>

              ) : (

                <pre className="text-gray-300 text-sm">
                  {JSON.stringify(playerDetails, null, 2)}
                </pre>

              )}

            </>

          )}

        </DialogContent>

      </Dialog>

    </div>

  );

};

export default Rankings;