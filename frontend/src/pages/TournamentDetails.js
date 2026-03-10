import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../lib/api';
import { API } from '../lib/api';
import { Calendar, MapPin, Trophy, Medal, ArrowLeft, Swords, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TournamentDetails = () => {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [results, setResults] = useState([]);
  const [matches, setMatches] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('results'); // 'results' or 'matches'

  useEffect(() => {
    fetchTournamentData();
  }, [id]);

  const fetchTournamentData = async () => {
    try {
      const [resultsRes, matchesRes] = await Promise.all([
        axios.get(`${API}/tournaments/${id}/results`),
        axios.get(`${API}/tournaments/${id}/matches`)
      ]);

      setTournament(resultsRes.data.tournament);
      setResults(resultsRes.data.results);
      setMatches(matchesRes.data.matches);
      setCategories(matchesRes.data.categories);
      
      // Set first category as default if available
      if (matchesRes.data.categories.length > 0) {
        setSelectedCategory(matchesRes.data.categories[0]);
      }
    } catch (error) {
      toast.error('Erro ao carregar dados do torneio');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Torneio não encontrado</p>
          <Link to="/tournaments">
            <Button className="bg-green-500 hover:bg-green-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Torneios
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const filteredMatches = selectedCategory === 'all' 
    ? Object.values(matches).flat()
    : matches[selectedCategory] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Link to="/tournaments">
            <Button variant="ghost" className="text-gray-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">{tournament.name}</h1>
          <div className="flex items-center gap-4 text-gray-400">
            <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {format(new Date(tournament.date), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
            {tournament.location && (
              <span className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                {tournament.location}
              </span>
            )}
            <Badge className={tournament.is_completed ? 'bg-green-500' : 'bg-yellow-500'}>
              {tournament.is_completed ? (
                <><CheckCircle className="w-3 h-3 mr-1 inline" />Concluído</>
              ) : (
                <><Clock className="w-3 h-3 mr-1 inline" />Em andamento</>
              )}
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('results')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'results'
              ? 'text-green-400 border-b-2 border-green-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4 inline mr-2" />
          Resultados
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'matches'
              ? 'text-green-400 border-b-2 border-green-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Swords className="w-4 h-4 inline mr-2" />
          Partidas ({Object.values(matches).flat().length})
        </button>
      </div>

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          {results.length === 0 ? (
            <Card className="bg-slate-800/50 border-green-500/20">
              <CardContent className="py-12">
                <div className="text-center text-gray-400">
                  <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Nenhum resultado cadastrado para este torneio</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            results.map((group, idx) => (
              <Card key={idx} className="bg-slate-800/50 border-green-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-green-400" />
                    {group.class} - {group.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {group.results.map((result, ridx) => (
                      <div
                        key={ridx}
                        className="flex items-center justify-between p-3 bg-slate-900/50 rounded hover:bg-slate-900/70 transition-colors"
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
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Matches Tab */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="text-gray-300 font-semibold">Filtrar por Categoria:</label>
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

          {/* Matches List */}
          {filteredMatches.length === 0 ? (
            <Card className="bg-slate-800/50 border-green-500/20">
              <CardContent className="py-12">
                <div className="text-center text-gray-400">
                  <Swords className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma partida registrada{selectedCategory !== 'all' ? ' nesta categoria' : ''}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-800/50 border-green-500/20">
              <CardHeader>
                <CardTitle className="text-white">
                  Partidas {selectedCategory !== 'all' && `- ${selectedCategory}`} ({filteredMatches.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredMatches.map((match) => (
                    <div
                      key={match.id}
                      className="bg-slate-900/50 rounded-lg p-4 hover:bg-slate-900/70 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-500">{match.category}</Badge>
                          <Badge className="bg-purple-500">{match.round}</Badge>
                        </div>
                        <span className="text-gray-400 text-sm">
                          {format(new Date(match.date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-white">
                          <span className={match.winner_id === match.player1_id ? 'font-bold text-green-400' : ''}>
                            {match.player1_name}
                          </span>
                          <span className="text-gray-400 mx-3">vs</span>
                          <span className={match.winner_id === match.player2_id ? 'font-bold text-green-400' : ''}>
                            {match.player2_name}
                          </span>
                        </div>
                        <span className="text-gray-300 font-mono text-sm">
                          {match.score.join(' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default TournamentDetails;
