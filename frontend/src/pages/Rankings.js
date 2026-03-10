import React, { useState, useEffect } from 'react';
import axios from '../lib/api';
import { API } from '../lib/api';
import { Trophy, Medal, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

const CLASSES = ['1a', '2a', '3a', '4a', '5a', '6a', 'Duplas'];
const CATEGORIES = ['Masculino', 'Feminino'];

const Rankings = () => {
  const [rankings, setRankings] = useState([]);
  const [selectedClass, setSelectedClass] = useState('1a');
  const [selectedCategory, setSelectedCategory] = useState('Masculino');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRankings();
  }, [selectedClass, selectedCategory]);

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/rankings?class_category=${selectedClass}&gender_category=${selectedCategory}`);
      setRankings(response.data);
    } catch (error) {
      toast.error('Erro ao carregar rankings');
    } finally {
      setLoading(false);
    }
  };

  const generateTop10Image = async () => {
    const element = document.getElementById('top10-card');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#0f172a',
        scale: 2
      });
      
      const link = document.createElement('a');
      link.download = `top10-${selectedClass}-${selectedCategory}.png`;
      link.href = canvas.toDataURL();
      link.click();
      toast.success('Imagem gerada com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar imagem');
    }
  };

  const top10 = rankings.slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2" data-testid="rankings-title">Rankings Oficiais</h1>
          <p className="text-gray-400">Classificação atualizada dos jogadores</p>
        </div>
        <Button onClick={generateTop10Image} className="bg-purple-500 hover:bg-purple-600" data-testid="generate-image-button">
          <Download className="w-4 h-4 mr-2" />
          Gerar Imagem Top 10
        </Button>
      </div>

      {/* Filters */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-slate-800/50 border-green-500/20">
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
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                  data-testid={`class-filter-${cls}`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-white">Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                  data-testid={`category-filter-${cat}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rankings Table */}
      <Card className="bg-slate-800/50 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-white text-2xl">
            Ranking {selectedClass} - {selectedCategory}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-400">Carregando...</div>
          ) : rankings.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Nenhum resultado encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="rankings-table">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Posição</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Jogador</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-semibold">Pontos</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-semibold">Torneios</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((player, index) => (
                    <tr
                      key={player.player_id}
                      className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                      data-testid={`ranking-row-${index}`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          {index === 0 && <Trophy className="w-5 h-5 text-yellow-400 mr-2" />}
                          {index === 1 && <Medal className="w-5 h-5 text-gray-300 mr-2" />}
                          {index === 2 && <Medal className="w-5 h-5 text-orange-400 mr-2" />}
                          <span className="text-white font-bold text-lg">{player.rank}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={player.photo_url} />
                            <AvatarFallback className="bg-green-500 text-white">
                              {player.player_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-white font-medium">{player.player_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-green-400 font-bold text-lg">{player.total_points}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-gray-400">{player.results_count}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden Top 10 Card for Image Generation */}
      <div id="top10-card" className="fixed -left-[9999px] w-[800px] bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-lg border-2 border-green-500">
        <div className="text-center mb-6">
          <h2 className="text-4xl font-bold text-white mb-2">TOP 10</h2>
          <p className="text-xl text-green-400">{selectedClass} - {selectedCategory}</p>
          <p className="text-sm text-gray-400 mt-2">Federação de Squash do Paraná</p>
        </div>
        <div className="space-y-3">
          {top10.map((player, index) => (
            <div key={player.player_id} className="flex items-center bg-slate-800/50 p-4 rounded-lg">
              <div className="w-12 h-12 flex items-center justify-center">
                {index === 0 && <Trophy className="w-8 h-8 text-yellow-400" />}
                {index === 1 && <Medal className="w-8 h-8 text-gray-300" />}
                {index === 2 && <Medal className="w-8 h-8 text-orange-400" />}
                {index > 2 && <span className="text-2xl font-bold text-gray-400">{index + 1}</span>}
              </div>
              <Avatar className="w-12 h-12 mx-4">
                <AvatarImage src={player.photo_url} />
                <AvatarFallback className="bg-green-500 text-white text-lg">
                  {player.player_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-white font-medium text-lg flex-1">{player.player_name}</span>
              <span className="text-green-400 font-bold text-xl">{player.total_points} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Rankings;
