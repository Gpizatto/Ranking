// frontend/src/components/Layout.js
// Top nav FIFA-style com chips de seção + barra de paleta para admin.
// Mantém logica de auth e rotas existentes (ajuste imports conforme seu projeto).

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // AJUSTE caminho se necessário
import StyleBar, { useTheme } from './fsp/StyleBar';
import { Mono } from './fsp';
import { Menu, X, LogOut } from 'lucide-react';

const NAV = [
  { to: '/', label: 'HOME' },
  { to: '/rankings', label: 'RANKINGS' },
  { to: '/players', label: 'JOGADORES' },
  { to: '/tournaments', label: 'TORNEIOS' },
];

const Layout = ({ children }) => {
  const { user, logout } = useAuth() || {};
  useTheme(); // garante data-theme aplicado no <html>
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = !!(user && (user.role === 'admin' || user.is_admin === true));
  const [open, setOpen] = useState(false);

  const isActive = (to) => to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--t-grad, var(--t-bg))', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .fsp-nav { position: sticky; top: 0; z-index: 50; background: color-mix(in srgb, var(--t-bg) 92%, transparent); backdrop-filter: blur(12px); border-bottom: 1px solid var(--t-line); }
        .fsp-nav-inner { max-width: 1480px; margin: 0 auto; padding: 14px 24px; display: flex; align-items: center; gap: 18px; }
        .fsp-nav-link { font-family: var(--font-display); font-size: 14px; letter-spacing: 0.16em; padding: 8px 16px; border-radius: 4px; color: var(--t-sub); border: 1px solid transparent; text-decoration: none; transition: all .15s; }
        .fsp-nav-link:hover { color: var(--t-ink); border-color: var(--t-line); }
        .fsp-nav-link.active { color: var(--t-bg); background: var(--t-accent); border-color: var(--t-accent); }
        .fsp-burger { display: none; }
        @media (max-width: 880px) {
          .fsp-nav-links { display: none !important; }
          .fsp-burger { display: flex !important; }
          .fsp-nav-mobile { padding: 12px 24px 18px; display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--t-line); }
        }
      `}</style>

      <header className="fsp-nav">
        <div className="fsp-nav-inner">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'var(--t-ink)' }}>
            <img src="/fsp.jpeg" alt="FSP" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
            <div>
              <div className="fsp-display" style={{ fontSize: 20, letterSpacing: '0.12em', lineHeight: 1 }}>FSP</div>
              <Mono size={9}>SQUASH PARANÁ</Mono>
            </div>
          </Link>

          <nav className="fsp-nav-links" style={{ display: 'flex', gap: 4, marginLeft: 16 }}>
            {NAV.map(item => (
              <Link key={item.to} to={item.to} className={`fsp-nav-link ${isActive(item.to) ? 'active' : ''}`}>{item.label}</Link>
            ))}
          </nav>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }} className="fsp-nav-links">
            <StyleBar isAdmin={isAdmin} />
            {user ? (
              <>
                <Mono size={11} style={{ color: 'var(--t-ink)' }}>{(user.name || user.email || 'USER').toUpperCase()}</Mono>
                {isAdmin && <span className="fsp-mono" style={{ fontSize: 9, padding: '3px 8px', background: 'var(--t-accent)', color: 'var(--t-bg)', borderRadius: 3 }}>ADMIN</span>}
                <button onClick={() => { logout?.(); navigate('/login'); }} className="fsp-btn-ghost" title="Sair" style={{ padding: 8 }}>
                  <LogOut size={14} />
                </button>
              </>
            ) : (
              <Link to="/login" className="fsp-btn-ghost" style={{ textDecoration: 'none' }}>ENTRAR</Link>
            )}
          </div>

          <button className="fsp-burger fsp-btn-ghost" style={{ marginLeft: 'auto', padding: 8 }} onClick={() => setOpen(o => !o)}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {open && (
          <div className="fsp-nav-mobile">
            {NAV.map(item => (
              <Link key={item.to} to={item.to} className={`fsp-nav-link ${isActive(item.to) ? 'active' : ''}`} onClick={() => setOpen(false)}>{item.label}</Link>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <StyleBar isAdmin={isAdmin} />
              {user && <button onClick={() => { logout?.(); navigate('/login'); }} className="fsp-btn-ghost"><LogOut size={14}/> SAIR</button>}
            </div>
          </div>
        )}
      </header>

      <main style={{ flex: 1, width: '100%', maxWidth: 1480, margin: '0 auto', padding: '32px 24px 60px' }}>
        {children}
      </main>

      <footer style={{ borderTop: '1px solid var(--t-line)', padding: '20px 24px', textAlign: 'center' }}>
        <Mono size={10}>© FEDERAÇÃO DE SQUASH DO PARANÁ · FEDERACAOSQUASHPR.COM.BR</Mono>
      </footer>
    </div>
  );
};

export default Layout;
