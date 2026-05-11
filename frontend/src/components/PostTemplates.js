// frontend/src/components/PostTemplates.js
// 4 templates de post para redes sociais (Feed 1080x1080 e Story 1080x1920)
// Consome dados na shape do backend:
//   { player_id, player_name, photo_url, total_points, results_count, win_rate, position_change, last_match }
// e tokens via CSS vars (data-theme="storm|inferno|champion|glacier")

import React from 'react';

// Util: hex/rgb → rgba(...) com alpha
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
    bg: '#0a0a0c', surface: '#141418', surface2: '#1f1f24',
    line: 'rgba(255,255,255,0.08)', ink: '#ffffff', sub: '#9aa0aa',
    accent: '#ff2d6f', accent2: '#c6f432', gold: '#c6f432',
    podium: ['#c6f432', '#cdd5e0', '#ff8a3d'],
    grad: 'linear-gradient(135deg,#0a0a0c 0%,#1a0a14 55%,#0a0a0c 100%)',
  },
  champion: {
    bg: '#0e0c08', surface: '#181410', surface2: '#23190f',
    line: 'rgba(212,160,23,0.18)', ink: '#f5ecd6', sub: '#b8a982',
    accent: '#d4a017', accent2: '#f5d36b', gold: '#d4a017',
    podium: ['#f5d36b', '#cdd5e0', '#cd7f32'],
    grad: 'linear-gradient(135deg,#0e0c08 0%,#231708 55%,#0e0c08 100%)',
  },
  glacier: {
    bg: '#f4f1ea', surface: '#ffffff', surface2: '#ecebe2',
    line: 'rgba(13,20,24,0.12)', ink: '#0d1418', sub: '#5b6168',
    accent: '#2d8a3e', accent2: '#0d6e7b', gold: '#b8870e',
    podium: ['#b8870e', '#7d8590', '#a85d2d'],
    grad: 'linear-gradient(135deg,#f4f1ea 0%,#eae6dc 55%,#f4f1ea 100%)',
  },
};

const getTokens = (theme) => {
  // Primeiro tenta usar as paletas hardcoded
  if (PALETTE_DATA[theme]) {
    return PALETTE_DATA[theme];
  }
  
  // Fallback: tenta ler do CSS
  if (typeof document === 'undefined') return PALETTE_DATA.storm;
  const el = document.querySelector(`[data-theme="${theme}"]`) || document.documentElement;
  const cs = getComputedStyle(el);
  const get = (k) => cs.getPropertyValue(k).trim();
  
  const bg = get('--t-bg');
  if (!bg) return PALETTE_DATA.storm; // Se não encontrou, usa storm
  
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

const Photo = ({ player, palette, style, big }) => {
  const photoUrl = player?.photo_url || player?.photoUrl;
  return (
    <div style={{
      ...style,
      background: palette.surface2,
      backgroundImage: photoUrl ? `url(${photoUrl})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      {!photoUrl && (
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: big ? 96 : 48, color: alpha(palette.ink, 0.25), letterSpacing: '0.02em' }}>
          {initials(player?.player_name || player?.name || '')}
        </div>
      )}
    </div>
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
    padding: '20px 60px', borderTop: `1px solid ${palette.line}`,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.28em', color: palette.sub,
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

// ─────────────────────────────────────────────
export const PostUltimate = ({ players, theme, format, classLabel, categoryLabel, showSecondHalf, monthLabel, logoSrc }) => {
  const palette = getTokens(theme);
  const isFeed = format === 'feed';
  const W = 1080, H = isFeed ? 1080 : 1920;
  const champ = players[0]; if (!champ) return null;
  const rest = players.slice(1, showSecondHalf ? 10 : 5);

  return (
    <div style={{ width: W, height: H, background: palette.bg, position: 'relative', overflow: 'hidden', fontFamily: 'Space Grotesk, sans-serif', color: palette.ink }}>
      <div style={{ position:'absolute', right:-40, top:-80, fontFamily:'Anton, sans-serif', fontSize: isFeed?720:900, lineHeight:1, color: palette.accent, opacity:0.06, letterSpacing:'-0.04em' }}>01</div>

      <div style={{ padding: '52px 60px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <FSPMark palette={palette} size={56} logoSrc={logoSrc} />
          <div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 34, letterSpacing: '0.12em', lineHeight: 1, color: palette.ink }}>RANKING FSP</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, letterSpacing: '0.32em', color: palette.sub, marginTop: 6 }}>FEDERAÇÃO DE SQUASH DO PARANÁ</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, letterSpacing: '0.28em', color: palette.sub }}>{classLabel.toUpperCase()} CLASSE · {categoryLabel.toUpperCase()}</div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, letterSpacing: '0.08em', marginTop: 6, color: palette.ink }}>{monthLabel}</div>
        </div>
      </div>

      <div style={{ padding: isFeed ? '36px 60px 0' : '60px 60px 0' }}>
        <div style={{
          position: 'relative',
          background: `linear-gradient(135deg, ${palette.surface2} 0%, ${palette.surface} 100%)`,
          border: `1px solid ${palette.line}`, borderRadius: 20, padding: 28,
          display: 'grid', gridTemplateColumns: '380px 1fr', gap: 28, overflow: 'hidden',
        }}>
          <div style={{ position:'absolute', inset:0, background:`linear-gradient(115deg, transparent 35%, ${alpha(palette.accent, 0.16)} 50%, transparent 65%)`, pointerEvents:'none' }}/>
          <div style={{ position:'absolute', top:8, right:18, fontFamily:'Anton, sans-serif', fontSize:220, lineHeight:1, color: alpha(palette.accent, 0.10), letterSpacing:'-0.03em' }}>01</div>

          <Photo player={champ} palette={palette} big style={{ width: 380, height: 520, borderRadius: 14, border: `1px solid ${palette.line}` }} />

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <span style={{ background: palette.podium[0], color: palette.bg, padding: '4px 12px', fontFamily: 'Anton, sans-serif', fontSize: 16, letterSpacing: '0.18em', borderRadius: 4 }}>CAMPEÃO</span>
                <Trend value={champ.position_change} palette={palette} size={14} />
              </div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 64, lineHeight: 0.95, color: palette.ink }}>
                {champ.player_name.split(' ')[0].toUpperCase()}<br/>
                <span style={{ color: palette.accent }}>{champ.player_name.split(' ').slice(1).join(' ').toUpperCase()}</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginTop: 22 }}>
              <Stat palette={palette} label="PONTOS" value={champ.total_points} big />
              <Stat palette={palette} label="TORNEIOS" value={champ.results_count} />
              <Stat palette={palette} label="% VITÓRIAS" value={champ.win_rate != null ? `${champ.win_rate}%` : '—'} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: isFeed ? '24px 60px 0' : '40px 60px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isFeed ? 4 : 3}, 1fr)`, gap: 14 }}>
          {rest.map((p, i) => <MiniCard key={p.player_id} player={p} pos={i+2} palette={palette} compact={isFeed} />)}
        </div>
      </div>

      <Footer palette={palette} />
    </div>
  );
};

const Stat = ({ palette, label, value, big }) => (
  <div style={{ borderTop: `1px solid ${palette.line}`, paddingTop: 10 }}>
    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.22em', color: palette.sub }}>{label}</div>
    <div style={{ fontFamily: 'Anton, sans-serif', fontSize: big ? 56 : 38, lineHeight: 1, marginTop: 6, color: big ? palette.accent : palette.ink }}>{value}</div>
  </div>
);

const MiniCard = ({ player, pos, palette, compact }) => (
  <div style={{ background: palette.surface, border: `1px solid ${palette.line}`, borderRadius: 12, overflow: 'hidden', position: 'relative', height: compact ? 200 : 240 }}>
    <Photo player={player} palette={palette} style={{ position: 'absolute', inset: 0, width: '100%', height: '80%' }} />
    <div style={{ position: 'absolute', top: 8, left: 8, background: palette.bg, color: palette.ink, fontFamily: 'Anton, sans-serif', fontSize: 18, width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${palette.line}` }}>{pos}</div>
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12, background: alpha(palette.bg, 0.94), borderTop: `1px solid ${palette.line}` }}>
      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 14, lineHeight: 1.1, color: palette.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{player.player_name}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: palette.accent, lineHeight: 1 }}>{player.total_points}</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em', color: palette.sub }}>PTS</span>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
export const PostStadium = ({ players, theme, format, classLabel, categoryLabel, showSecondHalf, monthLabel, logoSrc }) => {
  const palette = getTokens(theme);
  const isFeed = format === 'feed';
  const W = 1080, H = isFeed ? 1080 : 1920;
  const top = players.slice(0, showSecondHalf ? 10 : 5);

  return (
    <div style={{ width: W, height: H, background: palette.bg, position: 'relative', overflow: 'hidden', fontFamily: 'Space Grotesk, sans-serif', color: palette.ink }}>
      <div style={{ position:'absolute', inset:0, background:`repeating-linear-gradient(115deg, ${alpha(palette.accent, 0.04)} 0 2px, transparent 2px 18px)` }}/>
      <div style={{ position:'absolute', inset:0, background:`radial-gradient(circle at 30% 20%, ${alpha(palette.accent, 0.18)} 0%, transparent 45%), radial-gradient(circle at 80% 90%, ${alpha(palette.accent2, 0.12)} 0%, transparent 50%)` }}/>

      <div style={{ padding:'52px 60px 0', display:'flex', justifyContent:'space-between', alignItems:'center', position:'relative', zIndex:2 }}>
        <div>
          <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:12, letterSpacing:'0.32em', color:palette.accent2, marginBottom:8 }}>● AO VIVO · {monthLabel}</div>
          <div style={{ fontFamily:'Anton, sans-serif', fontSize:92, lineHeight:0.9, color:palette.ink }}>
            TOP {showSecondHalf ? 10 : 5}<br/><span style={{ color:palette.accent }}>SQUASH PR</span>
          </div>
          <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:14, letterSpacing:'0.3em', color:palette.sub, marginTop:14 }}>
            {classLabel.toUpperCase()} CLASSE · {categoryLabel.toUpperCase()}
          </div>
        </div>
        <FSPMark palette={palette} size={80} logoSrc={logoSrc} />
      </div>

      <div style={{ position:'absolute', top: isFeed?360:480, left:0, right:0, bottom:120, padding:'0 60px', zIndex:2, display:'flex', flexDirection:'column', gap:8 }}>
        {top.map((p, i) => (
          <div key={p.player_id} style={{
            position:'relative', height: top.length<=5 ? (isFeed?80:130) : (isFeed?50:105),
            background: i===0 ? `linear-gradient(90deg, ${palette.accent} 0%, ${alpha(palette.accent,0)} 100%)` : palette.surface,
            border: `1px solid ${palette.line}`,
            clipPath: 'polygon(0 0, calc(100% - 30px) 0, 100% 100%, 30px 100%)',
            display:'flex', alignItems:'center', padding:'0 60px 0 40px', gap:24,
          }}>
            <div style={{ fontFamily:'Anton, sans-serif', fontSize: top.length<=5?56:36, color: i===0?palette.bg:(i<3?palette.podium[i]:palette.ink), lineHeight:1, minWidth:70 }}>{String(i+1).padStart(2,'0')}</div>
            <div style={{ flex:1, fontFamily:'Anton, sans-serif', fontSize: top.length<=5?38:26, color: i===0?palette.bg:palette.ink, lineHeight:1 }}>{p.player_name.toUpperCase()}</div>
            <div style={{ minWidth:130, textAlign:'right' }}>
              <div style={{ fontFamily:'Anton, sans-serif', fontSize: top.length<=5?44:32, color: i===0?palette.bg:palette.accent, lineHeight:1 }}>{p.total_points}</div>
              <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, letterSpacing:'0.24em', color: i===0?alpha(palette.bg,0.7):palette.sub }}>PONTOS</div>
            </div>
          </div>
        ))}
      </div>

      <Footer palette={palette} />
    </div>
  );
};

// ─────────────────────────────────────────────
export const PostEditorial = ({ players, theme, format, classLabel, categoryLabel, showSecondHalf, monthLabel }) => {
  const palette = getTokens(theme);
  const isFeed = format === 'feed';
  const W = 1080, H = isFeed ? 1080 : 1920;
  const champ = players[0]; if (!champ) return null;
  const list = players.slice(1, showSecondHalf ? 10 : 5);

  return (
    <div style={{ width: W, height: H, background: palette.bg, position: 'relative', overflow: 'hidden', fontFamily: 'Space Grotesk, sans-serif', color: palette.ink }}>
      <div style={{ padding:'40px 60px', borderBottom:`2px solid ${palette.line}`, display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
        <div style={{ fontFamily:'Anton, sans-serif', fontSize:28, letterSpacing:'0.18em', color:palette.ink }}>F · S · P</div>
        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:11, letterSpacing:'0.28em', color:palette.sub }}>EDIÇÃO MENSAL · {monthLabel} · {classLabel.toUpperCase()} {categoryLabel.toUpperCase()}</div>
        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:11, letterSpacing:'0.28em', color:palette.sub }}>VOL. {new Date().getFullYear()}</div>
      </div>

      <div style={{ fontFamily:'Anton, sans-serif', fontSize: isFeed?180:280, lineHeight:0.88, letterSpacing:'-0.02em', padding:'40px 60px 0', color:palette.ink }}>
        MELHOR DO<br/>PARANÁ<br/><span style={{ color:palette.accent }}>NA {classLabel.toUpperCase()}</span>
      </div>

      <div style={{ position:'relative', margin:'20px 60px 0', display:'grid', gridTemplateColumns:'1fr 1.2fr', gap:36, alignItems:'end' }}>
        <Photo player={champ} palette={palette} big style={{ width:'100%', height: isFeed?480:680, border:`1px solid ${palette.line}` }} />
        <div style={{ position:'relative' }}>
          <div style={{ position:'absolute', top: isFeed?-120:-180, left:-20, fontFamily:'Anton, sans-serif', fontSize: isFeed?320:480, color:palette.accent, lineHeight:0.85, letterSpacing:'-0.05em' }}>01</div>
          <div style={{ position:'relative', paddingTop: isFeed?220:320 }}>
            <div style={{ fontFamily:'Anton, sans-serif', fontSize: isFeed?56:76, lineHeight:0.95, color:palette.ink }}>{champ.player_name.toUpperCase()}</div>
            <div style={{ display:'flex', gap:24, marginTop:16, fontFamily:'JetBrains Mono, monospace', fontSize:12, letterSpacing:'0.18em', color:palette.sub }}>
              <span><b style={{ color:palette.accent, fontSize:22, fontFamily:'Anton, sans-serif' }}>{champ.total_points}</b> PTS</span>
              <span><b style={{ color:palette.ink, fontSize:22, fontFamily:'Anton, sans-serif' }}>{champ.results_count}</b> TORN.</span>
              {champ.win_rate != null && <span><b style={{ color:palette.ink, fontSize:22, fontFamily:'Anton, sans-serif' }}>{champ.win_rate}%</b> VIT.</span>}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding:'40px 60px 0' }}>
        <div style={{ borderTop:`1px solid ${palette.line}`, borderBottom:`1px solid ${palette.line}`, padding:'10px 0', marginBottom:18 }}>
          <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:11, letterSpacing:'0.32em', color:palette.sub, display:'flex', justifyContent:'space-between' }}>
            <span>NESTA EDIÇÃO</span><span>PERSEGUIDORES</span>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns: showSecondHalf?'repeat(3,1fr)':'repeat(2,1fr)', gap:'4px 36px' }}>
          {list.map((p, i) => (
            <div key={p.player_id} style={{ display:'flex', alignItems:'baseline', gap:14, padding:'10px 0', borderBottom:`1px dashed ${palette.line}` }}>
              <span style={{ fontFamily:'Anton, sans-serif', fontSize:28, color: i<2?palette.podium[i+1]:palette.sub, lineHeight:1, minWidth:42 }}>{String(i+2).padStart(2,'0')}</span>
              <span style={{ flex:1, fontFamily:'Space Grotesk, sans-serif', fontWeight:600, fontSize:16, color:palette.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.player_name}</span>
              <span style={{ fontFamily:'Anton, sans-serif', fontSize:22, color:palette.accent }}>{p.total_points}</span>
            </div>
          ))}
        </div>
      </div>

      <Footer palette={palette} />
    </div>
  );
};

// ─────────────────────────────────────────────
export const PostPodium = ({ players, theme, format, classLabel, categoryLabel, showSecondHalf, monthLabel, logoSrc }) => {
  const palette = getTokens(theme);
  const isFeed = format === 'feed';
  const W = 1080, H = isFeed ? 1080 : 1920;
  const podium = players.slice(0, 3);
  if (podium.length < 3) return null;
  const order = [podium[1], podium[0], podium[2]];
  const heights = [isFeed?260:380, isFeed?340:500, isFeed?220:320];
  const list = players.slice(3, showSecondHalf ? 10 : 5);

  return (
    <div style={{ width: W, height: H, background: palette.grad, position: 'relative', overflow: 'hidden', fontFamily: 'Space Grotesk, sans-serif', color: palette.ink }}>
      <div style={{ padding:'50px 60px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <FSPMark palette={palette} size={64} logoSrc={logoSrc} />
        <div style={{ textAlign:'center' }}>
          <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:12, letterSpacing:'0.32em', color:palette.sub }}>PÓDIO OFICIAL</div>
          <div style={{ fontFamily:'Anton, sans-serif', fontSize:52, letterSpacing:'0.04em', marginTop:6, color:palette.ink }}>{classLabel.toUpperCase()} <span style={{ color:palette.accent }}>{categoryLabel.toUpperCase()}</span></div>
        </div>
        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:12, letterSpacing:'0.28em', color:palette.sub, textAlign:'right' }}>{monthLabel}<br/>RANKING FSP</div>
      </div>

      <div style={{ marginTop: isFeed?30:70, padding:'0 60px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1.15fr 1fr', gap:14, alignItems:'end' }}>
          {order.map((p, idx) => {
            const realIdx = idx===0?1:idx===1?0:2;
            const medal = palette.podium[realIdx];
            return (
              <div key={p.player_id} style={{ display:'flex', flexDirection:'column' }}>
                <Photo player={p} palette={palette} style={{ width:'100%', height: isFeed?280:400, border:`2px solid ${medal}`, borderBottom:'none' }} />
                <div style={{ background: realIdx===0 ? `linear-gradient(180deg, ${alpha(medal,0.25)} 0%, ${palette.surface} 60%)` : palette.surface, border:`2px solid ${medal}`, borderTop:'none', padding:'14px 16px', height: heights[idx], display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                  <div style={{ fontFamily:'Anton, sans-serif', fontSize: realIdx===0?140:100, lineHeight:0.85, color:medal, letterSpacing:'-0.03em' }}>{realIdx+1}</div>
                  <div>
                    <div style={{ fontFamily:'Anton, sans-serif', fontSize: realIdx===0?32:24, lineHeight:1, color:palette.ink }}>{p.player_name.toUpperCase()}</div>
                    <div style={{ display:'flex', alignItems:'baseline', gap:6, marginTop:10 }}>
                      <span style={{ fontFamily:'Anton, sans-serif', fontSize: realIdx===0?36:28, color:palette.accent, lineHeight:1 }}>{p.total_points}</span>
                      <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, letterSpacing:'0.2em', color:palette.sub }}>PTS</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {list.length > 0 && (
        <div style={{ padding: isFeed?'24px 60px 0':'50px 60px 0' }}>
          <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:11, letterSpacing:'0.32em', color:palette.sub, marginBottom:10 }}>PERSEGUIDORES</div>
          <div style={{ border:`1px solid ${palette.line}`, borderRadius:8, overflow:'hidden' }}>
            {list.map((p, i) => (
              <div key={p.player_id} style={{ display:'grid', gridTemplateColumns:'60px 1fr 90px', alignItems:'center', gap:16, padding:'12px 18px', background: i%2?'transparent':alpha(palette.surface,0.6), borderBottom: i===list.length-1?'none':`1px solid ${palette.line}` }}>
                <span style={{ fontFamily:'Anton, sans-serif', fontSize:28, color:palette.sub, lineHeight:1 }}>{String(i+4).padStart(2,'0')}</span>
                <span style={{ fontFamily:'Space Grotesk, sans-serif', fontWeight:700, fontSize:18, color:palette.ink }}>{p.player_name}</span>
                <span style={{ fontFamily:'Anton, sans-serif', fontSize:24, color:palette.accent, textAlign:'right' }}>{p.total_points}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Footer palette={palette} />
    </div>
  );
};

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
