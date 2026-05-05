import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from '../lib/api';
import { API } from '../lib/api';
import { Trophy, Medal, Download, MapPin, GraduationCap, User, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import PlayerModal from '../components/PlayerModal';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CLASSES = ['1ª', '2ª', '3ª', '4ª', '5ª', '6ª', 'Duplas'];
const CATEGORIES = ['Feminina', 'Masculina'];

const Rankings = () => {

  const [rankings, setRankings] = useState([]);
  const [selectedClass, setSelectedClass] = useState('1ª');
  const [selectedCategory, setSelectedCategory] = useState('Feminina');
  const [loading, setLoading] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [logoBase64, setLogoBase64] = useState('');
  const [imageFormatOpen, setImageFormatOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchRankings = async () => {
      setLoading(true);
      setRankings([]);
      try {
        const effectiveCategory = selectedClass === 'Duplas' ? 'Mista' : selectedCategory;
        const response = await axios.get(
          `${API}/rankings?class_category=${selectedClass}&gender_category=${effectiveCategory}`,
          { signal: controller.signal }
        );
        setRankings(response.data);
      } catch (error) {
        if (axios.isCancel?.(error) || error.name === 'CanceledError' || error.name === 'AbortError') return;
        toast.error('Erro ao carregar rankings');
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
    return () => controller.abort();
  }, [selectedClass, selectedCategory]);

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

  const handlePlayerClick = (playerId) => { setSelectedPlayerId(playerId); };

  const IMAGE_FORMATS = [
    { id: 'feed', label: 'Feed Instagram', desc: '1080×1080', w: 1080, h: 1080 },
    { id: 'story', label: 'Story / Reels', desc: '1080×1920', w: 1080, h: 1920 },
    { id: 'landscape', label: 'Paisagem', desc: '1280×720', w: 1280, h: 720 },
    { id: 'original', label: 'Original', desc: '800×auto', w: 800, h: null },
  ];

  const generateTop10Image = async (format) => {
    const element = document.getElementById('top10-card');
    if (!element) return;
    setImageFormatOpen(false);

    const BASE_W = 800;
    const BASE_H = format.h ? Math.round(BASE_W * (format.h / format.w)) : null;
    const SCALE  = format.w / BASE_W;

    const originalStyle = element.getAttribute('style');

    const noShadowStyle = document.createElement('style');
    noShadowStyle.id = 'no-shadow-capture';
    noShadowStyle.textContent = `
      #top10-card, #top10-card * {
        box-shadow: none !important;
        text-shadow: none !important;
        filter: none !important;
        -webkit-filter: none !important;
      }
      #top10-card img {
        border-radius: 0 !important;
        box-shadow: none !important;
        filter: none !important;
      }
    `;

    try {
      document.head.appendChild(noShadowStyle);

      element.style.width    = `${BASE_W}px`;
      element.style.height   = BASE_H ? `${BASE_H}px` : 'auto';
      element.style.overflow = 'hidden';
      element.setAttribute('data-format', format.id);

      const canvas = await html2canvas(element, {
        backgroundColor: '#0a1628',
        scale: SCALE,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: BASE_W,
        height: BASE_H || undefined,
      });

      document.head.removeChild(noShadowStyle);
      element.setAttribute('style', originalStyle || '');
      element.removeAttribute('data-format');

      const link = document.createElement('a');
      link.download = `top10-${selectedClass}-${(selectedClass === 'Duplas' ? 'Mista' : selectedCategory)}-${format.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Imagem gerada com sucesso!');
    } catch (error) {
      const tag = document.getElementById('no-shadow-capture');
      if (tag) document.head.removeChild(tag);
      element && element.setAttribute('style', originalStyle || '');
      element && element.removeAttribute('data-format');
      toast.error('Erro ao gerar imagem');
    }
  };

  const top10 = rankings.slice(0, 10);
  const top5 = rankings.slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1" data-testid="rankings-title">Rankings Oficiais</h1>
          <p className="text-gray-400 text-sm">Classificação atualizada dos jogadores</p>
        </div>
        <Button onClick={() => setImageFormatOpen(true)} className="bg-purple-500 hover:bg-purple-600 shrink-0" data-testid="generate-image-button">
          <Download className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Gerar Imagem Top 10</span>
        </Button>
      </div>

      {/* ── Filtros compactos em uma linha ── */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Classes */}
          <div className="flex flex-wrap gap-1.5 flex-1">
            {CLASSES.map((cls) => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                data-testid={`class-filter-${cls}`}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  selectedClass === cls
                    ? 'bg-green-500 text-white'
                    : 'text-slate-400 hover:text-white outline outline-1 outline-slate-700 hover:outline-slate-500'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>

          {/* Divisor vertical */}
          <div className="w-px h-6 bg-slate-700 shrink-0 hidden sm:block" />

          {/* Categoria */}
          {selectedClass === 'Duplas' ? (
            <div className="px-3 py-1.5 rounded-md text-xs font-semibold bg-purple-500 text-white shrink-0">Mista</div>
          ) : (
            <div className="flex gap-1.5 shrink-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  data-testid={`category-filter-${cat}`}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-500 text-white'
                      : 'text-slate-400 hover:text-white outline outline-1 outline-slate-700 hover:outline-slate-500'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top 5 Cards — SEM overlay escuro nas fotos */}
      {!loading && rankings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-white"><span className="sm:hidden">Top 3</span><span className="hidden sm:inline">Top 5</span></h2>
            <Badge className="bg-green-500 text-white px-3 py-1">{selectedClass} - {selectedClass === 'Duplas' ? 'Mista' : selectedCategory}</Badge>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 items-end">
            {top5.map((player, index) => {
              const borderColors = ['border-yellow-400', 'border-gray-300', 'border-orange-400', 'border-blue-400', 'border-green-400'];
              const badgeBg = ['bg-yellow-400 text-yellow-900', 'bg-gray-300 text-gray-900', 'bg-orange-400 text-orange-900', 'bg-blue-400 text-blue-900', 'bg-green-400 text-green-900'];
              return (
                <div key={player.player_id} onClick={() => handlePlayerClick(player.player_id)}
                  className={`relative overflow-hidden rounded-xl cursor-pointer group border-2 ${borderColors[index]} h-[280px] sm:h-[360px] ${index >= 3 ? "hidden sm:block" : ""} transition-transform duration-200 hover:-translate-y-1`}
                  data-testid={`top-player-card-${index + 1}`}>
                  {/* Foto sem overlay escuro */}
                  {player.photo_url
                    ? <img src={player.photo_url} alt={player.player_name} className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
                    : <img src="/fsp.jpeg" alt="FSP" className="absolute inset-0 w-full h-full object-cover object-top" />
                  }
                  {/* Badge de posição */}
                  <div className={`absolute top-3 left-3 z-10 w-10 h-10 rounded-full flex items-center justify-center font-black text-lg leading-none ${badgeBg[index]} shadow-lg`}>{index + 1}</div>
                  {/* Info na parte inferior — fundo sólido semi-transparente para legibilidade */}
                  <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/60 backdrop-blur-sm px-3 py-2.5">
                    <p className="text-white font-bold text-sm leading-tight line-clamp-2 mb-0.5">{player.player_name}</p>
                    <p className="text-green-400 font-bold text-base leading-none">{player.total_points} <span className="text-xs font-normal text-gray-300">pts</span></p>
                    <p className="text-gray-300 text-xs mt-0.5">{player.results_count} torneios</p>
                  </div>
                  {/* Hover overlay com info adicional */}
                  <div className="absolute inset-0 bg-black/85 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex flex-col items-center justify-center gap-3 p-4">
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

      {/* Ranking Completo */}
      <Card className="bg-slate-800/50 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-white text-2xl flex items-center justify-between">
            <span>Ranking Completo - {selectedClass} {selectedClass === 'Duplas' ? 'Mista' : selectedCategory}</span>
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
                      <th className="text-left py-4 px-2 text-gray-400 font-semibold uppercase text-xs hidden md:table-cell">Classe</th>
                      <th className="text-left py-4 px-2 text-gray-400 font-semibold uppercase text-xs hidden lg:table-cell">Categoria</th>
                      <th className="text-center py-4 px-3 text-gray-400 font-semibold uppercase text-xs hidden sm:table-cell">Tend.</th>
                      <th className="text-center py-4 px-3 text-gray-400 font-semibold uppercase text-xs hidden md:table-cell">% Vitórias</th>
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
                          <td className="py-3 px-2 sm:px-4">
                            <div className="flex items-center">
                              {isTop3 ? (
                                <>
                                  {index === 0 && <Trophy className="w-5 h-5 text-yellow-400 mr-2" />}
                                  {index === 1 && <Medal className="w-5 h-5 text-gray-300 mr-2" />}
                                  {index === 2 && <Medal className="w-5 h-5 text-orange-400 mr-2" />}
                                  <span className={`font-black text-xl ${medalColors[index]}`}>{player.rank}</span>
                                </>
                              ) : (
                                <span className="text-white font-bold text-lg">{player.rank}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3 group-hover:text-green-400 transition-colors" onClick={() => handlePlayerClick(player.player_id)}>
                              <Avatar className="w-12 h-12 ring-2 ring-transparent group-hover:ring-green-500 transition-all">
                                <AvatarImage src={player.photo_url || "/fsp.jpeg"} />
                                <AvatarFallback><img src="/fsp.jpeg" alt="FSP" className="w-full h-full object-cover" /></AvatarFallback>
                              </Avatar>
                              <span className="text-white font-semibold group-hover:underline">{player.player_name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 hidden md:table-cell"><Badge className="bg-blue-500">{selectedClass}</Badge></td>
                          <td className="py-4 px-4 hidden lg:table-cell"><Badge className="bg-purple-500">{selectedClass === 'Duplas' ? 'Mista' : selectedCategory}</Badge></td>

                          {/* Tendência */}
                          <td className="py-4 px-3 text-center hidden sm:table-cell">
                            {player.position_change > 0 && (
                              <span className="text-green-400 text-xs font-bold">▲{player.position_change}</span>
                            )}
                            {player.position_change < 0 && (
                              <span className="text-red-400 text-xs font-bold">▼{Math.abs(player.position_change)}</span>
                            )}
                            {(!player.position_change || player.position_change === 0) && (
                              <span className="text-slate-600 text-xs">—</span>
                            )}
                          </td>

                          {/* % Vitórias */}
                          <td className="py-4 px-3 text-center hidden md:table-cell">
                            {player.win_rate != null ? (
                              <span className={`text-sm font-bold ${
                                player.win_rate >= 70 ? 'text-green-400'
                                : player.win_rate >= 50 ? 'text-gray-300'
                                : 'text-slate-500'
                              }`}>
                                {player.win_rate}%
                              </span>
                            ) : (
                              <span className="text-slate-600 text-xs">—</span>
                            )}
                          </td>

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

      {/* Format Picker Dialog */}
      <Dialog open={imageFormatOpen} onOpenChange={setImageFormatOpen}>
        <DialogContent className="bg-slate-800 border-purple-500/20 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-purple-400" />
              Escolha o formato
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {IMAGE_FORMATS.map(fmt => (
              <button
                key={fmt.id}
                onClick={() => generateTop10Image(fmt)}
                className="w-full flex items-center justify-between bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-purple-500/50 rounded-lg px-4 py-3 transition-all group"
              >
                <div className="text-left">
                  <p className="text-white font-semibold text-sm group-hover:text-purple-300">{fmt.label}</p>
                  <p className="text-gray-400 text-xs">{fmt.desc} px</p>
                </div>
                <Download className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden Card para geração de imagem */}
      <div
        id="top10-card"
        style={{ position: 'fixed', left: '-9999px', width: '800px', background: '#080f1e', fontFamily: 'Arial, sans-serif', overflow: 'hidden' }}
      >
        {logoBase64 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, pointerEvents: 'none' }}>
            <img src={logoBase64} alt="" style={{ width: '500px', height: '500px', objectFit: 'contain', opacity: 0.05 }} />
          </div>
        )}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: 'linear-gradient(90deg, #0d1f3c 0%, #0a1628 100%)', borderBottom: '2px solid rgba(74,163,255,0.2)' }}>
            {logoBase64
              ? <img src={logoBase64} alt="FSP" style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }} />
              : <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: '#1a3a6e', flexShrink: 0 }} />
            }
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '24px', fontWeight: '900', color: 'white', letterSpacing: '3px', lineHeight: 1 }}>RANKING FSP</div>
              <div style={{ fontSize: '11px', color: '#7ab3f0', letterSpacing: '1px', marginTop: '4px' }}>FEDERAÇÃO DE SQUASH DO PARANÁ</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#7ab3f0', letterSpacing: '1px', marginBottom: '4px' }}>{selectedClass.toUpperCase()} CLASSE · {(selectedClass === 'Duplas' ? 'Mista' : selectedCategory).toUpperCase()}</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>
                {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', padding: '16px 16px 8px' }}>
            {rankings.slice(0, 5).map((player, index) => {
              const badgeStyle =
                index === 0 ? { background: '#d4a017', color: '#3a2800' }
                : index === 1 ? { background: '#9e9e9e', color: '#1a1a1a' }
                : index === 2 ? { background: '#cd7f32', color: '#2a1500' }
                : { background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' };
              const borderColor =
                index === 0 ? '#d4a017'
                : index === 1 ? '#9e9e9e'
                : index === 2 ? '#cd7f32'
                : 'rgba(255,255,255,0.1)';
              const cardH = index === 0 ? '320px' : index <= 2 ? '300px' : '280px';
              return (
                <div key={player.player_id} style={{ position: 'relative', height: cardH, borderRadius: '8px', overflow: 'hidden', border: `2px solid ${borderColor}`, background: '#0d1f3c', alignSelf: 'end' }}>
                  {player.photo_url
                    ? <img src={player.photo_url} alt={player.player_name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
                    : <img src="/fsp.jpeg" alt="FSP" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block', opacity: 0.5 }} />
                  }

                  <div style={{ position: 'absolute', top: '8px', left: '8px', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '900', ...badgeStyle }}>
                    {index + 1}
                  </div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 10px 10px', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: 'white', lineHeight: '1.25', marginBottom: '4px', wordBreak: 'break-word' }}>
                      {player.player_name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#4fc3f7', fontWeight: '700' }}>
                      {player.total_points} <span style={{ fontSize: '10px', color: '#90caf9', fontWeight: '400' }}>pts</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {rankings.length > 5 && (
            <div style={{ margin: '0 16px 16px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(74,163,255,0.15)', background: 'rgba(13,31,60,0.6)' }}>
              {rankings.slice(5, 10).map((player, i) => {
                const pos = i + 6;
                const isLast = i === Math.min(rankings.length - 6, 4);
                return (
                  <div key={player.player_id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 16px', borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.06)', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', color: '#94a3b8', flexShrink: 0 }}>
                      {pos}
                    </div>
                    <div style={{ flex: 1, fontSize: '14px', fontWeight: '700', color: 'white', letterSpacing: '0.3px' }}>
                      {player.player_name}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#4fc3f7' }}>
                      {player.total_points} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '400' }}>pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ textAlign: 'center', padding: '10px 20px', fontSize: '10px', color: '#2a4a72', letterSpacing: '2px', borderTop: '1px solid rgba(74,163,255,0.12)' }}>
            FEDERACAOSQUASHPR.COM.BR
          </div>
        </div>
      </div>

      <PlayerModal playerId={selectedPlayerId} onClose={() => setSelectedPlayerId(null)} />
    </div>
  );
};

export default Rankings;
