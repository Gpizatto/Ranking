import React, { useState, useEffect, useRef } from 'react';
import axios from '../lib/api';
import { API } from '../lib/api';
import { Trophy, Medal, Download, MapPin, GraduationCap, User, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CLASSES = ['1a', '2a', '3a', '4a', '5a', '6a', 'Duplas'];
const CATEGORIES = ['Masculino', 'Feminino'];

const Rankings = () => {

  const [rankings, setRankings] = useState([]);
  const [selectedClass, setSelectedClass] = useState('1a');
  const [selectedCategory, setSelectedCategory] = useState('Masculino');
  const [loading, setLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerDetails, setPlayerDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  // Logo em base64 para funcionar no html2canvas
  const [logoBase64, setLogoBase64] = useState('');

  useEffect(() => {
    fetchRankings();
  }, [selectedClass, selectedCategory]);

  // Converte a logo para base64 ao montar o componente
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      setLogoBase64(canvas.toDataURL('image/jpeg'));
    };
    img.src = '/fsp.jpeg';
  }, []);

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

  const handlePlayerClick = async (playerId) => {
    setDetailsLoading(true);
    try {
      const playersResponse = await axios.get(`${API}/players`);
      const player = playersResponse.data.find(p => p.id === playerId);
      if (player) {
        setSelectedPlayer(player);
        const detailsResponse = await axios.get(`${API}/players/${playerId}/details`);
        setPlayerDetails(detailsResponse.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar detalhes do jogador');
    } finally {
      setDetailsLoading(false);
    }
  };

  const generateTop10Image = async () => {
    const element = document.getElementById('top10-card');
    if (!element) return;
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#0a1628',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `top10-${selectedClass}-${selectedCategory}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Imagem gerada com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar imagem');
    }
  };

  const top10 = rankings.slice(0, 10);
  const top5 = rankings.slice(0, 5);

  return (
    <div className="space-y-8">
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
          <CardHeader><CardTitle className="text-white">Classe</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {CLASSES.map((cls) => (
                <button key={cls} onClick={() => setSelectedClass(cls)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${selectedClass === cls ? 'bg-green-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
                  data-testid={`class-filter-${cls}`}>{cls}</button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-blue-500/20">
          <CardHeader><CardTitle className="text-white">Categoria</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${selectedCategory === cat ? 'bg-blue-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
                  data-testid={`category-filter-${cat}`}>{cat}</button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Cards */}
      {!loading && rankings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-white">Top Players</h2>
            <Badge className="bg-green-500 text-white px-3 py-1">{selectedClass} - {selectedCategory}</Badge>
          </div>
          <div className="grid grid-cols-5 gap-3 items-end">
            {top5.map((player, index) => {
              const borderColors = ['border-yellow-400', 'border-gray-300', 'border-orange-400', 'border-blue-400', 'border-green-400'];
              const badgeBg = ['bg-yellow-400 text-yellow-900', 'bg-gray-300 text-gray-900', 'bg-orange-400 text-orange-900', 'bg-blue-400 text-blue-900', 'bg-green-400 text-green-900'];
              const heights = ['h-[420px]', 'h-[380px]', 'h-[380px]', 'h-[340px]', 'h-[340px]'];
              return (
                <div key={player.player_id} onClick={() => handlePlayerClick(player.player_id)}
                  className={`relative overflow-hidden rounded-xl cursor-pointer group border-2 ${borderColors[index]} ${heights[index]}`}
                  data-testid={`top-player-card-${index + 1}`}>
                  {player.photo_url
                    ? <img src={player.photo_url} alt={player.player_name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    : <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center"><span className="text-8xl font-bold text-white/20">{player.player_name.charAt(0)}</span></div>
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className={`absolute top-3 left-3 z-10 w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${badgeBg[index]}`}>{index + 1}</div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                    <p className="text-white font-bold text-sm leading-tight line-clamp-2 mb-1">{player.player_name}</p>
                    <p className="text-green-400 font-bold text-lg leading-none">{player.total_points} <span className="text-xs font-normal text-gray-300">pts</span></p>
                    <p className="text-gray-400 text-xs mt-1">{player.results_count} torneios</p>
                  </div>
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex flex-col items-center justify-center gap-3 p-4">
                    {player.last_match && (
                      <div className="text-center space-y-1">
                        <div className="text-xs text-green-400 font-semibold uppercase tracking-wide">Última Partida</div>
                        <div className="text-base text-white font-medium">vs {player.last_match.opponent_name}</div>
                        <div className="text-gray-300 font-mono text-sm">{player.last_match.score_formatted}</div>
                        <Badge className={player.last_match.result === 'Win' ? 'bg-green-500' : 'bg-red-500'}>{player.last_match.result === 'Win' ? 'Vitória' : 'Derrota'}</Badge>
                      </div>
                    )}
                    <Button variant="outline" className="border-green-500 text-green-400 hover:bg-green-500 hover:text-white text-sm">Ver Perfil →</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Complete Rankings Table */}
      <Card className="bg-slate-800/50 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-white text-2xl flex items-center justify-between">
            <span>Ranking Completo - {selectedClass} {selectedCategory}</span>
            <span className="text-sm text-gray-400 font-normal">{rankings.length} jogadores</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-12 text-gray-400">Carregando...</div>
            : rankings.length === 0 ? <div className="text-center py-12 text-gray-400">Nenhum resultado encontrado</div>
            : (
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="rankings-table">
                  <thead>
                    <tr className="border-b-2 border-slate-700">
                      <th className="text-left py-4 px-4 text-gray-400 font-semibold uppercase text-xs">Rank</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-semibold uppercase text-xs">Jogador</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-semibold uppercase text-xs hidden md:table-cell">Classe</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-semibold uppercase text-xs hidden lg:table-cell">Categoria</th>
                      <th className="text-right py-4 px-4 text-gray-400 font-semibold uppercase text-xs">Pontos</th>
                      <th className="text-center py-4 px-4 text-gray-400 font-semibold uppercase text-xs hidden sm:table-cell">Torneios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((player, index) => {
                      const isTop3 = index < 3;
                      const medalColors = ['text-yellow-400', 'text-gray-300', 'text-orange-400'];
                      return (
                        <tr key={player.player_id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-all cursor-pointer group" data-testid={`ranking-row-${index}`}>
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              {isTop3 ? (<>{index === 0 && <Trophy className="w-5 h-5 text-yellow-400 mr-2" />}{index === 1 && <Medal className="w-5 h-5 text-gray-300 mr-2" />}{index === 2 && <Medal className="w-5 h-5 text-orange-400 mr-2" />}<span className={`font-black text-xl ${medalColors[index]}`}>{player.rank}</span></>) : (<span className="text-white font-bold text-lg">{player.rank}</span>)}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3 group-hover:text-green-400 transition-colors" onClick={() => handlePlayerClick(player.player_id)}>
                              <Avatar className="w-12 h-12 ring-2 ring-transparent group-hover:ring-green-500 transition-all">
                                <AvatarImage src={player.photo_url} />
                                <AvatarFallback className="bg-green-500 text-white">{player.player_name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-white font-semibold group-hover:underline">{player.player_name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 hidden md:table-cell"><Badge className="bg-blue-500">{selectedClass}</Badge></td>
                          <td className="py-4 px-4 hidden lg:table-cell"><Badge className="bg-purple-500">{selectedCategory}</Badge></td>
                          <td className="py-4 px-4 text-right"><span className="text-green-400 font-bold text-xl">{player.total_points}</span></td>
                          <td className="py-4 px-4 text-center hidden sm:table-cell"><span className="text-gray-400 font-medium">{player.results_count}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </CardContent>
      </Card>

      {/* ── Hidden Top 10 Card for Image Generation ── */}
      <div
        id="top10-card"
        style={{ position: 'fixed', left: '-9999px', width: '800px', background: '#0a1628', fontFamily: 'Arial, sans-serif', overflow: 'hidden' }}
      >
        {/* Marca d'água — usa base64 para o html2canvas capturar */}
        {logoBase64 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, pointerEvents: 'none' }}>
            <img src={logoBase64} alt="" style={{ width: '480px', height: '480px', objectFit: 'contain', opacity: 0.07 }} />
          </div>
        )}

        <div style={{ position: 'relative', zIndex: 2 }}>

          {/* Header */}
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '2px solid rgba(74,163,255,0.25)', background: '#0d1f3c' }}>
            {/* Logo em base64 — aparece no html2canvas */}
            {logoBase64
              ? <img src={logoBase64} alt="FSP" style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
              : <div style={{ width: '56px', height: '56px', borderRadius: '10px', background: '#1a3a6e', flexShrink: 0 }} />
            }
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '22px', fontWeight: '900', color: 'white', letterSpacing: '3px', lineHeight: 1 }}>RANKING FSP</div>
              <div style={{ fontSize: '11px', color: '#7ab3f0', letterSpacing: '1px', marginTop: '3px' }}>FEDERAÇÃO DE SQUASH DO PARANÁ</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#7ab3f0', letterSpacing: '1px' }}>{selectedCategory.toUpperCase()} · {selectedClass.toUpperCase()} CLASSE</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'white', marginTop: '3px' }}>
                {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Grid 5×2 — todos os cards com MESMO tamanho */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', padding: '4px' }}>
            {top10.map((player, index) => {
              const badgeStyle =
                index === 0 ? { background: '#d4a017', color: '#3a2800' }
                : index === 1 ? { background: '#9e9e9e', color: '#1a1a1a' }
                : index === 2 ? { background: '#cd7f32', color: '#2a1500' }
                : { background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' };

              const borderColor =
                index === 0 ? '#d4a017'
                : index === 1 ? '#9e9e9e'
                : index === 2 ? '#cd7f32'
                : 'rgba(255,255,255,0.08)';

              return (
                <div key={player.player_id} style={{ position: 'relative', height: '230px', borderRadius: '6px', overflow: 'hidden', border: `2px solid ${borderColor}`, background: '#1a3a6e' }}>

                  {/* Foto full */}
                  {player.photo_url
                    ? <img src={player.photo_url} alt={player.player_name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px', fontWeight: '900', color: 'rgba(255,255,255,0.15)' }}>{player.player_name.charAt(0)}</div>
                  }

                  {/* Gradiente — cobre 60% de baixo pra cima para o nome aparecer bem */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.75) 40%, rgba(0,0,0,0.1) 70%, transparent 100%)' }} />

                  {/* Badge posição */}
                  <div style={{ position: 'absolute', top: '8px', left: '8px', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '900', ...badgeStyle }}>
                    {index + 1}
                  </div>

                  {/* Nome + pontos — área generosa no fundo */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 10px 10px 10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: 'white', lineHeight: '1.3', marginBottom: '4px', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                      {player.player_name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#4fc3f7', fontWeight: '700' }}>
                      {player.total_points} <span style={{ fontSize: '10px', color: '#90caf9', fontWeight: '400' }}>pts</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', padding: '8px 20px', fontSize: '10px', color: '#2a4a72', letterSpacing: '2px', borderTop: '1px solid rgba(74,163,255,0.15)' }}>
            FEDERACAOSQUASHPR.COM.BR
          </div>

        </div>
      </div>

      {/* Player Details Modal */}
      <Dialog open={!!selectedPlayer} onOpenChange={() => { setSelectedPlayer(null); setPlayerDetails(null); }}>
        <DialogContent className="bg-slate-800 border-green-500/20 max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedPlayer && (
            <>
              <DialogHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={selectedPlayer.photo_url} />
                    <AvatarFallback className="bg-green-500 text-white text-2xl">{selectedPlayer.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-white text-2xl">{selectedPlayer.name}</DialogTitle>
                    {selectedPlayer.main_class && <Badge className="bg-blue-500 mt-1">{selectedPlayer.main_class}</Badge>}
                  </div>
                </div>
              </DialogHeader>

              {detailsLoading ? (
                <div className="py-12 text-center text-gray-400">Carregando detalhes...</div>
              ) : playerDetails ? (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedPlayer.city && (
                      <div className="bg-slate-900/50 rounded-lg p-4">
                        <div className="flex items-center text-gray-400 mb-1"><MapPin className="w-4 h-4 mr-2" /><span className="text-sm">Cidade</span></div>
                        <p className="text-white font-semibold">{selectedPlayer.city}</p>
                      </div>
                    )}
                    {selectedPlayer.academy && (
                      <div className="bg-slate-900/50 rounded-lg p-4">
                        <div className="flex items-center text-gray-400 mb-1"><GraduationCap className="w-4 h-4 mr-2" /><span className="text-sm">Academia</span></div>
                        <p className="text-white font-semibold">{selectedPlayer.academy}</p>
                      </div>
                    )}
                    {selectedPlayer.coach && (
                      <div className="bg-slate-900/50 rounded-lg p-4">
                        <div className="flex items-center text-gray-400 mb-1"><User className="w-4 h-4 mr-2" /><span className="text-sm">Treinador</span></div>
                        <p className="text-white font-semibold">{selectedPlayer.coach}</p>
                      </div>
                    )}
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <div className="flex items-center text-gray-400 mb-1"><Trophy className="w-4 h-4 mr-2" /><span className="text-sm">Torneios Disputados</span></div>
                      <p className="text-white font-semibold text-2xl">{playerDetails.total_tournaments}</p>
                    </div>
                  </div>

                  {Object.keys(playerDetails.rankings).length > 0 && (
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-3 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-green-400" />Posição nos Rankings</h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        {Object.values(playerDetails.rankings).map((ranking, idx) => (
                          <div key={idx} className="bg-slate-800 rounded p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-gray-400 text-sm">{ranking.class} - {ranking.category}</span>
                              <Badge className="bg-green-500">{ranking.points} pts</Badge>
                            </div>
                            <p className="text-white font-bold text-xl">{ranking.rank}º lugar <span className="text-sm text-gray-400">de {ranking.total}</span></p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {playerDetails.last_match && (
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-3">Última Partida</h3>
                      <div className="bg-slate-800 rounded p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-gray-400 text-sm">{playerDetails.last_match.tournament_name}</p>
                            <p className="text-white font-medium text-lg">vs {playerDetails.last_match.opponent_name}</p>
                          </div>
                          <Badge className={playerDetails.last_match.result === 'Win' ? 'bg-green-500' : 'bg-red-500'}>
                            {playerDetails.last_match.result === 'Win' ? 'Vitória' : 'Derrota'}
                          </Badge>
                        </div>
                        <p className="text-gray-300 font-mono">{playerDetails.last_match.score_formatted}</p>
                        <p className="text-gray-400 text-sm mt-2">{format(new Date(playerDetails.last_match.date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                      </div>
                    </div>
                  )}

                  {playerDetails.recent_tournaments.length > 0 && (
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-3 flex items-center"><Trophy className="w-5 h-5 mr-2 text-green-400" />Histórico de Torneios</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-700">
                              <th className="text-left py-2 px-2 text-gray-400 text-sm">Torneio</th>
                              <th className="text-left py-2 px-2 text-gray-400 text-sm">Ano</th>
                              <th className="text-left py-2 px-2 text-gray-400 text-sm">Resultado</th>
                              <th className="text-right py-2 px-2 text-gray-400 text-sm">Pontos</th>
                            </tr>
                          </thead>
                          <tbody>
                            {playerDetails.recent_tournaments.map((tournament, idx) => {
                              const placementLabels = { 1: 'Champion', 2: 'Runner-up', 3: 'Semi Finalist', 4: 'Semi Finalist', 5: 'Quarter Finalist', 6: 'Quarter Finalist', 7: 'Quarter Finalist', 8: 'Quarter Finalist' };
                              const resultLabel = placementLabels[tournament.placement] || `${tournament.placement}º Place`;
                              const year = new Date(tournament.tournament_date).getFullYear();
                              return (
                                <tr key={idx} className="border-b border-slate-700/50">
                                  <td className="py-3 px-2 text-white">{tournament.tournament_name}</td>
                                  <td className="py-3 px-2 text-gray-300">{year}</td>
                                  <td className="py-3 px-2"><Badge className={tournament.placement <= 3 ? 'bg-yellow-500' : 'bg-blue-500'}>{resultLabel}</Badge></td>
                                  <td className="py-3 px-2 text-right text-green-400 font-semibold">{tournament.points} pts</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {playerDetails.match_history && playerDetails.match_history.length > 0 && (
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-3 flex items-center"><Trophy className="w-5 h-5 mr-2 text-green-400" />Histórico de Partidas</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-700">
                              <th className="text-left py-2 px-2 text-gray-400 text-sm">Oponente</th>
                              <th className="text-left py-2 px-2 text-gray-400 text-sm">Torneio</th>
                              <th className="text-left py-2 px-2 text-gray-400 text-sm">Rodada</th>
                              <th className="text-left py-2 px-2 text-gray-400 text-sm">Placar</th>
                              <th className="text-left py-2 px-2 text-gray-400 text-sm">Resultado</th>
                              <th className="text-left py-2 px-2 text-gray-400 text-sm">Data</th>
                            </tr>
                          </thead>
                          <tbody>
                            {playerDetails.match_history.slice(0, 10).map((match, idx) => (
                              <tr key={idx} className="border-b border-slate-700/50">
                                <td className="py-3 px-2 text-white">{match.opponent_name}</td>
                                <td className="py-3 px-2 text-gray-300 text-sm">{match.tournament_name}</td>
                                <td className="py-3 px-2"><Badge className="bg-purple-500 text-xs">{match.round}</Badge></td>
                                <td className="py-3 px-2 text-gray-300 font-mono text-xs">{match.score_formatted}</td>
                                <td className="py-3 px-2"><Badge className={match.result === 'Win' ? 'bg-green-500' : 'bg-red-500'}>{match.result === 'Win' ? 'Vitória' : 'Derrota'}</Badge></td>
                                <td className="py-3 px-2 text-gray-400 text-sm">{format(new Date(match.date), 'dd/MM/yyyy', { locale: ptBR })}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {playerDetails.head_to_head && playerDetails.head_to_head.length > 0 && (
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-3 flex items-center"><Trophy className="w-5 h-5 mr-2 text-green-400" />Head-to-Head</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-700">
                              <th className="text-left py-2 px-2 text-gray-400 text-sm">Oponente</th>
                              <th className="text-center py-2 px-2 text-gray-400 text-sm">Partidas</th>
                              <th className="text-center py-2 px-2 text-gray-400 text-sm">Vitórias</th>
                              <th className="text-center py-2 px-2 text-gray-400 text-sm">Derrotas</th>
                              <th className="text-center py-2 px-2 text-gray-400 text-sm">Taxa de Vitória</th>
                            </tr>
                          </thead>
                          <tbody>
                            {playerDetails.head_to_head.map((h2h, idx) => {
                              const winRate = ((h2h.wins / h2h.matches_played) * 100).toFixed(0);
                              return (
                                <tr key={idx} className="border-b border-slate-700/50">
                                  <td className="py-3 px-2 text-white">{h2h.opponent_name}</td>
                                  <td className="py-3 px-2 text-center"><Badge className="bg-blue-500">{h2h.matches_played}</Badge></td>
                                  <td className="py-3 px-2 text-center"><Badge className="bg-green-500">{h2h.wins}</Badge></td>
                                  <td className="py-3 px-2 text-center"><Badge className="bg-red-500">{h2h.losses}</Badge></td>
                                  <td className="py-3 px-2 text-center text-gray-300 font-semibold">{winRate}%</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-400">Nenhum dado disponível</div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Rankings;
