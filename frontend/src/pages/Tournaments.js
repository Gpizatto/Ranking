import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios, { API } from '../lib/api';
import { cachedGet, getCached, TTL } from '../lib/cache';
import { Calendar, MapPin, Trophy, CheckCircle, Clock, ChevronRight } from 'lucide-react';
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
    <div style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--t-ink)' }}>
      {/* Header com stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, gap: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            letterSpacing: '0.22em',
            color: 'var(--t-sub)',
            marginBottom: 10,
          }}>
            ● HISTÓRICO COMPLETO
          </div>
          <h1 style={{
            fontFamily: 'Anton, sans-serif',
            fontSize: 'clamp(48px, 8vw, 72px)',
            letterSpacing: '0.02em',
            lineHeight: 0.95,
            margin: 0,
          }}>
            TORNEIOS
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 36, color: 'var(--t-ink)' }}>
              {tournaments.length}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em', color: 'var(--t-sub)' }}>
              TOTAL
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 36, color: 'var(--t-accent2)' }}>
              {completed}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em', color: 'var(--t-sub)' }}>
              CONCLUÍDOS
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 36, color: 'var(--t-gold)' }}>
              {ongoing}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em', color: 'var(--t-sub)' }}>
              EM ANDAMENTO
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'TODOS' },
          { key: 'completed', label: 'CONCLUÍDOS' },
          { key: 'ongoing', label: 'EM ANDAMENTO' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '8px 18px',
              fontFamily: 'Anton, sans-serif',
              fontSize: 13,
              letterSpacing: '0.14em',
              border: `1px solid ${filter === f.key ? 'var(--t-accent)' : 'var(--t-line)'}`,
              background: filter === f.key ? 'var(--t-accent)' : 'transparent',
              color: filter === f.key ? 'var(--t-bg)' : 'var(--t-ink)',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (filter !== f.key) {
                e.target.style.borderColor = 'var(--t-accent)';
                e.target.style.color = 'var(--t-accent)';
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== f.key) {
                e.target.style.borderColor = 'var(--t-line)';
                e.target.style.color = 'var(--t-ink)';
              }
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--t-sub)' }}>
          Carregando...
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Trophy size={64} style={{ color: 'var(--t-line)', marginBottom: 16 }} />
          <p style={{ color: 'var(--t-sub)', margin: 0 }}>Nenhum torneio encontrado</p>
        </div>
      )}

      {/* Grid */}
      {!loading && filtered.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 18,
        }} data-testid="tournaments-grid">
          {filtered.map((tournament) => (
            <Link 
              key={tournament.id} 
              to={`/tournaments/${tournament.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
              data-testid={`tournament-card-${tournament.id}`}
            >
              <div style={{
                background: 'color-mix(in srgb, var(--t-surface) 85%, transparent)',
                border: '1px solid var(--t-line)',
                borderRadius: 12,
                overflow: 'hidden',
                transition: 'all 0.2s',
                height: '100%',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--t-accent)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--t-line)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                {/* Status bar */}
                <div style={{
                  height: 6,
                  background: tournament.is_completed ? 'var(--t-accent2)' : 'var(--t-gold)',
                }} />

                <div style={{ padding: 20 }}>
                  {/* Badge + Arrow */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      background: tournament.is_completed 
                        ? 'color-mix(in srgb, var(--t-accent2) 20%, transparent)' 
                        : 'color-mix(in srgb, var(--t-gold) 20%, transparent)',
                      color: tournament.is_completed ? 'var(--t-accent2)' : 'var(--t-gold)',
                      border: `1px solid ${tournament.is_completed ? 'var(--t-accent2)' : 'var(--t-gold)'}`,
                      borderRadius: 4,
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 10,
                      letterSpacing: '0.12em',
                    }}>
                      {tournament.is_completed ? <CheckCircle size={12} /> : <Clock size={12} />}
                      {tournament.is_completed ? 'CONCLUÍDO' : 'EM ANDAMENTO'}
                    </span>
                    <ChevronRight size={18} style={{ color: 'var(--t-sub)' }} />
                  </div>

                  {/* Nome */}
                  <h3 style={{
                    fontFamily: 'Anton, sans-serif',
                    fontSize: 20,
                    letterSpacing: '0.04em',
                    lineHeight: 1.2,
                    color: 'var(--t-ink)',
                    margin: '0 0 16px 0',
                  }}>
                    {tournament.name.toUpperCase()}
                  </h3>

                  {/* Data */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <Calendar size={16} style={{ color: 'var(--t-accent)', flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: 'var(--t-sub)' }}>
                      {formatDateRange(tournament)}
                    </span>
                  </div>

                  {/* Local */}
                  {tournament.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <MapPin size={16} style={{ color: 'var(--t-accent)', flexShrink: 0 }} />
                      <span style={{ fontSize: 14, color: 'var(--t-sub)' }}>
                        {tournament.location}
                      </span>
                    </div>
                  )}
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
