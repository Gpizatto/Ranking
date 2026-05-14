// frontend/src/components/PostTemplates.js
// VERSÃO FINAL - Todas as correções aplicadas:
// ✅ Footer com background sólido (não sobrepõe nomes)
// ✅ Padding bottom em todos os containers (espaço para footer)
// ✅ Story layouts ajustados (tamanhos responsivos 1080x1920)
// ✅ Overflow protection em nomes longos (ellipsis)
// ✅ Grid responsivo para story (menos colunas)
// ✅ CachedPhoto para qualidade consistente

import React, { useState, useEffect } from 'react';

// ═════════════════════════════════════════════════════════════════════════════
// CACHEDPHOTO COMPONENT - Cache de fotos via blob URLs
// ═════════════════════════════════════════════════════════════════════════════
const CachedPhoto = ({ url, style, fallbackInitials }) => {
  const [objectUrl, setObjectUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!url || !url.startsWith('data:image')) {
      setObjectUrl(url || null);
      return;
    }
    
    let cancelled = false;
    setLoading(true);
    
    fetch(url)
      .then(r => r.blob())
      .then(blob => {
        if (!cancelled) {
          const blobUrl = URL.createObjectURL(blob);
          setObjectUrl(blobUrl);
          setLoading(false);
        }
      })
      .catch(err => {
        console.warn('Failed to cache photo:', err);
        if (!cancelled) {
          setLoading(false);
        }
      });
    
    return () => {
      cancelled = true;
      if (objectUrl && objectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [url]);
  
  return (
    <div style={{
      ...style,
      backgroundImage: objectUrl ? `url(${objectUrl})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {!objectUrl && !loading && fallbackInitials}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════
const alpha = (c, a) => {
  if (!c) return `rgba(0,0,0,${a})`;
  if (c.startsWith('rgba') || c.startsWith('rgb')) return c;
  const h = c.replace('#','');
  const full = h.length === 3 ? h.split('').map(x=>x+x).join('') : h.padEnd(6,'0');
  const r = parseInt(full.slice(0,2),16);
  const g = parseInt(full.slice(2,4),16);
  const b = parseInt(full.slice(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
};

const PALETTE_DATA = {
  storm: {
    bg: '#070d1a', surface: '#0d1a30', surface2: '#13243f',
    line: 'rgba(120,170,255,0.14)', ink: '#ffffff', sub: '#9bb6dd',
    accent: '#4aa3ff', accent2: '#22e1ff', gold: '#f5b400',
    podium: ['#f5b400', '#cdd5e0', '#cd7f32'],
    grad: 'linear-gradient(135deg,#070d1a 0%,#0d2347 55%,#070d1a 100%)',
  },
  inferno: {
    bg: '#000000', surface: '#0a0008', surface2: '#14000f',
    line: 'rgba(255,45,111,0.25)', ink: '#ffffff', sub: '#e0a8c5',
    accent: '#ff0066', accent2: '#00ff00', gold: '#00ff00',
    podium: ['#00ff00', '#ff0066', '#ff8800'],
    grad: 'linear-gradient(135deg,#000000 0%,#1a0014 55%,#000000 100%)',
  },
  champion: {
    bg: '#1a1510', surface: '#2a2218', surface2: '#382e20',
    line: 'rgba(255,215,0,0.25)', ink: '#ffe8b0', sub: '#d4b87a',
    accent: '#ffd700', accent2: '#ffed4e', gold: '#ffd700',
    podium: ['#ffd700', '#e8e8e8', '#cd7f32'],
    grad: 'linear-gradient(135deg,#1a1510 0%,#3d2a10 55%,#1a1510 100%)',
  },
  glacier: {
    bg: '#e8e5dc', surface: '#f8f5ed', surface2: '#d8d5cc',
    line: 'rgba(13,20,24,0.18)', ink: '#000000', sub: '#4a4f55',
    accent: '#0d5c1a', accent2: '#004d5c', gold: '#8b6914',
    podium: ['#8b6914', '#6b7178', '#8b4513'],
    grad: 'linear-gradient(135deg,#e8e5dc 0%,#d0cdc4 55%,#e8e5dc 100%)',
  },
};

const getTokens = (theme) => {
  if (PALETTE_DATA[theme]) return PALETTE_DATA[theme];
  
  if (typeof document === 'undefined') return PALETTE_DATA.storm;
  const el = document.querySelector(`[data-theme="${theme}"]`) || document.documentElement;
  const cs = getComputedStyle(el);
  const get = (k) => cs.getPropertyValue(k).trim();
  
  const bg = get('--t-bg');
  if (!bg) return PALETTE_DATA.storm;
  
  return {
    bg, surface: get('--t-surface'), surface2: get('--t-surface2'),
    line: get('--t-line'), ink: get('--t-ink'), sub: get('--t-sub'),
    accent: get('--t-accent'), accent2: get('--t-accent2'), gold: get('--t-gold'),
    podium: [get('--t-podium-1'), get('--t-podium-2'), get('--t-podium-3')],
    grad: get('--t-grad'),
  };
};

const initials = (name='') => {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0]||'') + (parts[parts.length-1]?.[0]||'')).toUpperCase();
};

// Photo component usando CachedPhoto
const Photo = ({ player, palette, style, big }) => {
  const photoUrl = player?.photo_url || player?.photoUrl;
  const playerInitials = initials(player?.player_name || player?.name || '');
  
  return (
    <CachedPhoto
      url={photoUrl}
      style={{
        ...style,
        backgroundColor: palette.surface2,
      }}
      fallbackInitials={
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Anton, sans-serif',
          fontSize: big ? 96 : 48,
          color: alpha(palette.ink, 0.25),
          letterSpacing: '0.02em'
        }}>
          {playerInitials}
        </div>
      }
    />
  );
};

const Trend = ({ value, palette, size=12 }) => {
  if (value == null || value === 0) return <span style={{ color: palette.sub, fontSize: size }}>—</span>;
  const up = value > 0;
  return <span style={{ color: up ? palette.accent2 : '#ff5577', fontFamily: 'JetBrains Mono, monospace', fontSize: size, fontWeight: 700 }}>
    {up ? '▲' : '▼'}{Math.abs(value)}
  </span>;
};

const Footer = ({ palette }) => (
  <div style={{
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: '16px 60px',
    borderTop: `1px solid ${palette.line}`,
    background: palette.bg,
    zIndex: 100,
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    fontFamily: 'JetBrains Mono, monospace', 
    fontSize: 11, 
    letterSpacing: '0.28em', 
    color: palette.sub,
  }}>
    <span>FEDERACAOSQUASHPR.COM.BR</span>
    <span>@FSP.SQUASH</span>
    <span>#RANKINGFSP</span>
  </div>
);

const FSPMark = ({ palette, size=56, logoSrc }) => (
  logoSrc ? (
    <img src={logoSrc} alt="FSP" style={{ width: size, height: size, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: 8, background: palette.accent,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <span style={{ fontFamily: 'Anton, sans-serif', color: palette.bg, fontSize: size*0.42, letterSpacing: '0.04em', lineHeight: 1 }}>FSP</span>
    </div>
  )
);

// ═════════════════════════════════════════════════════════════════════════════
// TEMPLATE 1: ULTIMATE CARD
// ═════════════════════════════════════════════════════════════════════════════
export const PostUltimate = ({ players, theme, format, classLabel, categoryLabel, showSecondHalf, monthLabel, logoSrc }) => {
  const palette = getTokens(theme);
  const isFeed = format === 'feed';
  const W = 1080, H = isFeed ? 1080 : 1920;
  const champ = players[0]; if (!champ) return null;
  const rest = players.slice(1, showSecondHalf ? 10 : 5);
  
  const heroHeight = isFeed ? 600 : 800;
  const nameSize = isFeed ? 64 : 80;
  const numberSize = isFeed ? 160 : 200;

  return (
    <div style={{ 
      width: W, 
      height: H, 
      background: palette.bg, 
      position: 'relative', 
      overflow: 'hidden', 
      fontFamily: 'Space Grotesk, sans-serif', 
      color: palette.ink,
      paddingBottom: 70
    }}>
      <div style={{ padding: isFeed ? '40px 60px' : '60px 60px', borderBottom: `2px solid ${palette.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FSPMark palette={palette} size={isFeed ? 56 : 72} logoSrc={logoSrc} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: isFeed ? 11 : 13, letterSpacing: '0.32em', color: palette.sub }}>RANKING OFICIAL · {monthLabel}</div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: isFeed ? 40 : 52, letterSpacing: '0.04em', marginTop: 6, color: palette.ink }}>
            {classLabel.toUpperCase()} <span style={{ color: palette.accent }}>{categoryLabel.toUpperCase()}</span>
          </div>
        </div>
        <div style={{ width: isFeed ? 56 : 72 }} />
      </div>

      <Photo player={champ} palette={palette} big style={{ width: '100%', height: heroHeight, borderBottom: `1px solid ${palette.line}` }} />

      <div style={{ position: 'relative', padding: isFeed ? '30px 60px' : '50px 60px 0' }}>
        <div style={{ position: 'absolute', top: isFeed ? -80 : -100, left: 60, fontFamily: 'Anton, sans-serif', fontSize: numberSize, color: alpha(palette.accent, 0.15), lineHeight: 0.85, letterSpacing: '-0.05em', zIndex: 0 }}>01</div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ 
            fontFamily: 'Anton, sans-serif', 
            fontSize: nameSize, 
            lineHeight: 0.95, 
            color: palette.ink, 
            marginBottom: 20,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {champ.player_name.toUpperCase()}
          </div>
          
          <div style={{ display: 'flex', gap: isFeed ? 24 : 32, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.24em', color: palette.sub, marginBottom: 4 }}>PONTOS</div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: isFeed ? 52 : 64, color: palette.accent, lineHeight: 1 }}>{champ.total_points}</div>
            </div>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.24em', color: palette.sub, marginBottom: 4 }}>TORNEIOS</div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: isFeed ? 52 : 64, color: palette.ink, lineHeight: 1 }}>{champ.results_count}</div>
            </div>
            {champ.win_rate != null && (
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.24em', color: palette.sub, marginBottom: 4 }}>% VITÓRIAS</div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: isFeed ? 52 : 64, color: palette.ink, lineHeight: 1 }}>{champ.win_rate}%</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {rest.length > 0 && (
        <div style={{ padding: isFeed ? '30px 60px 80px' : '40px 60px 80px' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.32em', color: palette.sub, marginBottom: 16 }}>PERSEGUIDORES</div>
          <div style={{ display: 'grid', gridTemplateColumns: isFeed ? '1fr' : 'repeat(2, 1fr)', gap: isFeed ? 2 : 8 }}>
            {rest.map((p, i) => (
              <div key={p.player_id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 14, 
                padding: isFeed ? '10px 12px' : '14px 16px', 
                background: i % 2 ? 'transparent' : alpha(palette.surface, 0.5), 
                borderLeft: `3px solid ${i < 2 ? palette.podium[i + 1] : 'transparent'}` 
              }}>
                <span style={{ fontFamily: 'Anton, sans-serif', fontSize: isFeed ? 24 : 28, color: palette.sub, lineHeight: 1, minWidth: 40 }}>{String(i + 2).padStart(2, '0')}</span>
                <span style={{ 
                  flex: 1, 
                  fontFamily: 'Space Grotesk, sans-serif', 
                  fontWeight: 700, 
                  fontSize: isFeed ? 15 : 17, 
                  color: palette.ink,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>{p.player_name}</span>
                <span style={{ fontFamily: 'Anton, sans-serif', fontSize: isFeed ? 22 : 26, color: palette.accent }}>{p.total_points}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Footer palette={palette} />
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// TEMPLATE 2: STADIUM
// ═════════════════════════════════════════════════════════════════════════════
export const PostStadium = ({ players, theme, format, classLabel, categoryLabel, showSecondHalf, monthLabel, logoSrc }) => {
  const palette = getTokens(theme);
  const isFeed = format === 'feed';
  const W = 1080, H = isFeed ? 1080 : 1920;
  const champ = players[0]; if (!champ) return null;
  const rest = players.slice(1, showSecondHalf ? 10 : 5);

  return (
    <div style={{ 
      width: W, 
      height: H, 
      background: palette.grad, 
      position: 'relative', 
      overflow: 'hidden', 
      fontFamily: 'Space Grotesk, sans-serif', 
      color: palette.ink,
      paddingBottom: 70
    }}>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 0%, ${alpha(palette.bg, 0.85)} 100%)`, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', padding: isFeed ? '40px 60px' : '60px 60px', borderBottom: `1px solid ${palette.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FSPMark palette={palette} size={isFeed ? 56 : 72} logoSrc={logoSrc} />
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: isFeed ? 11 : 13, letterSpacing: '0.32em', color: palette.sub, textAlign: 'right' }}>
          {monthLabel}<br />RANKING FSP
        </div>
      </div>

      <div style={{ position: 'relative', padding: isFeed ? '60px 60px 40px' : '100px 60px 60px', display: 'grid', gridTemplateColumns: isFeed ? '1fr' : '1fr 1.2fr', gap: isFeed ? 32 : 48, alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: isFeed ? 12 : 14, letterSpacing: '0.32em', color: palette.accent, marginBottom: 12 }}>CAMPEÃO {classLabel.toUpperCase()}</div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: isFeed ? 120 : 160, lineHeight: 0.88, letterSpacing: '-0.02em', color: palette.ink }}>
            <span style={{ color: palette.accent }}>{categoryLabel.toUpperCase()}</span>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <Photo player={champ} palette={palette} big style={{ width: '100%', height: isFeed ? 420 : 600, border: `2px solid ${palette.accent}`, borderRadius: 12 }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: `linear-gradient(180deg, transparent 0%, ${palette.bg} 100%)`, padding: isFeed ? '60px 24px 24px' : '80px 32px 32px' }}>
            <div style={{ 
              fontFamily: 'Anton, sans-serif', 
              fontSize: isFeed ? 48 : 64, 
              lineHeight: 1, 
              color: palette.ink, 
              marginBottom: 12,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {champ.player_name.toUpperCase()}
            </div>
            <div style={{ display: 'flex', gap: 20, alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'Anton, sans-serif', fontSize: isFeed ? 56 : 72, color: palette.accent, lineHeight: 1 }}>{champ.total_points}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: isFeed ? 12 : 14, letterSpacing: '0.24em', color: palette.sub }}>PONTOS · {champ.results_count} TORNEIOS</span>
            </div>
          </div>
        </div>
      </div>

      {rest.length > 0 && (
        <div style={{ position: 'relative', padding: isFeed ? '20px 60px 80px' : '40px 60px 80px' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.32em', color: palette.sub, marginBottom: 14 }}>PERSEGUIDORES</div>
          <div style={{ border: `1px solid ${palette.line}`, borderRadius: 8, overflow: 'hidden', background: alpha(palette.surface, 0.3) }}>
            {rest.map((p, i) => (
              <div key={p.player_id} style={{ 
                display: 'grid', 
                gridTemplateColumns: '60px 1fr 90px', 
                alignItems: 'center', 
                gap: 16, 
                padding: isFeed ? '12px 18px' : '16px 24px', 
                borderBottom: i === rest.length - 1 ? 'none' : `1px solid ${palette.line}` 
              }}>
                <span style={{ fontFamily: 'Anton, sans-serif', fontSize: isFeed ? 24 : 28, color: palette.sub, lineHeight: 1 }}>{String(i + 2).padStart(2, '0')}</span>
                <span style={{ 
                  fontFamily: 'Space Grotesk, sans-serif', 
                  fontWeight: 700, 
                  fontSize: isFeed ? 16 : 18, 
                  color: palette.ink,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>{p.player_name}</span>
                <span style={{ fontFamily: 'Anton, sans-serif', fontSize: isFeed ? 22 : 26, color: palette.accent, textAlign: 'right' }}>{p.total_points}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Footer palette={palette} />
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// TEMPLATE 3: EDITORIAL
// ═════════════════════════════════════════════════════════════════════════════
export const PostEditorial = ({ players, theme, format, classLabel, categoryLabel, showSecondHalf, monthLabel }) => {
  const palette = getTokens(theme);
  const isFeed = format === 'feed';
  const W = 1080, H = isFeed ? 1080 : 1920;
  const champ = players[0]; if (!champ) return null;
  const list = players.slice(1, showSecondHalf ? 10 : 5);
  
  const titleSize = isFeed ? 180 : 160;
  const photoHeight = isFeed ? 480 : 550;
  const numberSize = isFeed ? 320 : 340;
  const nameSize = isFeed ? 56 : 60;
  const numberTop = isFeed ? -120 : -120;

  return (
    <div style={{ 
      width: W, 
      height: H, 
      background: palette.bg, 
      position: 'relative', 
      overflow: 'hidden', 
      fontFamily: 'Space Grotesk, sans-serif', 
      color: palette.ink,
      paddingBottom: 70
    }}>
      <div style={{ padding: isFeed ? '40px 60px' : '40px 60px', borderBottom: `2px solid ${palette.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: isFeed ? 28 : 32, letterSpacing: '0.18em', color: palette.ink }}>F · S · P</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: isFeed ? 10 : 11, letterSpacing: '0.28em', color: palette.sub, flex: 1, textAlign: 'center' }}>
          EDIÇÃO MENSAL · {monthLabel}
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: isFeed ? 10 : 11, letterSpacing: '0.28em', color: palette.sub }}>VOL. {new Date().getFullYear()}</div>
      </div>

      <div style={{ 
        fontFamily: 'Anton, sans-serif', 
        fontSize: titleSize, 
        lineHeight: 0.88, 
        letterSpacing: '-0.02em', 
        padding: isFeed ? '40px 60px 0' : '30px 60px 0', 
        color: palette.ink 
      }}>
        MELHOR DO<br />PARANÁ<br /><span style={{ color: palette.accent }}>NA {classLabel.toUpperCase()}</span>
      </div>

      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: isFeed ? 13 : 14, letterSpacing: '0.24em', color: palette.sub, padding: '0 60px', marginTop: 12 }}>
        {categoryLabel.toUpperCase()} · {monthLabel.toUpperCase()}
      </div>

      <div style={{ position: 'relative', margin: isFeed ? '20px 60px 0' : '25px 60px 0', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: isFeed ? 36 : 40, alignItems: 'end' }}>
        <Photo player={champ} palette={palette} big style={{ width: '100%', height: photoHeight, border: `1px solid ${palette.line}` }} />
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: numberTop, left: -20, fontFamily: 'Anton, sans-serif', fontSize: numberSize, color: palette.accent, lineHeight: 0.85, letterSpacing: '-0.05em', zIndex: 0 }}>01</div>
          <div style={{ position: 'relative', paddingTop: isFeed ? 220 : 240, zIndex: 1 }}>
            <div style={{ 
              fontFamily: 'Anton, sans-serif', 
              fontSize: nameSize, 
              lineHeight: 0.95, 
              color: palette.ink,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              {champ.player_name.toUpperCase()}
            </div>
            <div style={{ display: 'flex', gap: isFeed ? 20 : 24, marginTop: 16, fontFamily: 'JetBrains Mono, monospace', fontSize: isFeed ? 11 : 12, letterSpacing: '0.18em', color: palette.sub, flexWrap: 'wrap' }}>
              <span><b style={{ color: palette.accent, fontSize: isFeed ? 20 : 22, fontFamily: 'Anton, sans-serif' }}>{champ.total_points}</b> PTS</span>
              <span><b style={{ color: palette.ink, fontSize: isFeed ? 20 : 22, fontFamily: 'Anton, sans-serif' }}>{champ.results_count}</b> TORN.</span>
              {champ.win_rate != null && <span><b style={{ color: palette.ink, fontSize: isFeed ? 20 : 22, fontFamily: 'Anton, sans-serif' }}>{champ.win_rate}%</b> VIT.</span>}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: isFeed ? '30px 60px 80px' : '40px 60px 80px' }}>
        <div style={{ borderTop: `1px solid ${palette.line}`, borderBottom: `1px solid ${palette.line}`, padding: '10px 0', marginBottom: 18 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.32em', color: palette.sub, display: 'flex', justifyContent: 'space-between' }}>
            <span>NESTA EDIÇÃO</span><span>PERSEGUIDORES</span>
          </div>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: showSecondHalf ? (isFeed ? 'repeat(2,1fr)' : 'repeat(2,1fr)') : 'repeat(2,1fr)',
          gap: '4px 36px' 
        }}>
          {list.map((p, i) => (
            <div key={p.player_id} style={{ display: 'flex', alignItems: 'baseline', gap: 14, padding: '10px 0', borderBottom: `1px dashed ${palette.line}` }}>
              <span style={{ fontFamily: 'Anton, sans-serif', fontSize: isFeed ? 28 : 26, color: i < 2 ? palette.podium[i + 1] : palette.sub, lineHeight: 1, minWidth: 42 }}>{String(i + 2).padStart(2, '0')}</span>
              <span style={{ 
                flex: 1, 
                fontFamily: 'Space Grotesk, sans-serif', 
                fontWeight: 600, 
                fontSize: isFeed ? 16 : 15, 
                color: palette.ink, 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis' 
              }}>{p.player_name}</span>
              <span style={{ fontFamily: 'Anton, sans-serif', fontSize: isFeed ? 22 : 20, color: palette.accent }}>{p.total_points}</span>
            </div>
          ))}
        </div>
      </div>

      <Footer palette={palette} />
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// TEMPLATE 4: PODIUM
// ═════════════════════════════════════════════════════════════════════════════
export const PostPodium = ({ players, theme, format, classLabel, categoryLabel, showSecondHalf, monthLabel, logoSrc }) => {
  const palette = getTokens(theme);
  const isFeed = format === 'feed';
  const W = 1080, H = isFeed ? 1080 : 1920;
  const podium = players.slice(0, 3);
  if (podium.length < 3) return null;
  const order = [podium[1], podium[0], podium[2]];
  const heights = [isFeed ? 260 : 340, isFeed ? 340 : 460, isFeed ? 220 : 300];
  const list = players.slice(3, showSecondHalf ? 10 : 5);

  return (
    <div style={{ 
      width: W, 
      height: H, 
      background: palette.grad, 
      position: 'relative', 
      overflow: 'hidden', 
      fontFamily: 'Space Grotesk, sans-serif', 
      color: palette.ink,
      paddingBottom: 70
    }}>
      <div style={{ padding: isFeed ? '50px 60px 0' : '60px 60px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FSPMark palette={palette} size={isFeed ? 64 : 72} logoSrc={logoSrc} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: isFeed ? 12 : 13, letterSpacing: '0.32em', color: palette.sub }}>PÓDIO OFICIAL</div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: isFeed ? 52 : 58, letterSpacing: '0.04em', marginTop: 6, color: palette.ink }}>
            {classLabel.toUpperCase()} <span style={{ color: palette.accent }}>{categoryLabel.toUpperCase()}</span>
          </div>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: isFeed ? 12 : 13, letterSpacing: '0.28em', color: palette.sub, textAlign: 'right' }}>{monthLabel}<br />RANKING FSP</div>
      </div>

      <div style={{ marginTop: isFeed ? 30 : 50, padding: '0 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr 1fr', gap: isFeed ? 14 : 16, alignItems: 'end' }}>
          {order.map((p, idx) => {
            const realIdx = idx === 0 ? 1 : idx === 1 ? 0 : 2;
            const medal = palette.podium[realIdx];
            return (
              <div key={p.player_id} style={{ display: 'flex', flexDirection: 'column' }}>
                <Photo player={p} palette={palette} style={{ width: '100%', height: isFeed ? 280 : 380, border: `2px solid ${medal}`, borderBottom: 'none' }} />
                <div style={{ 
                  background: realIdx === 0 ? `linear-gradient(180deg, ${alpha(medal, 0.25)} 0%, ${palette.surface} 60%)` : palette.surface, 
                  border: `2px solid ${medal}`, 
                  borderTop: 'none', 
                  padding: '14px 16px', 
                  height: heights[idx], 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between' 
                }}>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: realIdx === 0 ? (isFeed ? 140 : 160) : (isFeed ? 100 : 120), lineHeight: 0.85, color: medal, letterSpacing: '-0.03em' }}>{realIdx + 1}</div>
                  <div>
                    <div style={{ 
                      fontFamily: 'Anton, sans-serif', 
                      fontSize: realIdx === 0 ? (isFeed ? 32 : 36) : (isFeed ? 24 : 28), 
                      lineHeight: 1, 
                      color: palette.ink,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {p.player_name.toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 10 }}>
                      <span style={{ fontFamily: 'Anton, sans-serif', fontSize: realIdx === 0 ? (isFeed ? 36 : 40) : (isFeed ? 28 : 32), color: palette.accent, lineHeight: 1 }}>{p.total_points}</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.2em', color: palette.sub }}>PTS</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {list.length > 0 && (
        <div style={{ padding: isFeed ? '24px 60px 80px' : '50px 60px 80px' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.32em', color: palette.sub, marginBottom: 10 }}>PERSEGUIDORES</div>
          <div style={{ border: `1px solid ${palette.line}`, borderRadius: 8, overflow: 'hidden' }}>
            {list.map((p, i) => (
              <div key={p.player_id} style={{ 
                display: 'grid', 
                gridTemplateColumns: '60px 1fr 90px', 
                alignItems: 'center', 
                gap: 16, 
                padding: isFeed ? '12px 18px' : '14px 20px', 
                background: i % 2 ? 'transparent' : alpha(palette.surface, 0.6), 
                borderBottom: i === list.length - 1 ? 'none' : `1px solid ${palette.line}` 
              }}>
                <span style={{ fontFamily: 'Anton, sans-serif', fontSize: isFeed ? 28 : 30, color: palette.sub, lineHeight: 1 }}>{String(i + 4).padStart(2, '0')}</span>
                <span style={{ 
                  fontFamily: 'Space Grotesk, sans-serif', 
                  fontWeight: 700, 
                  fontSize: isFeed ? 18 : 19, 
                  color: palette.ink,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>{p.player_name}</span>
                <span style={{ fontFamily: 'Anton, sans-serif', fontSize: isFeed ? 24 : 26, color: palette.accent, textAlign: 'right' }}>{p.total_points}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Footer palette={palette} />
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═════════════════════════════════════════════════════════════════════════════
export const POST_TEMPLATES = {
  ultimate:  { Component: PostUltimate,  label: 'Ultimate Card' },
  stadium:   { Component: PostStadium,   label: 'Stadium' },
  editorial: { Component: PostEditorial, label: 'Editorial' },
  podium:    { Component: PostPodium,    label: 'Podium Royale' },
};

export const PALETTE_OPTIONS = [
  { key: 'storm',    label: 'FSP Storm',    swatch: ['#070d1a','#4aa3ff','#22e1ff'] },
  { key: 'inferno',  label: 'Court Inferno',swatch: ['#0a0a0c','#ff2d6f','#c6f432'] },
  { key: 'champion', label: 'Champion Gold',swatch: ['#0e0c08','#d4a017','#f5d36b'] },
  { key: 'glacier',  label: 'Glacier',      swatch: ['#f4f1ea','#2d8a3e','#0d6e7b'] },
];
