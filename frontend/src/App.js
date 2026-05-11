import React, { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Rankings from './pages/Rankings';
import Tournaments from './pages/Tournaments';
import TournamentDetails from './pages/TournamentDetails';
import Players from './pages/Players';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTournaments from './pages/admin/AdminTournaments';
import AdminPlayers from './pages/admin/AdminPlayers';
import AdminResults from './pages/admin/AdminResults';
import AdminMatches from './pages/admin/AdminMatches';
import AdminRankingConfig from './pages/admin/AdminRankingConfig';
import AdminLayout from './pages/admin/AdminLayout';
import AdminUsers from './pages/admin/AdminUsers';
import Pending from './pages/Pending';
import { AdminGuard } from './components/AdminGuard';
import { Toaster } from 'sonner';
import { cachedGet, TTL } from './lib/cache';
import axios, { API } from './lib/api';
import './App.css';

// Prefetch silencioso: carrega todos os dados em background logo que o app abre.
// Quando o usuário navegar rapidamente entre páginas, os dados já estão no cache.
function usePrefetch() {
  useEffect(() => {
    const CLASSES = ['1ª', '2ª', '3ª', '4ª', '5ª', '6ª'];
    const CATS = ['Feminina', 'Masculina'];

    const urls = [
      { url: `${API}/players`,     ttl: TTL.PLAYERS },
      { url: `${API}/tournaments`, ttl: TTL.TOURNAMENTS },
      { url: `${API}/theme`,       ttl: TTL.THEME },
      ...CLASSES.flatMap(cls => CATS.map(cat => ({
        url: `${API}/rankings?class_category=${cls}&gender_category=${cat}`,
        ttl: TTL.RANKINGS,
      }))),
      { url: `${API}/rankings?class_category=Duplas&gender_category=Mista`, ttl: TTL.RANKINGS },
    ];

    // 1 request a cada 300ms — não sobrecarrega o servidor
    urls.forEach(({ url, ttl }, i) => {
      setTimeout(() => { cachedGet(url, ttl, axios).catch(() => {}); }, i * 300);
    });
  }, []);
}

function App() {
  usePrefetch();

  return (
    <div className="App">
      <Toaster position="top-right" richColors />
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Rankings />} />
            <Route path="rankings" element={<Rankings />} />
            <Route path="tournaments" element={<Tournaments />} />
            <Route path="tournaments/:id" element={<TournamentDetails />} />
            <Route path="players" element={<Players />} />
            <Route path="login" element={<Login />} />
            <Route path="admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
            <Route path="admin/tournaments" element={<AdminGuard><AdminTournaments /></AdminGuard>} />
            <Route path="admin/players" element={<AdminGuard><AdminPlayers /></AdminGuard>} />
            <Route path="admin/results" element={<AdminGuard><AdminResults /></AdminGuard>} />
            <Route path="admin/matches" element={<AdminGuard><AdminMatches /></AdminGuard>} />
            <Route path="admin/config" element={<AdminGuard><AdminRankingConfig /></AdminGuard>} />
            <Route path="admin/layout" element={<AdminGuard><AdminLayout /></AdminGuard>} />
            <Route path="admin/users" element={<AdminGuard><AdminUsers /></AdminGuard>} />
            <Route path="pending" element={<Pending />} />
          </Route>
        </Routes>
      </HashRouter>
    </div>
  );
}

export default App;
