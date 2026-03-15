import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Trophy, Users, Calendar, Settings, LogOut, Shield } from 'lucide-react';
import { isAuthenticated, logout } from '../lib/api';
import { useFederation } from '../context/FederationContext';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { federation, slug, loading } = useFederation();

  const isAuth = isAuthenticated(slug);
  const isAdminPage = location.pathname.includes('/admin');

  const handleLogout = () => {
    logout(slug);
    navigate(`/${slug}/login`);
  };

  // Helper — verifica se o path atual bate com o link
  const isActive = (path) => {
    if (path === '') return location.pathname === `/${slug}` || location.pathname === `/${slug}/rankings`;
    return location.pathname.startsWith(`/${slug}/${path}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">

      {/* Hero Image Banner — só na home/rankings */}
      {(location.pathname === `/${slug}` || location.pathname === `/${slug}/rankings`) && (
        <div className="relative h-64 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/70 to-transparent z-10" />
          <img
            src="https://i0.wp.com/worldsquashchamps.com/wp-content/uploads/world-champs-finals-62-of-74-scaled.jpg?ssl=1"
            alt="Squash Action"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-5xl font-bold text-white mb-2">SquashRank Pro</h1>
              <p className="text-xl text-green-400">
                {loading ? '...' : federation?.name || 'Rankings Oficiais'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-lg border-b border-green-500/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">

            {/* Logo + Nome da Federação */}
            <Link to={`/${slug}`} className="flex items-center space-x-3">
              {federation?.logo_url ? (
                <img
                  src={federation.logo_url}
                  alt={federation.name}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white" data-testid="app-title">
                  {loading ? 'SquashRank Pro' : federation?.name || 'SquashRank Pro'}
                </h1>
                <p className="text-xs text-green-400">Rankings Oficiais</p>
              </div>
            </Link>

            {/* Nav */}
            <nav className="flex items-center space-x-1">
              <Link
                to={`/${slug}/rankings`}
                className={`px-4 py-2 rounded-lg transition-all ${isActive('rankings') ? 'bg-green-500 text-white' : 'text-gray-300 hover:bg-slate-800'}`}
                data-testid="nav-rankings"
              >
                <Trophy className="w-4 h-4 inline mr-2" />
                Rankings
              </Link>
              <Link
                to={`/${slug}/tournaments`}
                className={`px-4 py-2 rounded-lg transition-all ${isActive('tournaments') ? 'bg-green-500 text-white' : 'text-gray-300 hover:bg-slate-800'}`}
                data-testid="nav-tournaments"
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Torneios
              </Link>
              <Link
                to={`/${slug}/players`}
                className={`px-4 py-2 rounded-lg transition-all ${isActive('players') ? 'bg-green-500 text-white' : 'text-gray-300 hover:bg-slate-800'}`}
                data-testid="nav-players"
              >
                <Users className="w-4 h-4 inline mr-2" />
                Jogadores
              </Link>

              {isAuth ? (
                <>
                  <Link
                    to={`/${slug}/admin`}
                    className={`px-4 py-2 rounded-lg transition-all ${isAdminPage ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-slate-800'}`}
                    data-testid="nav-admin"
                  >
                    <Shield className="w-4 h-4 inline mr-2" />
                    Admin
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-lg text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-all"
                    data-testid="logout-button"
                  >
                    <LogOut className="w-4 h-4 inline mr-2" />
                    Sair
                  </button>
                </>
              ) : (
                <Link
                  to={`/${slug}/login`}
                  className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all"
                  data-testid="login-button"
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Admin Subnav */}
      {isAuth && isAdminPage && (
        <div className="bg-slate-800/50 border-b border-blue-500/20">
          <div className="container mx-auto px-4 py-2">
            <div className="flex space-x-1">
              <Link
                to={`/${slug}/admin`}
                className={`px-3 py-1.5 text-sm rounded ${location.pathname === `/${slug}/admin` ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-slate-700'}`}
                data-testid="admin-nav-dashboard"
              >
                Dashboard
              </Link>
              <Link
                to={`/${slug}/admin/tournaments`}
                className={`px-3 py-1.5 text-sm rounded ${isActive('admin/tournaments') ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-slate-700'}`}
                data-testid="admin-nav-tournaments"
              >
                Torneios
              </Link>
              <Link
                to={`/${slug}/admin/players`}
                className={`px-3 py-1.5 text-sm rounded ${isActive('admin/players') ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-slate-700'}`}
                data-testid="admin-nav-players"
              >
                Jogadores
              </Link>
              <Link
                to={`/${slug}/admin/results`}
                className={`px-3 py-1.5 text-sm rounded ${isActive('admin/results') ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-slate-700'}`}
                data-testid="admin-nav-results"
              >
                Resultados
              </Link>
              <Link
                to={`/${slug}/admin/matches`}
                className={`px-3 py-1.5 text-sm rounded ${isActive('admin/matches') ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-slate-700'}`}
                data-testid="admin-nav-matches"
              >
                Partidas
              </Link>
              <Link
                to={`/${slug}/admin/config`}
                className={`px-3 py-1.5 text-sm rounded ${isActive('admin/config') ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-slate-700'}`}
                data-testid="admin-nav-config"
              >
                <Settings className="w-3 h-3 inline mr-1" />
                Config. Ranking
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Federation not found */}
      {!loading && !federation && (
        <div className="container mx-auto px-4 py-20 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-50" />
          <h2 className="text-2xl font-bold text-white mb-2">Federação não encontrada</h2>
          <p className="text-gray-400 mb-6">O slug <span className="text-green-400 font-mono">/{slug}</span> não corresponde a nenhuma federação cadastrada.</p>
          <Link to="/" className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors">
            Ver todas as federações
          </Link>
        </div>
      )}

      {/* Main Content */}
      {(loading || federation) && (
        <main className="container mx-auto px-4 py-8">
          <Outlet />
        </main>
      )}

      {/* Footer */}
      <footer className="bg-slate-900/50 border-t border-green-500/20 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
          © {new Date().getFullYear()} {federation?.name || 'SquashRank Pro'} — Powered by SquashRank Pro
        </div>
      </footer>
    </div>
  );
};

export default Layout;