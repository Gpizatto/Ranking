import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios, { API } from '../lib/api';
import { Calendar, MapPin, Trophy, ArrowLeft, Users, Swords, Medal, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PLACEMENT_COLORS = { 1: 'text-yellow-400', 2: 'text-gray-300', 3: 'text-orange-400' };

const TournamentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [results, setResults] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('results');
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resultsRes, matchesRes] = await Promise.all([
        axios.get(`${API}/tournaments/${id}/results`),
        axios.get(`${API}/tournaments/${id}/matches`),
      ]);
      setTournament(resultsRes.data.tournament);
      setResults(resultsRes.data.results || []);
      setMatches(matchesRes.data.matches || matchesRes.data || []);
      if (resultsRes.data.results && resultsRes.data.results.length > 0) {
        setSelectedCategory(resultsRes.data.results[0].class + '_' + resultsRes.data.results[0].category);
      }
    } catch (error) {
      toast.error('Erro ao carregar detalhes do torneio');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Carregando...</div>;
  }

  if (!tournament) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p>Torneio nao encontrado</p>
        <Button onClick={() => navigate('/tournaments')} className="mt-4">Voltar</Button>
      </div>
    );
  }

  const activeResults = results.find(function(r) {
    return (r.class + '_' + r.category) === selectedCategory;
  });

  const matchesByRound = matches.reduce(function(acc, m) {
    const round = m.round || 'Outra';
    if (!acc[round]) acc[round] = [];
    acc[round].push(m);
    return acc;
  }, {});

  const roundOrder = ['Final', 'Semi Final', 'Quarter Final', 'Round of 16', 'Round of 32', 'Group Stage'];
  const sortedRounds = Object.keys(matchesByRound).sort(function(a, b) {
    const ia = roundOrder.indexOf(a);
    const ib = roundOrder.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return (
    <div className="space-y-6">

      <button
        onClick={() => navigate('/tournaments')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Torneios
      </button>

      <Card className="bg-slate-800/60 border-slate-700">
        <div className={`h-1.5 w-full ${tournament.is_completed ? 'bg-green-500' : 'bg-yellow-500'}`} />
        <CardContent className="pt-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <Badge className={`mb-3 text-xs ${tournament.is_completed ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                {tournament.is_completed ? 'Concluido' : 'Em andamento'}
              </Badge>
              <h1 className="text-3xl font-bold text-white mb-3">{tournament.name}</h1>
              <div className="space-y-1.5">
                <div className="flex items-center text-gray-400 text-sm gap-2">
                  <Calendar className="w-4 h-4 text-green-500/60" />
                  {format(new Date(tournament.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </div>
                {tournament.location && (
                  <div className="flex items-center text-gray-400 text-sm gap-2">
                    <MapPin className="w-4 h-4 text-green-500/60" />
                    {tournament.location}
                  </div>
                )}
                <div className="flex items-center text-gray-400 text-sm gap-2">
                  <Users className="w-4 h-4 text-green-500/60" />
                  {results.reduce(function(acc, r) { return acc + r.results.length; }, 0)} participantes
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {tournament.bracket_link && (
                <a href={tournament.bracket_link} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-slate-600 text-gray-300 hover:bg-slate-700 gap-2 w-full">
                    <ExternalLink className="w-4 h-4" /> Chave
                  </Button>
                </a>
              )}
              {tournament.photos_link && (
                <a href={tournament.photos_link} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-slate-600 text-gray-300 hover:bg-slate-700 gap-2 w-full">
                    <ExternalLink className="w-4 h-4" /> Fotos
                  </Button>
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${activeTab === 'results' ? 'border-green-500 text-green-400' : 'border-transparent text-gray-400 hover:text-white'}`}
        >
          <Medal className="w-4 h-4" /> Resultados
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${activeTab === 'matches' ? 'border-green-500 text-green-400' : 'border-transparent text-gray-400 hover:text-white'}`}
        >
          <Swords className="w-4 h-4" /> Partidas
        </button>
      </div>

      {activeTab === 'results' && (
        <div className="flex gap-4">
          {results.length > 0 && (
            <div className="w-48 min-w-[12rem] space-y-1">
              {results.map(function(r) {
                const key = r.class + '_' + r.category;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === key ? 'bg-green-500 text-white font-semibold' : 'text-gray-300 hover:bg-slate-700'}`}
                  >
                    {r.class} {r.category}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex-1">
            {results.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="py-12 text-center text-gray-400">
                  <Medal className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum resultado registrado</p>
                </CardContent>
              </Card>
            ) : activeResults ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">{activeResults.class} - {activeResults.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full">
                    <thead>
                      <tr className="text-gray-400 text-xs uppercase border-b border-slate-700">
                        <th className="text-left py-2 px-3">Pos.</th>
                        <th className="text-left py-2 px-3">Jogador</th>
                        <th className="text-right py-2 px-3">Pontos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeResults.results.map(function(r) {
                        return (
                          <tr key={r.player_id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                            <td className={`py-3 px-3 font-bold ${PLACEMENT_COLORS[r.placement] || 'text-gray-300'}`}>
                              {r.placement === 1 ? '🥇' : r.placement === 2 ? '🥈' : r.placement === 3 ? '🥉' : r.placement + 'º'}
                            </td>
                            <td className="py-3 px-3 text-white">{r.player_name}</td>
                            <td className="py-3 px-3 text-green-400 text-right font-semibold">{r.points} pts</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="space-y-4">
          {matches.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-12 text-center text-gray-400">
                <Swords className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhuma partida registrada</p>
              </CardContent>
            </Card>
          ) : sortedRounds.map(function(round) {
            return (
              <Card key={round} className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm uppercase tracking-wide">{round}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {matchesByRound[round].map(function(match) {
                    return (
                      <div key={match.id} className="flex items-center justify-between bg-slate-700/40 rounded-lg px-4 py-3 gap-4">
                        <span className={`flex-1 text-sm font-semibold ${match.winner_id === match.player1_id ? 'text-white' : 'text-gray-400'}`}>
                          {match.player1_name}
                        </span>
                        <div className="text-center">
                          <div className="text-green-400 text-xs font-mono whitespace-nowrap">
                            {match.score && match.score.length > 0 ? match.score.join('  ') : 'vs'}
                          </div>
                          <div className="text-gray-500 text-xs">{match.category}</div>
                        </div>
                        <span className={`flex-1 text-sm font-semibold text-right ${match.winner_id === match.player2_id ? 'text-white' : 'text-gray-400'}`}>
                          {match.player2_name}
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default TournamentDetails;
