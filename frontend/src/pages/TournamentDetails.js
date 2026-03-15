import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../lib/api';
import { useFederation } from '../context/FederationContext';
import {
  Calendar, MapPin, Trophy, Medal, ArrowLeft, Swords,
  CheckCircle, Clock, ExternalLink, Image, Radio, GitBranch,
  Users, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const calculateSetResult = (score) => {
  if (!score || score.length === 0) return '0-0';
  let p1 = 0, p2 = 0;
  score.forEach(game => {
    const parts = game.split('-');
    if (parts.length === 2) {
      parseInt(parts[0]) > parseInt(parts[1]) ? p1++ : p2++;
    }
  });
  return `${p1}-${p2}`;
};

const TABS = [
  { key: 'results',      label: 'Resultados',   icon: Trophy },
  { key: 'matches',      label: 'Partidas',      icon: Swords },
  { key: 'chaves',       label: 'Chaves',        icon: GitBranch },
  { key: 'fotos',        label: 'Fotos',         icon: Image },
  { key: 'transmissao',  label: 'Transmissão',   icon: Radio },
];

const TournamentDetails = () => {
  const { API, slug } = useFederation();
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [results, setResults] = useState([]);
  const [matches, setMatches] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('results');

  useEffect(() => { fetchTournamentData(); }, [id]);

  const fetchTournamentData = async () => {
    try {
      const [resultsRes, matchesRes] = await Promise.all([
        axios.get(`${API}/tournaments/${id}/results`),
        axios.get(`${API}/tournaments/${id}/matches`),
      ]);
      setTournament(resultsRes.data.tournament);
      setResults(resultsRes.data.results);
      setMatches(matchesRes.data.matches);
      setCategories(matchesRes.data.categories);
      if (matchesRes.data.categories.length > 0) {
        setSelectedCategory(matchesRes.data.categories[0]);
      }
    } catch (error) {
      toast.error('Erro ao carregar dados do torneio');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-400">Carregando...</div>
    </div>
  );

  if (!tournament) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-400 mb-4">Torneio não encontrado</p>
        <Link to="/tournaments">
          <Button className="bg-green-500 hover:bg-green-600">
            <ArrowLeft className="w-4 h-4 mr-2" />Voltar aos Torneios
          </Button>
        </Link>
      </div>
    </div>
  );

  const filteredMatches = selectedCategory === 'all'
    ? Object.values(matches).flat()
    : matches[selectedCategory] || [];

  const totalMatches = Object.values(matches).flat().length;

  // Links opcionais vindos do objeto tournament (precisam ser adicionados no backend)
  const bracketLink     = tournament.bracket_link || null;
  const photosLink      = tournament.photos_link  || null;
  const streamLink      = tournament.stream_link  || null;

  return (
    <div className="space-y-6">

      {/* Back */}
      <Link to={`/${slug}/tournaments`}>
  <Button variant="ghost" className="text-gray-400 hover:text-white -ml-2">
    <ArrowLeft className="w-4 h-4 mr-2" />Voltar aos Torneios
  </Button>
</Link>

      {/* Hero header */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
        <div className={`h-2 w-full ${tournament.is_completed ? 'bg-green-500' : 'bg-yellow-500'}`} />
        <div className="p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-3">{tournament.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-green-500/70" />
                  {format(new Date(tournament.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
                {tournament.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-green-500/70" />
                    {tournament.location}
                  </span>
                )}
                {tournament.total_players > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-green-500/70" />
                    {tournament.total_players} jogadores
                  </span>
                )}
              </div>
            </div>
            <Badge className={`text-sm px-3 py-1 ${tournament.is_completed ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
              {tournament.is_completed
                ? <><CheckCircle className="w-3.5 h-3.5 mr-1.5 inline" />Concluído</>
                : <><Clock className="w-3.5 h-3.5 mr-1.5 inline" />Em andamento</>
              }
            </Badge>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-700">
            <div className="text-center">
              <div className="text-2xl font-black text-white">{results.reduce((acc, g) => acc + g.results.length, 0)}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Resultados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-white">{totalMatches}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Partidas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-white">{categories.length}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Categorias</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-700 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'text-green-400 border-b-2 border-green-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.key === 'matches' && totalMatches > 0 && (
                <span className="bg-slate-700 text-gray-300 text-xs px-1.5 py-0.5 rounded-full">{totalMatches}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab: Resultados ── */}
      {activeTab === 'results' && (
        <div className="space-y-5">
          {results.length === 0 ? (
            <EmptyState icon={Trophy} message="Nenhum resultado cadastrado para este torneio" />
          ) : results.map((group, idx) => (
            <Card key={idx} className="bg-slate-800/50 border-slate-700 overflow-hidden">
              <div className="h-1 bg-green-500/50" />
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Trophy className="w-5 h-5 text-green-400" />
                  {group.class} — {group.category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {group.results.map((result, ridx) => (
                    <div key={ridx} className={`flex items-center justify-between p-3 rounded-lg transition-colors ${ridx === 0 ? 'bg-yellow-500/10 border border-yellow-500/20' : ridx === 1 ? 'bg-gray-400/10 border border-gray-400/20' : ridx === 2 ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-slate-900/50 hover:bg-slate-900/70'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 flex items-center justify-center">
                          {result.placement === 1 && <Trophy className="w-6 h-6 text-yellow-400" />}
                          {result.placement === 2 && <Medal className="w-6 h-6 text-gray-300" />}
                          {result.placement === 3 && <Medal className="w-6 h-6 text-orange-400" />}
                          {result.placement > 3 && <span className="text-gray-400 font-bold text-lg">{result.placement}º</span>}
                        </div>
                        <span className="text-white font-semibold">{result.player_name}</span>
                      </div>
                      <span className="text-green-400 font-bold">{result.points} pts</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Tab: Partidas ── */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          {categories.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="text-gray-300 font-semibold text-sm">Categoria:</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {filteredMatches.length === 0 ? (
            <EmptyState icon={Swords} message="Nenhuma partida registrada nesta categoria" />
          ) : (
            <div className="space-y-3">
              {filteredMatches.map((match) => {
                const setResult = calculateSetResult(match.score);
                return (
                  <div key={match.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs">{match.category}</Badge>
                        <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs">{match.round}</Badge>
                      </div>
                      <span className="text-gray-500 text-xs">{format(new Date(match.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>

                    {/* Players vs layout */}
                    <div className="flex items-center gap-3">
                      <div className={`flex-1 text-right font-semibold ${match.winner_id === match.player1_id ? 'text-green-400' : 'text-gray-300'}`}>
                        {match.player1_name}
                        {match.winner_id === match.player1_id && <CheckCircle className="w-3.5 h-3.5 inline ml-1.5 mb-0.5" />}
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-gray-500 text-xs font-bold uppercase">vs</span>
                        <span className="text-white font-mono font-bold text-sm mt-0.5">{setResult}</span>
                      </div>
                      <div className={`flex-1 font-semibold ${match.winner_id === match.player2_id ? 'text-green-400' : 'text-gray-300'}`}>
                        {match.player2_name}
                        {match.winner_id === match.player2_id && <CheckCircle className="w-3.5 h-3.5 inline ml-1.5 mb-0.5" />}
                      </div>
                    </div>

                    {match.score && match.score.length > 0 && (
                      <div className="mt-2 text-center text-gray-500 text-xs font-mono">
                        {match.score.join('  ·  ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Chaves ── */}
      {activeTab === 'chaves' && (
        <div className="space-y-4">
          {bracketLink ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  <GitBranch className="w-12 h-12 mx-auto text-green-400 opacity-80" />
                  <h3 className="text-white font-bold text-xl">Chave do Torneio</h3>
                  <p className="text-gray-400 text-sm">Visualize a chave completa do torneio</p>
                  <a href={bracketLink} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-green-500 hover:bg-green-600 mt-2">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir Chave
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ) : (
            <EmptyState icon={GitBranch} message="Nenhuma chave disponível para este torneio" />
          )}
        </div>
      )}

      {/* ── Tab: Fotos ── */}
      {activeTab === 'fotos' && (
        <div className="space-y-4">
          {photosLink ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  <Image className="w-12 h-12 mx-auto text-blue-400 opacity-80" />
                  <h3 className="text-white font-bold text-xl">Galeria de Fotos</h3>
                  <p className="text-gray-400 text-sm">Veja as fotos do torneio</p>
                  <a href={photosLink} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-blue-500 hover:bg-blue-600 mt-2">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver Fotos
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ) : (
            <EmptyState icon={Image} message="Nenhuma galeria de fotos disponível para este torneio" />
          )}
        </div>
      )}

      {/* ── Tab: Transmissão ── */}
      {activeTab === 'transmissao' && (
        <div className="space-y-4">
          {streamLink ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  <Radio className="w-12 h-12 mx-auto text-red-400 opacity-80" />
                  <h3 className="text-white font-bold text-xl">Transmissão</h3>
                  <p className="text-gray-400 text-sm">Assista à transmissão do torneio</p>
                  <a href={streamLink} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-red-500 hover:bg-red-600 mt-2">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Assistir Transmissão
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ) : (
            <EmptyState icon={Radio} message="Nenhuma transmissão disponível para este torneio" />
          )}
        </div>
      )}

    </div>
  );
};

// Reusable empty state
const EmptyState = ({ icon: Icon, message }) => (
  <Card className="bg-slate-800/50 border-slate-700">
    <CardContent className="py-16">
      <div className="text-center text-gray-500">
        <Icon className="w-14 h-14 mx-auto mb-4 opacity-30" />
        <p>{message}</p>
      </div>
    </CardContent>
  </Card>
);

export default TournamentDetails;