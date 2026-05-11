import React, { useState, useEffect } from 'react';
import axios, { API } from '../lib/api';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Trophy, Users, Calendar, Settings, LogOut, Shield, Menu, X, LayoutDashboard, FileText, Swords, Palette, UserCheck } from 'lucide-react';
import { isAuthenticated, logout } from '../lib/api';
import { getCached, cachedGet, TTL } from '../lib/cache';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Inicializa tema do cache imediatamente — sem flash de tema padrão
  useEffect(() => {
    const themeUrl = `${API}/theme`;
    
    // Mapeamento: backend theme ID -> FSP theme
    const themeMap = {
      'blue': 'storm',
      'red': 'inferno',
      'orange': 'champion',
      'silver': 'glacier',
      'green': 'storm',  // fallback
      'purple': 'storm',  // fallback
    };

    // 1. Aplicar tema do cache imediatamente (síncrono)
    const cachedTheme = getCached(themeUrl);
    if (cachedTheme) {
      const fspTheme = themeMap[cachedTheme.theme] || 'storm';
      document.documentElement.setAttribute('data-theme', fspTheme);
    }

    // 2. Buscar tema do servidor em background (só na primeira vez ou expirado)
    cachedGet(themeUrl, TTL.THEME, axios).then(data => {
      const fspTheme = themeMap[data.theme] || 'storm';
      document.documentElement.setAttribute('data-theme', fspTheme);
    }).catch(() => {});
  }, []); // roda UMA vez — não a cada navegação

  // Verificar owner status — também com cache, não a cada clique
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    const statusUrl = `${API}/auth/approval-status`;

    // 1. Usar cache imediatamente se disponível
    const cached = getCached(statusUrl);
    if (cached) {
      setIsOwner(cached.is_owner || false);
      return;
    }

    // 2. Buscar do servidor e cachear por 5 minutos
    cachedGet(statusUrl, 300, axios)
      .then(res => setIsOwner(res.is_owner || false))
      .catch(() => setIsOwner(false));
  }, []); // roda UMA vez por sessão — não a cada navegação

  const isAuth = isAuthenticated();
  const isAdminPage = location.pathname.includes('/admin');

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const isActive = (path) => {
    if (path === '') return location.pathname === '/' || location.pathname === '/rankings';
    return location.pathname.startsWith(`/${path}`);
  };

  const isAdminActive = (path) => location.pathname === path;

  const navLinks = [
    { to: '/rankings', label: 'Rankings', icon: Trophy },
    { to: '/tournaments', label: 'Torneios', icon: Calendar },
    { to: '/players', label: 'Jogadores', icon: Users },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/admin/tournaments', label: 'Torneios', icon: Calendar },
    { to: '/admin/players', label: 'Jogadores', icon: Users },
    { to: '/admin/results', label: 'Resultados', icon: FileText },
    { to: '/admin/matches', label: 'Partidas', icon: Swords },
    { to: '/admin/layout', label: 'Layout', icon: Palette },
    { to: '/admin/users', label: 'Usuários', icon: UserCheck, ownerOnly: true },
    { to: '/admin/config', label: 'Config', icon: Settings },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--t-grad, var(--t-bg))', color: 'var(--t-ink)' }}>
      <style>{`
        .fsp-layout { font-family: 'Space Grotesk', system-ui, sans-serif; }
        .fsp-display { font-family: 'Anton', Impact, sans-serif; letter-spacing: 0.12em; }
        .fsp-mono { font-family: 'JetBrains Mono', monospace; letter-spacing: 0.18em; font-size: 10px; color: var(--t-sub); }
        
        .fsp-nav { position: sticky; top: 0; z-index: 50; background: color-mix(in srgb, var(--t-bg) 92%, transparent); backdrop-filter: blur(12px); border-bottom: 1px solid var(--t-line); }
        .fsp-nav-inner { max-width: 1480px; margin: 0 auto; padding: 14px 24px; display: flex; align-items: center; gap: 18px; }
        
        .fsp-nav-link { font-family: 'Anton', sans-serif; font-size: 13px; letter-spacing: 0.16em; padding: 8px 14px; border-radius: 4px; color: var(--t-sub); border: 1px solid transparent; text-decoration: none; transition: all .15s; display: flex; align-items: center; gap: 6px; }
        .fsp-nav-link:hover { color: var(--t-ink); border-color: var(--t-line); }
        .fsp-nav-link.active { color: var(--t-bg); background: var(--t-accent); border-color: var(--t-accent); }
        
        .fsp-btn-ghost { background: transparent; border: 1px solid var(--t-line); color: var(--t-ink); padding: 8px 14px; border-radius: 4px; cursor: pointer; font-family: 'Anton', sans-serif; font-size: 12px; letter-spacing: 0.14em; display: flex; align-items: center; gap: 6px; transition: all .15s; }
        .fsp-btn-ghost:hover { border-color: var(--t-accent); color: var(--t-accent); }
        
        .fsp-hero { position: relative; height: 200px; overflow: hidden; border-bottom: 1px solid var(--t-line); }
        .fsp-hero img { width: 100%; height: 100%; object-fit: cover; opacity: 0.3; }
        .fsp-hero-content { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; text-align: center; }
        
        @media (max-width: 880px) {
          .fsp-nav-desktop { display: none !important; }
          .fsp-hero { height: 160px; }
        }
        @media (min-width: 881px) {
          .fsp-nav-mobile-btn { display: none !important; }
        }
      `}</style>

      {/* Hero (apenas em / ou /rankings) */}
      {(location.pathname === '/' || location.pathname === '/rankings') && (
        <div className="fsp-hero">
          <img
            src="https://i0.wp.com/worldsquashchamps.com/wp-content/uploads/world-champs-finals-62-of-74-scaled.jpg?ssl=1"
            alt="Squash"
          />
          <div className="fsp-hero-content">
            <div>
              <h1 className="fsp-display" style={{ fontSize: 'clamp(32px, 6vw, 56px)', margin: 0, lineHeight: 0.95 }}>
                SQUASHRANK<br/><span style={{ color: 'var(--t-accent)' }}>PRO</span>
              </h1>
              <p className="fsp-mono" style={{ marginTop: 12, fontSize: 11, color: 'var(--t-accent2)' }}>FEDERAÇÃO DE SQUASH DO PARANÁ</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="fsp-nav">
        <div className="fsp-nav-inner">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'var(--t-ink)' }}>
            <img src="/fsp.jpeg" alt="FSP" style={{ width: 42, height: 42, borderRadius: 6, objectFit: 'cover' }} />
            <div>
              <div className="fsp-display" style={{ fontSize: 18, lineHeight: 1 }}>FSP</div>
              <div className="fsp-mono" style={{ fontSize: 9 }}>RANKINGS OFICIAIS</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="fsp-nav-desktop" style={{ display: 'flex', gap: 6, marginLeft: 16 }}>
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className={`fsp-nav-link ${isActive(to.slice(1)) ? 'active' : ''}`}>
                <Icon size={14} />{label.toUpperCase()}
              </Link>
            ))}
          </nav>

          {/* Desktop auth */}
          <div className="fsp-nav-desktop" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            {isAuth ? (
              <>
                <Link to="/admin" className={`fsp-nav-link ${isAdminPage ? 'active' : ''}`}>
                  <Shield size={14} />ADMIN
                </Link>
                <button onClick={handleLogout} className="fsp-btn-ghost" style={{ padding: '6px 12px' }}>
                  <LogOut size={14} />SAIR
                </button>
              </>
            ) : (
              <Link to="/login" className="fsp-btn-ghost" style={{ textDecoration: 'none', padding: '6px 16px' }}>LOGIN</Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="fsp-nav-mobile-btn fsp-btn-ghost"
            style={{ marginLeft: 'auto', padding: 8 }}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ padding: '12px 24px 18px', display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--t-line)' }}>
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className={`fsp-nav-link ${isActive(to.slice(1)) ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                <Icon size={14} />{label.toUpperCase()}
              </Link>
            ))}
            {isAuth ? (
              <>
                <Link to="/admin" className={`fsp-nav-link ${isAdminPage ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                  <Shield size={14} />ADMIN
                </Link>
                <button onClick={handleLogout} className="fsp-btn-ghost">
                  <LogOut size={14} />SAIR
                </button>
              </>
            ) : (
              <Link to="/login" className="fsp-btn-ghost" style={{ textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>LOGIN</Link>
            )}
          </div>
        )}
      </header>

      {/* Admin subnav */}
      {isAuth && isAdminPage && (
        <div style={{ background: 'color-mix(in srgb, var(--t-surface) 50%, transparent)', borderBottom: '1px solid var(--t-line)' }}>
          <div style={{ maxWidth: 1480, margin: '0 auto', padding: '10px 24px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {adminLinks.filter(l => !l.ownerOnly || isOwner).map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 4,
                fontSize: 11, fontFamily: 'Anton, sans-serif', letterSpacing: '0.14em',
                background: isAdminActive(to) ? 'var(--t-accent)' : 'transparent',
                color: isAdminActive(to) ? 'var(--t-bg)' : 'var(--t-sub)',
                border: `1px solid ${isAdminActive(to) ? 'var(--t-accent)' : 'var(--t-line)'}`,
                textDecoration: 'none', transition: 'all .15s',
              }}>
                <Icon size={13} />{label.toUpperCase()}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Conteúdo */}
      <main style={{ maxWidth: 1480, margin: '0 auto', padding: '32px 24px 60px' }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--t-line)', padding: '20px 24px', textAlign: 'center' }}>
        <div className="fsp-mono" style={{ fontSize: 10 }}>© {new Date().getFullYear()} FEDERAÇÃO DE SQUASH DO PARANÁ · POWERED BY SQUASHRANK PRO</div>
      </footer>
    </div>
  );
};

export default Layout;
