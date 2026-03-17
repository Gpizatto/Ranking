import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Trophy, Users, Calendar, Settings, LogOut, Shield } from 'lucide-react';
import { isAuthenticated, logout } from '../lib/api';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isAuth = isAuthenticated();
  const isAdminPage = location.pathname.includes('/admin');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '') return location.pathname === '/' || location.pathname === '/rankings';
    return location.pathname.startsWith(`/${path}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">

      {/* Hero */}
      {(location.pathname === '/' || location.pathname === '/rankings') && (
        <div className="relative h-64 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/70 to-transparent z-10" />
          <img
            src="https://i0.wp.com/worldsquashchamps.com/wp-content/uploads/world-champs-finals-62-of-74-scaled.jpg?ssl=1"
            alt="Squash"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-5xl font-bold text-white mb-2">SquashRank Pro</h1>
              <p className="text-xl text-green-400">
                Federação de Squash do Paraná
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-lg border-b border-green-500/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">

            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Federação de Squash do Paraná
                </h1>
                <p className="text-xs text-green-400">Rankings Oficiais</p>
              </div>
            </Link>

            {/* Nav */}
            <nav className="flex items-center space-x-1">
              <Link
                to="/rankings"
                className={`px-4 py-2 rounded-lg ${isActive('rankings') ? 'bg-green-500 text-white' : 'text-gray-300 hover:bg-slate-800'}`}
              >
                <Trophy className="w-4 h-4 inline mr-2" />
                Rankings
              </Link>

              <Link
                to="/tournaments"
                className={`px-4 py-2 rounded-lg ${isActive('tournaments') ? 'bg-green-500 text-white' : 'text-gray-300 hover:bg-slate-800'}`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Torneios
              </Link>

              <Link
                to="/players"
                className={`px-4 py-2 rounded-lg ${isActive('players') ? 'bg-green-500 text-white' : 'text-gray-300 hover:bg-slate-800'}`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Jogadores
              </Link>

              {isAuth ? (
                <>
                  <Link
                    to="/admin"
                    className={`px-4 py-2 rounded-lg ${isAdminPage ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-slate-800'}`}
                  >
                    <Shield className="w-4 h-4 inline mr-2" />
                    Admin
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-lg text-gray-300 hover:bg-red-500/20 hover:text-red-400"
                  >
                    <LogOut className="w-4 h-4 inline mr-2" />
                    Sair
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Admin subnav */}
      {isAuth && isAdminPage && (
        <div className="bg-slate-800/50 border-b border-blue-500/20">
          <div className="container mx-auto px-4 py-2 flex space-x-1">

            <Link to="/admin" className="px-3 py-1.5 text-sm rounded text-gray-400 hover:bg-slate-700">
              Dashboard
            </Link>

            <Link to="/admin/tournaments" className="px-3 py-1.5 text-sm rounded text-gray-400 hover:bg-slate-700">
              Torneios
            </Link>

            <Link to="/admin/players" className="px-3 py-1.5 text-sm rounded text-gray-400 hover:bg-slate-700">
              Jogadores
            </Link>

            <Link to="/admin/results" className="px-3 py-1.5 text-sm rounded text-gray-400 hover:bg-slate-700">
              Resultados
            </Link>

            <Link to="/admin/matches" className="px-3 py-1.5 text-sm rounded text-gray-400 hover:bg-slate-700">
              Partidas
            </Link>

            <Link to="/admin/config" className="px-3 py-1.5 text-sm rounded text-gray-400 hover:bg-slate-700">
              <Settings className="w-3 h-3 inline mr-1" />
              Config
            </Link>

          </div>
        </div>
      )}

      {/* Conteúdo */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/50 border-t border-green-500/20 py-6 mt-12 text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} Federação de Squash do Paraná — Powered by SquashRank Pro
      </footer>
    </div>
  );
};

export default Layout;
