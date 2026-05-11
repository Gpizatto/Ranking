import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import axios, { API } from "../lib/api";
import { cachedGet, getCached, TTL } from "../lib/cache";

import { Users, Search, MapPin } from "lucide-react";
import PlayerModal from "../components/PlayerModal";
import { toast } from "sonner";

const sortAlpha = arr => [...arr].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

// Cache de fotos em memória para evitar re-fetches na mesma sessão
const photoCache = {};

const PlayerCard = React.memo(({ player, onClick }) => {
  const [photoUrl, setPhotoUrl] = useState(photoCache[player.id] || null);
  const cardRef = useRef(null);

  const loadPhoto = useCallback(async () => {
    if (photoCache[player.id]) {
      setPhotoUrl(photoCache[player.id]);
      return;
    }
    try {
      const res = await axios.get(`${API}/players/photo/${player.id}`);
      const url = res.data.photo_url;
      photoCache[player.id] = url;
      setPhotoUrl(url);
    } catch {
      // sem foto — mantém fallback
    }
  }, [player.id]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    // Carregar foto apenas quando o card entrar na viewport
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadPhoto();
          observer.disconnect();
        }
      },
      { rootMargin: "150px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadPhoto]);

  const initials = player.name.trim().split(/\s+/).map(p => p[0] || '').filter((_, i, a) => i === 0 || i === a.length - 1).join('').toUpperCase();

  return (
    <div
      ref={cardRef}
      onClick={() => onClick(player)}
      style={{
        background: 'color-mix(in srgb, var(--t-surface) 85%, transparent)',
        border: '1px solid var(--t-line)',
        borderRadius: 12,
        padding: 18,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--t-accent)'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--t-line)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 8,
          background: 'var(--t-surface2)',
          backgroundImage: photoUrl ? `url(${photoUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'top',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14,
          color: 'var(--t-sub)',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          {!photoUrl && initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontFamily: 'Anton, sans-serif',
            fontSize: 18,
            letterSpacing: '0.06em',
            color: 'var(--t-ink)',
            margin: 0,
            marginBottom: 6,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {player.name.toUpperCase()}
          </h3>

          {player.main_class && (
            <span style={{
              display: 'inline-block',
              padding: '3px 10px',
              background: 'var(--t-accent)',
              color: 'var(--t-bg)',
              borderRadius: 4,
              fontFamily: 'Anton, sans-serif',
              fontSize: 11,
              letterSpacing: '0.12em',
            }}>
              {player.main_class}
            </span>
          )}
        </div>
      </div>

      {player.city && (
        <p style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 13,
          color: 'var(--t-sub)',
          margin: 0,
        }}>
          <MapPin size={14} />
          {player.city}
        </p>
      )}
    </div>
  );
});

const Players = () => {
  const [players, setPlayers] = useState(() => {
    const cached = getCached(`${API}/players`);
    return cached ? sortAlpha(cached) : [];
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(() => !getCached(`${API}/players`));
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    if (players.length > 0) return;
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const data = await cachedGet(`${API}/players`, TTL.PLAYERS, axios);
      setPlayers(sortAlpha(data));
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

  const handlePlayerClick = (player) => { setSelectedPlayer(player); };

  return (
    <div style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--t-ink)' }}>
      <style>{`
        .players-root input::placeholder { color: var(--t-sub); opacity: 0.6; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            letterSpacing: '0.22em',
            color: 'var(--t-sub)',
          }}>
            ● CADASTRADOS
          </div>
        </div>
        <h1 style={{
          fontFamily: 'Anton, sans-serif',
          fontSize: 'clamp(48px, 8vw, 72px)',
          letterSpacing: '0.02em',
          lineHeight: 0.95,
          margin: 0,
        }}>
          JOGADORES
        </h1>
      </div>

      {/* Search */}
      <div className="players-root" style={{
        background: 'color-mix(in srgb, var(--t-surface) 85%, transparent)',
        border: '1px solid var(--t-line)',
        borderRadius: 12,
        padding: 18,
        marginBottom: 32,
      }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={20}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--t-sub)',
            }}
          />
          <input
            type="text"
            placeholder="Buscar jogador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px 12px 44px',
              background: 'var(--t-bg)',
              border: '1px solid var(--t-line)',
              borderRadius: 8,
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 15,
              color: 'var(--t-ink)',
              outline: 'none',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--t-accent)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--t-line)'}
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--t-sub)' }}>
          Carregando...
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredPlayers.length === 0 && (
        <div style={{
          background: 'color-mix(in srgb, var(--t-surface) 85%, transparent)',
          border: '1px solid var(--t-line)',
          borderRadius: 12,
          padding: 48,
          textAlign: 'center',
        }}>
          <Users size={64} style={{ color: 'var(--t-line)', marginBottom: 16 }} />
          <p style={{ color: 'var(--t-sub)', margin: 0 }}>Nenhum jogador encontrado</p>
        </div>
      )}

      {/* Grid */}
      {!loading && filteredPlayers.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16,
        }}>
          {filteredPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onClick={handlePlayerClick}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <PlayerModal 
        playerId={selectedPlayer?.id} 
        player={selectedPlayer} 
        onClose={() => setSelectedPlayer(null)} 
      />
    </div>
  );
};

export default Players;
