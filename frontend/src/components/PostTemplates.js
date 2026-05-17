// frontend/src/components/PostTemplates.js
// VERSÃO REESCRITA — layout em FLUXO (flexbox), sem position:absolute transbordante.
//
// Por que foi reescrito:
//   Os templates antigos usavam números gigantes com position:absolute + paddingTop
//   para "empurrar" o conteúdo. Quando o conteúdo passava da altura fixa (1080/1920),
//   ele transbordava e o html2canvas capturava isso de forma imprevisível —
//   textos sobrepostos no PNG, layout quebrado ao trocar de formato.
//
// Como funciona agora:
//   Cada template é um container flex-column com altura EXATA (1080 ou 1920).
//   Cada seção (header, foto, stats, lista, footer) ocupa um espaço definido.
//   O conteúdo da lista é limitado para nunca estourar. Resultado: o que aparece
//   no preview é exatamente o que sai no PNG.

import React, { useState, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════════
// CACHEDPHOTO — cache de fotos via blob URL (qualidade consistente)
// ═══════════════════════════════════════════════════════════════════
const CachedPhoto = ({ url, style, fallback }) => {
  const [objectUrl, setObjectUrl] = useState(null);

  useEffect(() => {
    if (!url || !url.startsWith('data:image')) {
      setObjectUrl(url || null);
      return;
    }
    let cancelled = false;
    let created = null;
    fetch(url)
      .then(r => r.blob())
      .then(blob => {
        if (cancelled) return;
        created = URL.createObjectURL(blob);
        setObjectUrl(created);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [url]);

  return (
    <div style={{
      ...style,
      backgroundImage: objectUrl ? `url(${objectUrl})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'top center',
      backgroundRepeat: 'no-repeat',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {!objectUrl && fallback}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════════════════════════════
const alpha = (c, a) => {
  if (!c) return `rgba(0,0,0,${a})`;
  if (c.startsWith('rgba') || c.startsWith('rgb')) return c;
  const h = c.replace('#', '');
  const full = h.length === 3 ? h.split('').map(x => x + x).join('') : h.padEnd(6, '0');
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};

const PALETTE_DATA = {
  storm: {
    bg: '#070d1a', surface: '#0d1a30', surface2: '#13243f',
    line: 'rgba(120,170,255,0.18)', ink: '#ffffff', sub: '#9bb6dd',
    accent: '#4aa3ff', accent2: '#22e1ff',
    podium: ['#f5b400', '#cdd5e0', '#cd7f32'],
    grad: 'linear-gradient(135deg,#070d1a 0%,#0d2347 55%,#070d1a 100%)',
  },
  inferno: {
    bg: '#000000', surface: '#0c0008', surface2: '#1a000f',
    line: 'rgba(255,45,111,0.3)', ink: '#ffffff', sub: '#e0a8c5',
    accent: '#ff0066', accent2: '#00ff66',
    podium: ['#00ff66', '#ff0066', '#ff8800'],
    grad: 'linear-gradient(135deg,#000000 0%,#1a0014 55%,#000000 100%)',
  },
  champion: {
    bg: '#1a1510', surface: '#2a2218', surface2: '#382e20',
    line: 'rgba(255,215,0,0.3)', ink: '#ffe8b0', sub: '#d4b87a',
    accent: '#ffd700', accent2: '#ffed4e',
    podium: ['#ffd700', '#e8e8e8', '#cd7f32'],
    grad: 'linear-gradient(135deg,#1a1510 0%,#3d2a10 55%,#1a1510 100%)',
  },
  glacier: {
    bg: '#e8e5dc', surface: '#f8f5ed', surface2: '#d4d0c4',
    line: 'rgba(13,20,24,0.22)', ink: '#000000', sub: '#4a4f55',
    accent: '#0d5c1a', accent2: '#004d5c',
    podium: ['#8b6914', '#6b7178', '#8b4513'],
    grad: 'linear-gradient(135deg,#e8e5dc 0%,#d0cdc4 55%,#e8e5dc 100%)',
  },
};

const getTokens = (theme) => PALETTE_DATA[theme] || PALETTE_DATA.storm;

const initials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '')).toUpperCase();
};

// Trunca nome para caber: pega primeiro + último sobrenome se for muito longo
const fitName = (name = '', maxChars = 22) => {
  const clean = name.trim();
  if (clean.length <= maxChars) return clean.toUpperCase();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    const short = `${parts[0]} ${parts[parts.length - 1]}`;
    if (short.length <= maxChars) return short.toUpperCase();
    return short.slice(0, maxChars - 1).toUpperCase() + '…';
  }
  return clean.slice(0, maxChars - 1).toUpperCase() + '…';
};

// ═══════════════════════════════════════════════════════════════════
// COMPONENTES COMPARTILHADOS
// ═══════════════════════════════════════════════════════════════════
const Photo = ({ player, palette, height, width = '100%', big, border, radius = 0 }) => {
  const photoUrl = player?.photo_url || player?.photoUrl;
  return (
    <CachedPhoto
      url={photoUrl}
      style={{
        width,
        height,
        flexShrink: 0,
        backgroundColor: palette.surface2,
        border: border || 'none',
        borderRadius: radius,
      }}
      fallback={
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Anton, sans-serif',
          fontSize: big ? 110 : 52,
          color: alpha(palette.ink, 0.22),
          letterSpacing: '0.02em',
        }}>
          {initials(player?.player_name || player?.name || '')}
        </div>
      }
    />
  );
};

// Footer com altura FIXA — faz parte do fluxo, nunca sobrepõe nada.
const FOOTER_H = 64;
const Footer = ({ palette }) => (
  <div style={{
    height: FOOTER_H,
    flexShrink: 0,
    borderTop: `1px solid ${palette.line}`,
    background: palette.bg,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 60px',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 12,
    letterSpacing: '0.26em',
    color: palette.sub,
  }}>
    <span>FEDERACAOSQUASHPR.COM.BR</span>
    <span>@FSP.SQUASH</span>
    <span>#RANKINGFSP</span>
  </div>
);

const FSPMark = ({ palette, size = 60, logoSrc }) => (
  logoSrc ? (
    <img
      src={logoSrc}
      alt="FSP"
      crossOrigin="anonymous"
      style={{ width: size, height: size, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
    />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: 10, background: palette.accent,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <span style={{ fontFamily: 'Anton, sans-serif', color: palette.bg, fontSize: size * 0.4, lineHeight: 1 }}>FSP</span>
    </div>
  )
);

// Linha de jogador para as listas — altura fixa, tudo em uma linha só.
const ListRow = ({ pos, name, points, palette, accentPos, rowH = 56, fontSize = 18 }) => (
  <div style={{
    height: rowH,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '0 18px',
    borderLeft: `3px solid ${accentPos || 'transparent'}`,
    background: pos % 2 === 0 ? alpha(palette.surface, 0.45) : 'transparent',
  }}>
    <span style={{
      fontFamily: 'Anton, sans-serif',
      fontSize: fontSize + 6,
      color: palette.sub,
      lineHeight: 1,
      width: 46,
      flexShrink: 0,
    }}>
      {String(pos).padStart(2, '0')}
    </span>
    <span style={{
      flex: 1,
      minWidth: 0,
      fontFamily: 'Space Grotesk, sans-serif',
      fontWeight: 700,
      fontSize,
      color: palette.ink,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}>
      {name}
    </span>
    <span style={{
      fontFamily: 'Anton, sans-serif',
      fontSize: fontSize + 6,
      color: palette.accent,
      flexShrink: 0,
    }}>
      {points}
    </span>
  </div>
);

// Container raiz comum: altura EXATA, flex column, overflow hidden.
const Frame = ({ palette, isFeed, bg, children }) => (
  <div style={{
    width: 1080,
    height: isFeed ? 1080 : 1920,
    background: bg || palette.bg,
    color: palette.ink,
    fontFamily: 'Space Grotesk, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  }}>
    {children}
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE 1 — ULTIMATE
// Header · Foto grande · Bloco do campeão · Lista perseguidores · Footer
// ═══════════════════════════════════════════════════════════════════
export const PostUltimate = ({ players, theme, format, classLabel, categoryLabel, showSecondHalf, monthLabel, logoSrc }) => {
  const palette = getTokens(theme);
  const isFeed = format === 'feed';
  const champ = players[0];
  if (!champ) return null;

  const maxList = isFeed ? (showSecondHalf ? 4 : 3) : (showSecondHalf ? 9 : 5);
  const rest = players.slice(1, 1 + maxList);

  const photoH = isFeed ? 420 : 760;
  const rowH = isFeed ? 52 : 64;

  return (
    <Frame palette={palette} isFeed={isFeed}>
      {/* HEADER */}
      <div style={{
        flexShrink: 0,
        padding: isFeed ? '34px 60px' : '54px 60px',
        borderBottom: `2px solid ${palette.line}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <FSPMark palette={palette} size={isFeed ? 58 : 76} logoSrc={logoSrc} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: isFeed ? 12 : 15, letterSpacing: '0.3em', color: palette.sub }}>
            RANKING OFICIAL · {monthLabel}
          </div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: isFeed ? 44 : 58, marginTop: 8, color: palette.ink }}>
            {classLabel.toUpperCase()} <span style={{ color: palette.accent }}>{categoryLabel.toUpperCase()}</span>
          </div>
        </div>
        <div style={{ width: isFeed ? 58 : 76 }} />
      </div>

      {/* FOTO DO CAMPEÃO */}
      <Photo player={champ} palette={palette} big height={photoH} />

      {/* BLOCO DO CAMPEÃO */}
      <div style={{
        flexShrink: 0,
        padding: isFeed ? '26px 60px' : '44px 60px',
        borderBottom: `1px solid ${palette.line}`,
        display: 'flex', alignItems: 'center', gap: isFeed ? 24 : 40,
      }}>
        <div style={{
          fontFamily: 'Anton, sans-serif',
          fontSize: isFeed ? 100 : 150,
          color: palette.accent,
          lineHeight: 0.8,
          flexShrink: 0,
        }}>
          01
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'Anton, sans-serif',
            fontSize: isFeed ? 52 : 76,
            lineHeight: 1,
            color: palette.ink,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {fitName(champ.player_name, isFeed ? 20 : 24)}
          </div>
          <div style={{ display: 'flex', gap: isFeed ? 28 : 44, marginTop: isFeed ? 12 : 20 }}>
            <Stat label="PONTOS" value={champ.total_points} palette={palette} accent big={!isFeed} isFeed={isFeed} />
            <Stat label="TORNEIOS" value={champ.results_count} palette={palette} isFeed={isFeed} />
            {champ.win_rate != null && (
              <Stat label="% VITÓRIAS" value={`${champ.win_rate}%`} palette={palette} isFeed={isFeed} />
            )}
          </div>
        </div>
      </div>

      {/* LISTA — ocupa o espaço restante */}
      <div style={{ flex: 1, minHeight: 0, padding: isFeed ? '22px 60px' : '38px 60px', overflow: 'hidden' }}>
        {rest.length > 0 && (
          <>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12, letterSpacing: '0.3em', color: palette.sub, marginBottom: 14,
            }}>
              PERSEGUIDORES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {rest.map((p, i) => (
                <ListRow
                  key={p.player_id}
                  pos={i + 2}
                  name={fitName(p.player_name, isFeed ? 28 : 34)}
                  points={p.total_points}
                  palette={palette}
                  accentPos={i < 2 ? palette.podium[i + 1] : null}
                  rowH={rowH}
                  fontSize={isFeed ? 16 : 19}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Footer palette={palette} />
    </Frame>
  );
};

// Stat pequeno reutilizável
const Stat = ({ label, value, palette, accent, big, isFeed }) => (
  <div>
    <div style={{
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: isFeed ? 10 : 12,
      letterSpacing: '0.22em',
      color: palette.sub,
      marginBottom: 4,
    }}>
      {label}
    </div>
    <div style={{
      fontFamily: 'Anton, sans-serif',
      fontSize: big ? (isFeed ? 56 : 72) : (isFeed ? 44 : 60),
      color: accent ? palette.accent : palette.ink,
      lineHeight: 1,
    }}>
      {value}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE 2 — STADIUM
// Header · Foto grande com nome sobreposto na base · Lista · Footer
// ═══════════════════════════════════════════════════════════════════
export const PostStadium = ({ players, theme, format, classLabel, categoryLabel, showSecondHalf, monthLabel, logoSrc }) => {
  const palette = getTokens(theme);
  const isFeed = format === 'feed';
  const champ = players[0];
  if (!champ) return null;

  const maxList = isFeed ? (showSecondHalf ? 4 : 3) : (showSecondHalf ? 9 : 5);
  const rest = players.slice(1, 1 + maxList);

  const photoH = isFeed ? 560 : 1000;
  const rowH = isFeed ? 54 : 66;

  return (
    <Frame palette={palette} isFeed={isFeed} bg={palette.grad}>
      {/* HEADER */}
      <div style={{
        flexShrink: 0,
        padding: isFeed ? '34px 60px' : '54px 60px',
        borderBottom: `1px solid ${palette.line}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <FSPMark palette={palette} size={isFeed ? 58 : 76} logoSrc={logoSrc} />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: isFeed ? 40 : 54, color: palette.ink, lineHeight: 1 }}>
            {classLabel.toUpperCase()} <span style={{ color: palette.accent }}>{categoryLabel.toUpperCase()}</span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: isFeed ? 12 : 14, letterSpacing: '0.28em', color: palette.sub, marginTop: 6 }}>
            {monthLabel} · RANKING FSP
          </div>
        </div>
      </div>

      {/* FOTO COM NOME SOBREPOSTO NA BASE (gradiente garante legibilidade) */}
      <div style={{ position: 'relative', flexShrink: 0, height: photoH }}>
        <Photo player={champ} palette={palette} big height={photoH} />
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          background: `linear-gradient(180deg, transparent 0%, ${alpha(palette.bg, 0.95)} 85%)`,
          padding: isFeed ? '90px 60px 28px' : '160px 60px 44px',
        }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: isFeed ? 13 : 16, letterSpacing: '0.3em', color: palette.accent, marginBottom: 10,
          }}>
            CAMPEÃO · {classLabel.toUpperCase()} {categoryLabel.toUpperCase()}
          </div>
          <div style={{
            fontFamily: 'Anton, sans-serif',
            fontSize: isFeed ? 64 : 96,
            lineHeight: 0.98,
            color: palette.ink,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {fitName(champ.player_name, isFeed ? 18 : 22)}
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'baseline', marginTop: isFeed ? 10 : 18 }}>
            <span style={{ fontFamily: 'Anton, sans-serif', fontSize: isFeed ? 60 : 88, color: palette.accent, lineHeight: 1 }}>
              {champ.total_points}
            </span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: isFeed ? 13 : 16, letterSpacing: '0.22em', color: palette.sub }}>
              PONTOS · {champ.results_count} TORNEIOS{champ.win_rate != null ? ` · ${champ.win_rate}% VIT.` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* LISTA */}
      <div style={{ flex: 1, minHeight: 0, padding: isFeed ? '22px 60px' : '40px 60px', overflow: 'hidden' }}>
        {rest.length > 0 && (
          <>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12, letterSpacing: '0.3em', color: palette.sub, marginBottom: 14,
            }}>
              PERSEGUIDORES
            </div>
            <div style={{
              display: 'flex', flexDirection: 'column',
              border: `1px solid ${palette.line}`, borderRadius: 10, overflow: 'hidden',
            }}>
              {rest.map((p, i) => (
                <ListRow
                  key={p.player_id}
                  pos={i + 2}
                  name={fitName(p.player_name, isFeed ? 28 : 34)}
                  points={p.total_points}
                  palette={palette}
                  accentPos={i < 2 ? palette.podium[i + 1] : null}
                  rowH={rowH}
                  fontSize={isFeed ? 16 : 19}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Footer palette={palette} />
    </Frame>
  );
};

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE 3 — EDITORIAL
// Masthead · Duas colunas (info tipográfica | foto) · Lista · Footer
// Layout de revista/jornal — completamente diferente do Ultimate
// ═══════════════════════════════════════════════════════════════════
export const PostEditorial = ({ players, theme, format, classLabel, categoryLabel, showSecondHalf, monthLabel }) => {
  const palette = getTokens(theme);
  const isFeed = format === 'feed';
  const champ = players[0];
  if (!champ) return null;

  const maxList = isFeed ? (showSecondHalf ? 4 : 2) : (showSecondHalf ? 8 : 4);
  const rest = players.slice(1, 1 + maxList);

  // Altura da seção hero de duas colunas
  const heroH = isFeed ? 600 : 1120;
  const rowH = isFeed ? 50 : 62;

  // Largura da coluna de info (esquerda)
  const infoW = isFeed ? 420 : 460;

  return (
    <Frame palette={palette} isFeed={isFeed}>
      {/* MASTHEAD — estilo jornal/revista: 3 faixas */}
      <div style={{ flexShrink: 0 }}>
        {/* Faixa superior: data + título + volume */}
        <div style={{
          padding: isFeed ? '14px 60px' : '22px 60px',
          borderBottom: `1px solid ${palette.line}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: isFeed ? 10 : 12, letterSpacing: '0.3em', color: palette.sub }}>
            EDIÇÃO MENSAL · {monthLabel}
          </div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: isFeed ? 40 : 54, letterSpacing: '0.18em', color: palette.ink }}>
            F · S · P
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: isFeed ? 10 : 12, letterSpacing: '0.3em', color: palette.sub }}>
            VOL. {new Date().getFullYear()}
          </div>
        </div>
        {/* Faixa headline: manchete com borda dupla */}
        <div style={{
          padding: isFeed ? '12px 60px' : '18px 60px',
          borderBottom: `4px double ${palette.ink}`,
          display: 'flex', alignItems: 'baseline', gap: isFeed ? 16 : 24,
          background: alpha(palette.accent, 0.06),
        }}>
          <div style={{
            fontFamily: 'Anton, sans-serif',
            fontSize: isFeed ? 46 : 62,
            lineHeight: 0.92,
            color: palette.ink,
            letterSpacing: '-0.01em',
          }}>
            MELHOR DO PARANÁ
          </div>
          <div style={{
            fontFamily: 'Anton, sans-serif',
            fontSize: isFeed ? 46 : 62,
            lineHeight: 0.92,
            color: palette.accent,
            letterSpacing: '-0.01em',
          }}>
            {classLabel.toUpperCase()}
          </div>
          <div style={{
            marginLeft: 'auto',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: isFeed ? 10 : 13,
            letterSpacing: '0.24em',
            color: palette.sub,
            flexShrink: 0,
          }}>
            {categoryLabel.toUpperCase()}
          </div>
        </div>
      </div>

      {/* DUAS COLUNAS: info tipográfica (esq) | foto (dir) */}
      <div style={{ flexShrink: 0, display: 'flex', height: heroH }}>
        {/* Coluna esquerda — informação pura, sem foto */}
        <div style={{
          width: infoW,
          flexShrink: 0,
          borderRight: `4px solid ${palette.ink}`,
          padding: isFeed ? '28px 32px' : '44px 44px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          background: alpha(palette.surface, 0.7),
        }}>
          <div>
            {/* Etiqueta de categoria */}
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: isFeed ? 10 : 13,
              letterSpacing: '0.3em',
              color: palette.accent,
              paddingBottom: isFeed ? 14 : 22,
              borderBottom: `1px solid ${palette.line}`,
              marginBottom: isFeed ? 14 : 22,
            }}>
              # 01 · CAMPEÃO OFICIAL
            </div>

            {/* Número gigante como elemento gráfico */}
            <div style={{
              fontFamily: 'Anton, sans-serif',
              fontSize: isFeed ? 180 : 300,
              color: palette.accent,
              lineHeight: 0.72,
              marginBottom: isFeed ? 16 : 26,
              letterSpacing: '-0.03em',
            }}>
              01
            </div>

            {/* Nome do campeão */}
            <div style={{
              fontFamily: 'Anton, sans-serif',
              fontSize: isFeed ? 42 : 62,
              lineHeight: 1.0,
              color: palette.ink,
              wordBreak: 'break-word',
            }}>
              {fitName(champ.player_name, isFeed ? 18 : 22)}
            </div>
          </div>

          {/* Stats em tabela com réguas */}
          <div>
            <div style={{ height: 2, background: palette.ink, marginBottom: isFeed ? 18 : 28 }} />
            {[
              { label: 'PONTOS', value: champ.total_points, accent: true },
              { label: 'TORNEIOS', value: champ.results_count, accent: false },
              ...(champ.win_rate != null ? [{ label: '% VITÓRIAS', value: `${champ.win_rate}%`, accent: false }] : []),
            ].map((stat, i, arr) => (
              <div key={stat.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: `${isFeed ? 8 : 12}px 0` }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: isFeed ? 10 : 12, letterSpacing: '0.24em', color: palette.sub }}>
                    {stat.label}
                  </span>
                  <span style={{ fontFamily: 'Anton, sans-serif', fontSize: isFeed ? 38 : 54, color: stat.accent ? palette.accent : palette.ink, lineHeight: 1 }}>
                    {stat.value}
                  </span>
                </div>
                {i < arr.length - 1 && <div style={{ height: 1, background: palette.line }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Coluna direita — foto ocupa toda a altura */}
        <Photo
          player={champ}
          palette={palette}
          big
          height={heroH}
          width={`calc(100% - ${infoW}px)`}
        />
      </div>

      {/* LISTA DE PERSEGUIDORES */}
      <div style={{ flex: 1, minHeight: 0, padding: isFeed ? '16px 60px 20px' : '28px 60px 36px', overflow: 'hidden' }}>
        {rest.length > 0 && (
          <>
            <div style={{
              borderTop: `2px solid ${palette.ink}`,
              borderBottom: `1px solid ${palette.line}`,
              padding: `${isFeed ? 8 : 12}px 0`,
              marginBottom: isFeed ? 10 : 16,
              display: 'flex', justifyContent: 'space-between',
              fontFamily: 'JetBrains Mono, monospace', fontSize: isFeed ? 10 : 12,
              letterSpacing: '0.3em', color: palette.sub,
            }}>
              <span>NESTA EDIÇÃO</span><span>PERSEGUIDORES</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {rest.map((p, i) => (
                <ListRow
                  key={p.player_id}
                  pos={i + 2}
                  name={fitName(p.player_name, isFeed ? 30 : 38)}
                  points={p.total_points}
                  palette={palette}
                  accentPos={i < 2 ? palette.podium[i + 1] : null}
                  rowH={rowH}
                  fontSize={isFeed ? 16 : 18}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Footer palette={palette} />
    </Frame>
  );
};

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE 4 — PODIUM
// Header · 3 cards do pódio (alturas iguais nas fotos) · Lista · Footer
// ═══════════════════════════════════════════════════════════════════
export const PostPodium = ({ players, theme, format, classLabel, categoryLabel, showSecondHalf, monthLabel, logoSrc }) => {
  const palette = getTokens(theme);
  const isFeed = format === 'feed';
  const podium = players.slice(0, 3);
  if (podium.length < 3) return null;

  // ordem visual: 2º, 1º, 3º
  const order = [
    { player: podium[1], rank: 2 },
    { player: podium[0], rank: 1 },
    { player: podium[2], rank: 3 },
  ];

  const maxList = isFeed ? (showSecondHalf ? 4 : 2) : (showSecondHalf ? 7 : 4);
  const rest = players.slice(3, 3 + maxList);

  // Fotos com a MESMA altura nas 3 colunas (resolve o "3º lugar cortado").
  const photoH = isFeed ? 300 : 540;
  // Card de info também com altura fixa igual nas 3 colunas.
  const infoH = isFeed ? 210 : 320;
  const rowH = isFeed ? 52 : 64;

  return (
    <Frame palette={palette} isFeed={isFeed} bg={palette.grad}>
      {/* HEADER */}
      <div style={{
        flexShrink: 0,
        padding: isFeed ? '36px 60px 0' : '54px 60px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <FSPMark palette={palette} size={isFeed ? 60 : 76} logoSrc={logoSrc} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: isFeed ? 12 : 14, letterSpacing: '0.3em', color: palette.sub }}>
            PÓDIO OFICIAL
          </div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: isFeed ? 48 : 60, marginTop: 6, color: palette.ink }}>
            {classLabel.toUpperCase()} <span style={{ color: palette.accent }}>{categoryLabel.toUpperCase()}</span>
          </div>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: isFeed ? 12 : 14, letterSpacing: '0.24em', color: palette.sub, textAlign: 'right' }}>
          {monthLabel}<br />RANKING FSP
        </div>
      </div>

      {/* PÓDIO — 3 colunas, alturas idênticas */}
      <div style={{
        flexShrink: 0,
        padding: isFeed ? '28px 60px' : '48px 60px',
        display: 'flex', gap: isFeed ? 16 : 22, alignItems: 'flex-start',
      }}>
        {order.map(({ player, rank }) => {
          const medal = palette.podium[rank - 1];
          const isWinner = rank === 1;
          return (
            <div key={player.player_id} style={{
              flex: 1, minWidth: 0,
              display: 'flex', flexDirection: 'column',
              border: `2px solid ${medal}`,
              borderRadius: 12,
              overflow: 'hidden',
              // o 1º sobe um pouco visualmente, mas SEM mudar altura total
              marginTop: isWinner ? 0 : (isFeed ? 24 : 40),
            }}>
              {/* Foto — mesma altura nas 3 */}
              <Photo player={player} palette={palette} height={photoH} />
              {/* Info — altura fixa, conteúdo organizado em flux */}
              <div style={{
                height: infoH,
                flexShrink: 0,
                background: isWinner
                  ? `linear-gradient(180deg, ${alpha(medal, 0.28)} 0%, ${palette.surface} 65%)`
                  : palette.surface,
                padding: isFeed ? '12px 14px' : '20px 22px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <div style={{
                  fontFamily: 'Anton, sans-serif',
                  fontSize: isWinner ? (isFeed ? 96 : 150) : (isFeed ? 70 : 110),
                  color: medal,
                  lineHeight: 0.8,
                }}>
                  {rank}
                </div>
                <div>
                  <div style={{
                    fontFamily: 'Anton, sans-serif',
                    fontSize: isWinner ? (isFeed ? 24 : 34) : (isFeed ? 20 : 28),
                    lineHeight: 1.05,
                    color: palette.ink,
                    // até 2 linhas, depois corta
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    marginBottom: isFeed ? 6 : 10,
                  }}>
                    {fitName(player.player_name, 26)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{
                      fontFamily: 'Anton, sans-serif',
                      fontSize: isWinner ? (isFeed ? 36 : 48) : (isFeed ? 28 : 38),
                      color: palette.accent,
                      lineHeight: 1,
                    }}>
                      {player.total_points}
                    </span>
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: isFeed ? 10 : 12,
                      letterSpacing: '0.2em',
                      color: palette.sub,
                    }}>
                      PTS
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* LISTA */}
      <div style={{ flex: 1, minHeight: 0, padding: isFeed ? '0 60px 22px' : '0 60px 40px', overflow: 'hidden' }}>
        {rest.length > 0 && (
          <>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12, letterSpacing: '0.3em', color: palette.sub, marginBottom: 14,
            }}>
              PERSEGUIDORES
            </div>
            <div style={{
              display: 'flex', flexDirection: 'column',
              border: `1px solid ${palette.line}`, borderRadius: 10, overflow: 'hidden',
            }}>
              {rest.map((p, i) => (
                <ListRow
                  key={p.player_id}
                  pos={i + 4}
                  name={fitName(p.player_name, isFeed ? 30 : 38)}
                  points={p.total_points}
                  palette={palette}
                  rowH={rowH}
                  fontSize={isFeed ? 16 : 19}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Footer palette={palette} />
    </Frame>
  );
};

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════
export const POST_TEMPLATES = {
  ultimate:  { Component: PostUltimate,  label: 'Ultimate Card' },
  stadium:   { Component: PostStadium,   label: 'Stadium' },
  editorial: { Component: PostEditorial, label: 'Editorial' },
  podium:    { Component: PostPodium,    label: 'Podium Royale' },
};

export const PALETTE_OPTIONS = [
  { key: 'storm',    label: 'FSP Storm',     swatch: ['#070d1a', '#4aa3ff', '#22e1ff'] },
  { key: 'inferno',  label: 'Court Inferno', swatch: ['#000000', '#ff0066', '#00ff66'] },
  { key: 'champion', label: 'Champion Gold', swatch: ['#1a1510', '#ffd700', '#ffed4e'] },
  { key: 'glacier',  label: 'Glacier',       swatch: ['#e8e5dc', '#0d5c1a', '#004d5c'] },
];
