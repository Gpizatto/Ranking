import React, { useState, useEffect } from 'react';
import axios from '../../lib/api';
import { API } from '../../lib/api';
import { Calendar, Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminTournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: ''
  });

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await axios.get(`${API}/tournaments`);
      setTournaments(response.data);
    } catch (error) {
      toast.error('Erro ao carregar torneios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        date: new Date(formData.date).toISOString()
      };

      if (editingTournament) {
        await axios.put(`${API}/tournaments/${editingTournament.id}`, data);
        toast.success('Torneio atualizado com sucesso!');
      } else {
        await axios.post(`${API}/tournaments`, data);
        toast.success('Torneio criado com sucesso!');
      }

      setDialogOpen(false);
      resetForm();
      fetchTournaments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar torneio');
    }
  };

  const handleEdit = (tournament) => {
    setEditingTournament(tournament);
    setFormData({
      name: tournament.name,
      date: new Date(tournament.date).toISOString().split('T')[0],
      location: tournament.location || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este torneio?')) return;

    try {
      await axios.delete(`${API}/tournaments/${id}`);
      toast.success('Torneio excluído com sucesso!');
      fetchTournaments();
    } catch (error) {
      toast.error('Erro ao excluir torneio');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', date: '', location: '' });
    setEditingTournament(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2" data-testid="admin-tournaments-title">Gerenciar Torneios</h1>
          <p className="text-gray-400">Cadastre e edite torneios</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-green-500 hover:bg-green-600" data-testid="add-tournament-button">
              <Plus className="w-4 h-4 mr-2" />
              Novo Torneio
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-green-500/20">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingTournament ? 'Editar Torneio' : 'Novo Torneio'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-gray-300">Nome do Torneio</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                  data-testid="tournament-name-input"
                />
              </div>
              <div>
                <Label className="text-gray-300">Data</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                  data-testid="tournament-date-input"
                />
              </div>
              <div>
                <Label className="text-gray-300">Local</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  data-testid="tournament-location-input"
                />
              </div>
              <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600" data-testid="tournament-submit-button">
                {editingTournament ? 'Atualizar' : 'Criar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : tournaments.length === 0 ? (
        <Card className="bg-slate-800/50 border-blue-500/20">
          <CardContent className="py-12">
            <div className="text-center text-gray-400">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Nenhum torneio cadastrado</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="tournaments-admin-grid">
          {tournaments.map((tournament) => (
            <Card key={tournament.id} className="bg-slate-800/50 border-blue-500/20" data-testid={`tournament-admin-card-${tournament.id}`}>
              <CardHeader>
                <CardTitle className="text-white">{tournament.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-gray-400">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{format(new Date(tournament.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                </div>
                {tournament.location && (
                  <div className="flex items-center text-gray-400">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{tournament.location}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleEdit(tournament)}
                    size="sm"
                    className="flex-1 bg-blue-500 hover:bg-blue-600"
                    data-testid={`edit-tournament-${tournament.id}`}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    onClick={() => handleDelete(tournament.id)}
                    size="sm"
                    className="flex-1 bg-red-500 hover:bg-red-600"
                    data-testid={`delete-tournament-${tournament.id}`}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTournaments;
