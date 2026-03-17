import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { AdminGuard } from './components/AdminGuard';
import { Toaster } from 'sonner';
import './App.css';

function App() {
  return (
    <div className="App">
      <Toaster position="top-right" richColors />

      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Rankings />} />
            <Route path="rankings" element={<Rankings />} />
            <Route path="tournaments" element={<Tournaments />} />
            <Route path="tournaments/:id" element={<TournamentDetails />} />
            <Route path="players" element={<Players />} />
            <Route path="login" element={<Login />} />

            {/* ADMIN */}
            <Route path="admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
            <Route path="admin/tournaments" element={<AdminGuard><AdminTournaments /></AdminGuard>} />
            <Route path="admin/players" element={<AdminGuard><AdminPlayers /></AdminGuard>} />
            <Route path="admin/results" element={<AdminGuard><AdminResults /></AdminGuard>} />
            <Route path="admin/matches" element={<AdminGuard><AdminMatches /></AdminGuard>} />
            <Route path="admin/config" element={<AdminGuard><AdminRankingConfig /></AdminGuard>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
