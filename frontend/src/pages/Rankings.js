// frontend/src/pages/Rankings.js
// Redesign completo: sport-card aesthetic + 4 templates de post
// Mantém: cache, PlayerModal, toast, html2canvas, axios

import React, { useState, useEffect, useRef } from 'react';
import axios from '../lib/api';
import { API } from '../lib/api';
import { cachedGet, getCached, TTL } from '../lib/cache';
import { Download, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import PlayerModal from '../components/PlayerModal';
import html2canvas from 'html2canvas';
import { POST_TEMPLATES, PALETTE_OPTIONS } from '../components/PostTemplates';
import CachedPhoto from '../components/CachedPhoto';

const CLASSES = ['1ª', '2ª', '3ª', '4ª', '5ª', '6ª', 'Duplas'];
const CATEGORIES = ['Feminina', 'Masculina'];

const Rankings = () => {
  const [rankings, setRankings] = useState([]);
  const [selectedClass, setSelectedClass] = useState('1ª');
  const [selectedCategory, setSelectedCategory] = useState('Feminina');
  const [loading, setLoading] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  // Estado do gerador de post
  const [postOpen, setPostOpen] = useState(false);
  const [template, setTemplate] = useState(() => localStorage.getItem('fsp_post_template') || 'ultimate');
  const [format, setFormat] = useState(() => localStorage.getItem('fsp_post_format') || 'feed');
  const [theme, setTheme] = useState(() => localStorage.getItem('fsp_post_theme') || 'storm');
  const [showSecondHalf, setShowSecondHalf] = useState(true);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => { localStorage.setItem('fsp_post_template', template); }, [template]);
  useEffect(() => { localStorage.setItem('fsp_post_format', format); }, [format]);
  useEffect(() => { localStorage.setItem('fsp_post_theme', theme); }, [theme]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchRankings = async () => {
      const effectiveCategory = selectedClass === 'Duplas' ? 'Mista' : selectedCategory;
      const url = `${API}/rankings?class_category=${selectedClass}&gender_category=${effectiveCategory}`;
      const cached = getCached(url);
      if (cached) { setRankings(cached); setLoading(false); return; }
      setLoading(true);
      try {
        const data = await cachedGet(url, TTL.RANKINGS, axios);
        if (!controller.signal.aborted) setRankings(data);
      } catch (error) {
        if (axios.isCancel?.(error) || error.name === 'CanceledError' || error.name === 'AbortError') return;
        toast.error('Erro ao carregar rankings');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchRankings();
    return () => controller.abort();
  }, [selectedClass, selectedCategory]);

  const champ = rankings[0];
  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);
  const categoryLabel = selectedClass === 'Duplas' ? 'Mista' : selectedCategory;
  const monthLabel = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
  const Template = POST_TEMPLATES[template].Component;

  const handleExport = async () => {
    const el = exportRef.current;
    if (!el) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(el, { scale: 1, backgroundColor: null, useCORS: true, allowTaint: true, logging: false, imageTimeout: 0 });
      const a = document.createElement('a');
      a.download = `ranking-fsp-${selectedClass}-${categoryLabel}-${template}-${format}.png`;
      a.href = canvas.toDataURL('image/png', 1.0);
      a.click();
      toast.success('Imagem gerada!');
    } catch (e) {
      toast.error('Erro ao gerar imagem: ' + e.message);
    } finally {
      setExporting(false);
    }
  };

  const initials = (n='') => {
    const p = n.trim().split(/\s+/);
    return ((p[0]?.[0]||'') + (p[p.length-1]?.[0]||'')).toUpperCase();
  };

  return (
    <div className="rk-root" style={{ background: 'var(--t-grad, var(--t-bg))', minHeight: '100%', padding: '32px 8px 60px' }}>
      <style>{`
        .rk-root { font-family: 'Space Grotesk', system-ui, sans-serif; color: var(--t-ink); }
        .rk-display { font-family: 'Anton', Impact, sans-serif; letter-spacing: 0.01em; line-height: 0.95; }
        .rk-mono { font-family: 'JetBrains Mono', monospace; letter-spacing: 0.22em; }
        .rk-card { background: color-mix(in srgb, var(--t-surface) 85%, transparent); border: 1px solid var(--t-line); border-radius: 14px; }
        .rk-chip { padding: 6px 14px; font-family: 'Anton', sans-serif; font-size: 14px; letter-spacing: 0.08em; border: 1px solid var(--t-line); border-radius: 4px; background: transparent; color: var(--t-ink); cursor: pointer; transition: all 0.15s; }
        .rk-chip:hover { border-color: var(--t-accent); }
        .rk-chip.active { background: var(--t-accent); color: var(--t-bg); border-color: var(--t-accent); }
        .rk-stat-row { display: flex; justify-content: space-between; align-items: baseline; padding: 12px 14px; background: color-mix(in srgb, var(--t-bg) 50%, transparent); border: 1px solid var(--t-line); border-radius: 8px; }
        .rk-row { display: grid; grid-template-columns: 70px 1fr 160px 70px 90px 60px 110px; align-items: center; gap: 12px; padding: 14px 20px; border-bottom: 1px solid var(--t-line); cursor: pointer; transition: background 0.15s; }
        .rk-row:hover { background: color-mix(in srgb, var(--t-accent) 8%, transparent); }
        .rk-row:hover .rk-hover-tooltip { opacity: 1; }
        .rk-row:last-child { border-bottom: none; }
        .rk-row .avatar { width: 38px; height: 38px; border-radius: 6px; background: var(--t-surface2); background-size: cover; background-position: top; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--t-sub); flex-shrink: 0; overflow: hidden; }
        
        /* Fix Dialog background */
        [role="dialog"] { background: #0d1a30 !important; color: #ffffff !important; }
        [data-radix-dialog-content] { background: #0d1a30 !important; color: #ffffff !important; }
        
        /* Dialog overlay escuro */
        [data-radix-dialog-overlay] { background: rgba(0,0,0,0.85) !important; }
        
        /* Força fundo escuro e texto branco em TODOS os controles do modal */
        .max-w-6xl { background: #0d1a30 !important; color: #ffffff !important; }
        .max-w-6xl * { color: #ffffff !important; }
        .max-w-6xl input[type="checkbox"] { accent-color: var(--t-accent); }
        .max-w-6xl label { color: #ffffff !important; }
        .max-w-6xl button { color: var(--t-ink) !important; }
        
        @media (max-width: 900px) {
          .rk-hero { grid-template-columns: 1fr !important; }
          .rk-hero .photo { width: 100% !important; height: 420px !important; }
          .rk-podium { grid-template-columns: 1fr !important; }
          .rk-row { grid-template-columns: 50px 1fr 100px; padding: 12px; }
          .rk-row .hide-mobile { display: none; }
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        {/* TITLE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="rk-mono" style={{ fontSize: 11, color: 'var(--t-sub)', marginBottom: 10 }}>● TEMPORADA ATIVA · {monthLabel}</div>
            <h1 className="rk-display" style={{ fontSize: 'clamp(48px, 8vw, 80px)', margin: 0 }}>
              RANKINGS<br/><span style={{ color: 'var(--t-accent)' }}>OFICIAIS</span>
            </h1>
          </div>
          <button onClick={() => setPostOpen(true)} style={{
            background: 'var(--t-accent)', color: 'var(--t-bg)', border: 'none', padding: '16px 24px',
            fontFamily: 'Anton, sans-serif', fontSize: 16, letterSpacing: '0.16em', cursor: 'pointer', borderRadius: 4,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Download size={18} /> GERAR POST
          </button>
        </div>

        {/* FILTERS */}
        <div className="rk-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 28 }}>
          <div className="rk-mono" style={{ fontSize: 10, color: 'var(--t-sub)' }}>CLASSE</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CLASSES.map(cls => (
              <button key={cls} className={`rk-chip ${selectedClass===cls?'active':''}`} onClick={() => setSelectedClass(cls)}>{cls}</button>
            ))}
          </div>
          <div style={{ width: 1, height: 20, background: 'var(--t-line)' }}/>
          <div className="rk-mono" style={{ fontSize: 10, color: 'var(--t-sub)' }}>CATEGORIA</div>
          {selectedClass === 'Duplas' ? (
            <div className="rk-mono" style={{ padding: '6px 12px', fontSize: 11, color: 'var(--t-accent2)', border: '1px solid var(--t-line)', borderRadius: 4 }}>MISTA</div>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              {CATEGORIES.map(cat => (
                <button key={cat} className={`rk-chip ${selectedCategory===cat?'active':''}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>
              ))}
            </div>
          )}
        </div>

        {loading && <div style={{ textAlign: 'center', padding: 60, color: 'var(--t-sub)' }}>Carregando...</div>}
        {!loading && rankings.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'var(--t-sub)' }}>Nenhum resultado encontrado</div>}

        {!loading && champ && (
          <>
            {/* HERO */}
            <div className="rk-card rk-hero" style={{ position: 'relative', padding: 24, marginBottom: 32, display: 'grid', gridTemplateColumns: '320px 1fr 320px', gap: 28, overflow: 'hidden' }} onClick={() => setSelectedPlayerId(champ.player_id)}>
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(115deg, transparent 40%, color-mix(in srgb, var(--t-accent) 12%, transparent) 55%, transparent 70%)`, pointerEvents: 'none' }}/>
              <CachedPhoto
                url={champ.photo_url}
                style={{
                  width: 320,
                  height: 450,
                  borderRadius: 12,
                  border: '1px solid var(--t-line)',
                  backgroundColor: 'var(--t-surface2)',
                  cursor: 'pointer'
                }}
                fallbackInitials={
                  <div className="rk-display" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 96, color: 'var(--t-line)' }}>
                    {initials(champ.player_name)}
                  </div>
                }
              />

              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span className="rk-display" style={{ background: 'var(--t-podium-1)', color: '#1a1200', padding: '4px 12px', fontSize: 14, letterSpacing: '0.18em', borderRadius: 4 }}>LÍDER ATUAL</span>
                    <Trend value={champ.position_change} />
                  </div>
                  <div className="rk-display" style={{ fontSize: 'clamp(40px, 5vw, 64px)' }}>
                    {champ.player_name.split(' ')[0].toUpperCase()}<br/>
                    <span style={{ color: 'var(--t-accent)' }}>{champ.player_name.split(' ').slice(1).join(' ').toUpperCase()}</span>
                  </div>
                </div>
                {champ.last_match && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', padding: 14, background: 'color-mix(in srgb, var(--t-bg) 50%, transparent)', border: '1px solid var(--t-line)', borderRadius: 8, marginTop: 16 }}>
                    <div className="rk-mono" style={{ fontSize: 10, color: 'var(--t-sub)' }}>ÚLT. PARTIDA</div>
                    <div className="rk-display" style={{ fontSize: 18 }}>vs {champ.last_match.opponent_name}</div>
                    <div className="rk-mono" style={{ fontSize: 16, color: 'var(--t-ink)' }}>{champ.last_match.score_formatted}</div>
                    <div className="rk-display" style={{ padding: '3px 10px', background: champ.last_match.result === 'Win' ? 'var(--t-accent2)' : '#ff5577', color: 'var(--t-bg)', fontSize: 12, letterSpacing: '0.18em', borderRadius: 4 }}>{champ.last_match.result === 'Win' ? 'V' : 'D'}</div>
                  </div>
                )}
              </div>

              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <StatRow label="PONTOS" value={champ.total_points} big accent />
                <StatRow label="TORNEIOS" value={champ.results_count} />
                {champ.win_rate != null && <StatRow label="% VITÓRIAS" value={`${champ.win_rate}%`} />}
                <StatRow label="VARIAÇÃO" value={champ.position_change > 0 ? `+${champ.position_change}` : (champ.position_change || 0)} />
              </div>
            </div>

            {/* PODIUM */}
            {top3.length === 3 && (
              <div style={{ marginBottom: 32 }}>
                <SectionHeader label="PÓDIO" sub="Top 3 da classe" />
                <div className="rk-podium" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  {top3.map((p, i) => <PodiumCard key={p.player_id} player={p} pos={i} onClick={() => setSelectedPlayerId(p.player_id)} />)}
                </div>
              </div>
            )}

            {/* RANKING COMPLETO */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                <SectionHeader label="RANKING COMPLETO" sub={`${rankings.length} JOGADORES`} inline />
                <div className="rk-mono" style={{ fontSize: 11, color: 'var(--t-sub)' }}>{selectedClass.toUpperCase()} · {categoryLabel.toUpperCase()}</div>
              </div>

              <div className="rk-card" style={{ overflow: 'hidden' }}>
                <div className="rk-row rk-mono hide-mobile" style={{ padding: '12px 20px', fontSize: 10, color: 'var(--t-sub)', cursor: 'default', borderBottom: '1px solid var(--t-line)' }}>
                  <span>POS</span><span>JOGADOR</span><span>CIDADE / CLUBE</span><span style={{ textAlign: 'center' }}>TEND</span><span style={{ textAlign: 'center' }}>% VIT</span><span style={{ textAlign: 'center' }}>TORN</span><span style={{ textAlign: 'right' }}>PONTOS</span>
                </div>
                {rest.map((p, i) => (
                  <div key={p.player_id} className="rk-row" onClick={() => setSelectedPlayerId(p.player_id)} style={{ position: 'relative' }}>
                    <span className="rk-display" style={{ fontSize: 24, color: 'var(--t-sub)' }}>{String(p.rank).padStart(2,'0')}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <span className="avatar" style={{ backgroundImage: p.photo_url ? `url(${p.photo_url})` : 'none' }}>
                        {!p.photo_url && initials(p.player_name)}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--t-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.player_name}</span>
                    </span>
                    <span className="rk-mono hide-mobile" style={{ fontSize: 11, color: 'var(--t-sub)' }}>—</span>
                    <span className="hide-mobile" style={{ textAlign: 'center' }}><Trend value={p.position_change} /></span>
                    <span className="rk-mono hide-mobile" style={{ textAlign: 'center', fontSize: 13, color: p.win_rate >= 70 ? 'var(--t-accent2)' : 'var(--t-ink)' }}>{p.win_rate != null ? `${p.win_rate}%` : '—'}</span>
                    <span className="rk-mono hide-mobile" style={{ textAlign: 'center', fontSize: 13, color: 'var(--t-sub)' }}>{p.results_count}</span>
                    <span className="rk-display" style={{ textAlign: 'right', fontSize: 26, color: 'var(--t-accent)' }}>{p.total_points}</span>
                    
                    {/* Hover tooltip com último confronto */}
                    {p.last_match && (
                      <div className="rk-hover-tooltip" style={{
                        position: 'absolute',
                        right: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'var(--t-surface2)',
                        border: '1px solid var(--t-line)',
                        borderRadius: 8,
                        padding: '8px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        opacity: 0,
                        pointerEvents: 'none',
                        transition: 'opacity 0.2s',
                        zIndex: 10,
                        whiteSpace: 'nowrap',
                      }}>
                        <span className="rk-mono" style={{ fontSize: 9, color: 'var(--t-sub)' }}>ÚLT. PARTIDA</span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>vs {p.last_match.opponent_name}</span>
                        <span className="rk-mono" style={{ fontSize: 12 }}>{p.last_match.score_formatted}</span>
                        <span style={{
                          padding: '2px 8px',
                          background: p.last_match.result === 'Win' ? 'var(--t-accent2)' : '#ff5577',
                          color: 'var(--t-bg)',
                          borderRadius: 3,
                          fontFamily: 'Anton, sans-serif',
                          fontSize: 11,
                          letterSpacing: '0.1em',
                        }}>
                          {p.last_match.result === 'Win' ? 'V' : 'D'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* POST GENERATOR MODAL */}
      <Dialog open={postOpen} onOpenChange={setPostOpen}>
        <DialogContent className="max-w-6xl" style={{ background: '#0d1a30 !important', border: '1px solid var(--t-line)', color: '#ffffff', maxHeight: '90vh', overflow: 'auto' }}>
          <DialogHeader>
            <DialogTitle className="rk-display" style={{ fontSize: 28, letterSpacing: '0.08em' }}>GERAR POST DO RANKING</DialogTitle>
          </DialogHeader>

          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, marginTop: 16 }}>
            {/* Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <ControlGroup label="Template">
                {Object.entries(POST_TEMPLATES).map(([k, v]) => (
                  <button key={k} onClick={() => setTemplate(k)} className={`rk-chip ${template===k?'active':''}`} style={{ textAlign: 'left', width: '100%' }}>{v.label}</button>
                ))}
              </ControlGroup>

              <ControlGroup label="Formato">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <button onClick={() => setFormat('feed')} className={`rk-chip ${format==='feed'?'active':''}`}>1:1 FEED</button>
                  <button onClick={() => setFormat('story')} className={`rk-chip ${format==='story'?'active':''}`}>9:16 STORY</button>
                </div>
              </ControlGroup>

              <ControlGroup label="Paleta">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {PALETTE_OPTIONS.map(p => (
                    <button key={p.key} onClick={() => setTheme(p.key)} style={{
                      padding: 10, border: `1px solid ${theme===p.key ? p.swatch[1] : 'var(--t-line)'}`,
                      background: theme===p.key ? 'color-mix(in srgb, var(--t-ink) 5%, transparent)' : 'transparent',
                      borderRadius: 6, cursor: 'pointer', textAlign: 'left', color: 'var(--t-ink)',
                      display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'Space Grotesk, sans-serif', fontSize: 11, letterSpacing: '0.1em',
                    }}>
                      <div style={{ display: 'flex', gap: 3 }}>
                        {p.swatch.map((c, i) => <span key={i} style={{ width: 16, height: 16, background: c, borderRadius: 3, border: '1px solid rgba(255,255,255,0.15)' }} />)}
                      </div>
                      {p.label.toUpperCase()}
                    </button>
                  ))}
                </div>
              </ControlGroup>

              <ControlGroup label="Conteúdo">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--t-ink)' }}>
                  <input type="checkbox" checked={showSecondHalf} onChange={(e) => setShowSecondHalf(e.target.checked)} />
                  Mostrar Top 6–10
                </label>
              </ControlGroup>

              <button onClick={handleExport} disabled={exporting} style={{
                background: 'var(--t-accent2)', color: 'var(--t-bg)', border: 'none', padding: '14px 18px',
                fontFamily: 'Anton, sans-serif', fontSize: 14, letterSpacing: '0.16em', cursor: exporting?'wait':'pointer', borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: exporting?0.6:1,
              }}>
                <Download size={16}/> {exporting ? 'GERANDO...' : 'BAIXAR PNG'}
              </button>
            </div>

            {/* Preview */}
            <PreviewBox format={format}>
              <div ref={exportRef} data-theme={theme}>
                <Template
                  players={rankings}
                  theme={theme}
                  format={format}
                  classLabel={selectedClass}
                  categoryLabel={categoryLabel}
                  showSecondHalf={showSecondHalf}
                  monthLabel={monthLabel}
                  logoSrc="/fsp.jpeg"
                />
              </div>
            </PreviewBox>
          </div>
        </DialogContent>
      </Dialog>

      <PlayerModal playerId={selectedPlayerId} onClose={() => setSelectedPlayerId(null)} />
    </div>
  );
};

// ─── Subcomponents ──────────────────────────────
const Trend = ({ value }) => {
  if (value == null || value === 0) return <span style={{ color: 'var(--t-sub)', fontSize: 12 }}>—</span>;
  const up = value > 0;
  return <span className="rk-mono" style={{ color: up ? 'var(--t-accent2)' : '#ff5577', fontSize: 12, fontWeight: 700 }}>{up ? '▲' : '▼'}{Math.abs(value)}</span>;
};

const StatRow = ({ label, value, big, accent }) => (
  <div className="rk-stat-row">
    <span className="rk-mono" style={{ fontSize: 11, color: 'var(--t-sub)' }}>{label}</span>
    <span className="rk-display" style={{ fontSize: big ? 44 : 28, color: accent ? 'var(--t-accent)' : 'var(--t-ink)' }}>{value}</span>
  </div>
);

const SectionHeader = ({ label, sub, inline }) => (
  <div style={{ display: inline ? 'flex' : 'block', gap: 16, alignItems: 'baseline', marginBottom: inline ? 0 : 14 }}>
    <div className="rk-display" style={{ fontSize: 26 }}>{label}</div>
    {sub && <div className="rk-mono" style={{ fontSize: 11, color: 'var(--t-sub)' }}>{sub}</div>}
  </div>
);

const PodiumCard = ({ player, pos, onClick }) => {
  const medalVar = `var(--t-podium-${pos+1})`;
  const isOne = pos === 0;
  const initials = ((player.player_name||'').trim().split(/\s+/).map(p=>p[0]||'').filter((_,i,a)=>i===0||i===a.length-1).join('')).toUpperCase();
  return (
    <div onClick={onClick} style={{
      position: 'relative', border: `2px solid ${medalVar}`, borderRadius: 12, overflow: 'hidden',
      background: 'color-mix(in srgb, var(--t-surface) 80%, transparent)',
      height: isOne ? 420 : 380, marginTop: isOne ? 0 : 20, cursor: 'pointer',
    }}>
      <div style={{ width: '100%', height: '75%', background: 'var(--t-surface2)', backgroundImage: player.photo_url ? `url(${player.photo_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {!player.photo_url && <div className="rk-display" style={{ fontSize: 72, color: 'var(--t-line)' }}>{initials}</div>}
        <div className="rk-display" style={{ position: 'absolute', top: 10, right: 10, width: 38, height: 38, borderRadius: 8, background: medalVar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#1a1200' }}>{pos+1}</div>
      </div>
      <div style={{ padding: '12px 16px 14px' }}>
        <div className="rk-display" style={{ fontSize: isOne ? 22 : 18, lineHeight: 1.1 }}>{player.player_name.toUpperCase()}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
          <span className="rk-display" style={{ fontSize: 28, color: 'var(--t-accent)' }}>{player.total_points}</span>
          <span className="rk-mono" style={{ fontSize: 10, color: 'var(--t-sub)' }}>PTS · {player.results_count} TORN.{player.win_rate != null ? ` · ${player.win_rate}% VIT.` : ''}</span>
        </div>
      </div>
    </div>
  );
};

const ControlGroup = ({ label, children }) => (
  <div>
    <div className="rk-mono" style={{ fontSize: 10, color: 'var(--t-sub)', marginBottom: 8 }}>{label.toUpperCase()}</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
  </div>
);

const PreviewBox = ({ format, children }) => {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.5);
  const W = 1080, H = format === 'feed' ? 1080 : 1920;
  useEffect(() => {
    const fit = () => {
      if (!containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      const sx = (r.width - 40) / W;
      const sy = (r.height - 40) / H;
      setScale(Math.max(0.1, Math.min(sx, sy, 1)));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [format]);
  return (
    <div ref={containerRef} style={{ background: 'var(--t-surface2)', border: '1px solid var(--t-line)', borderRadius: 8, minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
      <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: 'center center', flexShrink: 0 }}>
        {children}
      </div>
      <div className="rk-mono" style={{ position: 'absolute', bottom: 8, right: 12, fontSize: 10, color: 'var(--t-sub)' }}>{W}×{H} · {Math.round(scale*100)}%</div>
    </div>
  );
};

export default Rankings;
