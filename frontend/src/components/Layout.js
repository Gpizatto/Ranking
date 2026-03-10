import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Trophy, Users, Calendar, Settings, LogOut, Shield } from 'lucide-react';
import { isAuthenticated, logout } from '../lib/api';
import { useNavigate } from 'react-router-dom';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuth = isAuthenticated();
  const isAdminPage = location.pathname.startsWith('/admin');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-lg border-b border-green-500/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white" data-testid="app-title">SquashRank Pro</h1>
                <p className="text-xs text-green-400">Federação de Squash do Paraná</p>
              </div>
            </Link>

            <nav className="flex items-center space-x-1">
              <Link
                to="/rankings"
                className={`px-4 py-2 rounded-lg transition-all ${location.pathname === '/rankings' || location.pathname === '/' ? 'bg-green-500 text-white' : 'text-gray-300 hover:bg-slate-800'}`}
                data-testid="nav-rankings"
              >
                <Trophy className="w-4 h-4 inline mr-2" />
                Rankings
              </Link>
              <Link
                to="/tournaments"
                className={`px-4 py-2 rounded-lg transition-all ${location.pathname === '/tournaments' ? 'bg-green-500 text-white' : 'text-gray-300 hover:bg-slate-800'}`}
                data-testid="nav-tournaments"
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Torneios
              </Link>
              <Link
                to="/players"
                className={`px-4 py-2 rounded-lg transition-all ${location.pathname === '/players' ? 'bg-green-500 text-white' : 'text-gray-300 hover:bg-slate-800'}`}
                data-testid="nav-players"
              >
                <Users className="w-4 h-4 inline mr-2" />
                Jogadores
              </Link>
              
              {isAuth ? (
                <>
                  <Link
                    to="/admin"
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
                  to="/login"
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
                to="/admin"
                className={`px-3 py-1.5 text-sm rounded ${location.pathname === '/admin' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-slate-700'}`}
                data-testid="admin-nav-dashboard"
              >
                Dashboard
              </Link>
              <Link
                to="/admin/tournaments"
                className={`px-3 py-1.5 text-sm rounded ${location.pathname === '/admin/tournaments' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-slate-700'}`}
                data-testid="admin-nav-tournaments"
              >
                Torneios
              </Link>
              <Link
                to="/admin/players"
                className={`px-3 py-1.5 text-sm rounded ${location.pathname === '/admin/players' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-slate-700'}`}
                data-testid="admin-nav-players"
              >
                Jogadores
              </Link>
              <Link
                to="/admin/results"
                className={`px-3 py-1.5 text-sm rounded ${location.pathname === '/admin/results' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-slate-700'}`}
                data-testid="admin-nav-results"
              >
                Resultados
              </Link>
              <Link
                to="/admin/config"
                className={`px-3 py-1.5 text-sm rounded ${location.pathname === '/admin/config' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-slate-700'}`}
                data-testid="admin-nav-config"
              >
                <Settings className="w-3 h-3 inline mr-1" />
                Config. Ranking
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/50 border-t border-green-500/20 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
          © 2025 Federação de Squash do Paraná - SquashRank Pro
        </div>
      </footer>
    </div>
  );
};

export default Layout;
