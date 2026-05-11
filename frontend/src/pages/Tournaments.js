import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios, { API } from '../lib/api';
import { cachedGet, getCached, TTL } from '../lib/cache';
import { Calendar, MapPin, Trophy, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const sortByDate = arr => [...arr].sort((a, b) => new Date(b.date) - new Date(a.date));

const Tournaments = () => {
  // Inicializa direto do cache no primeiro render — sem ciclo extra
  const [tournaments, setTournaments] = useState(() => {
    const cached = getCached(`${API}/tournaments`);
    return cached ? sortByDate(cached) : [];
  });
  const [loading, setLoading] = useState(() => !getCached(`${API}/tournaments`));
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;

    const fetchTournaments = async () => {
      const cached = getCached(`${API}/tournaments`);
      if (cached) {
        setTournaments(sortByDate(cached));
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await cachedGet(`${API}/tournaments`, TTL.TOURNAMENTS, axios);
        if (!cancelled) setTournaments(sortByDate(data));
      } catch {
        if (!cancelled) toast.error('Erro ao carregar torneios');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTournaments();
    return () => { cancelled = true; };
  }, []);

  const filtered = tournaments.filter(t => {
    if (filter === 'completed') return t.is_completed;
    if (filter === 'ongoing') return !t.is_completed;
    return true;
  });

  const completed = tournaments.filter(t => t.is_completed).length;
  const ongoing = tournaments.filter(t => !t.is_completed).length;

  const formatDateRange = (tournament) => {
    const start = format(new Date(tournament.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    if (!tournament.end_date) return start;
    const startD = new Date(tournament.date);
    const endD = new Date(tournament.end_date);
    // Mesmo mês e ano: "12 a 14 de março de 2025"
    if (
      startD.getMonth() === endD.getMonth() &&
      startD.getFullYear() === endD.getFullYear()
    ) {
      return `${format(startD, 'dd')} a ${format(endD, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
    }
    // Meses diferentes: "28 de fevereiro a 2 de março de 2025"
    return `${format(startD, "dd 'de' MMMM", { locale: ptBR })} a ${format(endD, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
  };

  return (
    <div className="space-y-8">

      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2" data-testid="tournaments-title">Torneios</h1>
          <p className="text-gray-400">Histórico completo de torneios disputados</p>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <div className="text-3xl font-black text-white">{tournaments.length}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">Total</div>
          </div>
          <div>
            <div className="text-3xl font-black text-green-400">{completed}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">Concluídos</div>
          </div>
          <div>
            <div className="text-3xl font-black text-yellow-400">{ongoing}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">Em Andamento</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'completed', label: 'Concluídos' },
          { key: 'ongoing', label: 'Em Andamento' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              filter === f.key ? 'bg-green-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p>Nenhum torneio encontrado</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="tournaments-grid">
          {filtered.map((tournament) => (
            <Link key={tournament.id} to={`/tournaments/${tournament.id}`}>
              <div
                className="group relative bg-slate-800/60 border border-slate-700 hover:border-green-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 h-full"
                data-testid={`tournament-card-${tournament.id}`}
              >
                <div className={`h-1.5 w-full ${tournament.is_completed ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <Badge className={`text-xs ${tournament.is_completed ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                      {tournament.is_completed
                        ? <><CheckCircle className="w-3 h-3 mr-1 inline" />Concluído</>
                        : <><Clock className="w-3 h-3 mr-1 inline" />Em andamento</>
                      }
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-green-400 transition-colors mt-0.5" />
                  </div>
                  <h3 className="text-white font-bold text-lg leading-tight mb-4 group-hover:text-green-400 transition-colors">
                    {tournament.name}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-400 text-sm">
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0 text-green-500/60" />
                      {formatDateRange(tournament)}
                    </div>
                    {tournament.location && (
                      <div className="flex items-center text-gray-400 text-sm">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0 text-green-500/60" />
                        {tournament.location}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tournaments;
