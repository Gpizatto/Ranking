import React, { useState, useEffect } from 'react';
import axios from '../../lib/api';
import { API } from '../../lib/api';
import { Calendar, Plus, Edit, Trash2, MapPin, GitBranch, Image, Radio } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
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
    end_date: '',
    location: '',
    is_completed: false,
    bracket_link: '',
    photos_link: '',
    stream_link: '',
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
        date: new Date(formData.date).toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
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
      end_date: tournament.end_date ? new Date(tournament.end_date).toISOString().split('T')[0] : '',
      location: tournament.location || '',
      is_completed: tournament.is_completed || false,
      bracket_link: tournament.bracket_link || '',
      photos_link: tournament.photos_link || '',
      stream_link: tournament.stream_link || '',
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
    setFormData({ name: '', date: '', end_date: '', location: '', is_completed: false, bracket_link: '', photos_link: '', stream_link: '' });
    setEditingTournament(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2" data-testid="admin-tournaments-title">Gerenciar Torneios</h1>
          <p className="text-gray-400">Cadastre e edite torneios</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-green-500 hover:bg-green-600" data-testid="add-tournament-button">
              <Plus className="w-4 h-4 mr-2" />
              Novo Torneio
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-green-500/20 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingTournament ? 'Editar Torneio' : 'Novo Torneio'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Nome */}
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

              {/* Data início e fim na mesma linha */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-300">Data de Início</Label>
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
                  <Label className="text-gray-300">Data de Término</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    data-testid="tournament-end-date-input"
                  />
                </div>
              </div>

              {/* Local */}
              <div>
                <Label className="text-gray-300">Local</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  data-testid="tournament-location-input"
                />
              </div>

              {/* Status */}
              <div
                onClick={() => setFormData({ ...formData, is_completed: !formData.is_completed })}
                className={`flex items-center justify-between px-4 py-2.5 rounded-lg cursor-pointer border transition-all select-none ${
                  formData.is_completed
                    ? 'bg-green-500/20 border-green-500/60 text-green-400'
                    : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                }`}
              >
                <span className="font-semibold text-sm">
                  {formData.is_completed ? '✅ Concluído' : '⏳ Em andamento'}
                </span>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.is_completed ? 'bg-green-500' : 'bg-slate-600'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${formData.is_completed ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </div>

              {/* Separador */}
              <div className="border-t border-slate-600 pt-4">
                <p className="text-gray-400 text-sm mb-3 font-semibold uppercase tracking-wide">Links externos</p>

                <div className="space-y-3">
                  {/* Link da Chave */}
                  <div>
                    <Label className="text-gray-300 flex items-center gap-2">
                      <GitBranch className="w-3.5 h-3.5 text-green-400" />
                      Link da Chave
                    </Label>
                    <Input
                      value={formData.bracket_link}
                      onChange={(e) => setFormData({ ...formData, bracket_link: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="https://..."
                    />
                  </div>

                  {/* Link das Fotos */}
                  <div>
                    <Label className="text-gray-300 flex items-center gap-2">
                      <Image className="w-3.5 h-3.5 text-blue-400" />
                      Link das Fotos
                    </Label>
                    <Input
                      value={formData.photos_link}
                      onChange={(e) => setFormData({ ...formData, photos_link: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="https://..."
                    />
                  </div>

                  {/* Link do Stream */}
                  <div>
                    <Label className="text-gray-300 flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-red-400" />
                      Link do Stream
                    </Label>
                    <Input
                      value={formData.stream_link}
                      onChange={(e) => setFormData({ ...formData, stream_link: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full bg-green-500 hover:bg-green-600">
                {editingTournament ? 'Salvar Alterações' : 'Criar Torneio'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-20 text-gray-400">Nenhum torneio cadastrado</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.map((tournament) => (
            <Card key={tournament.id} className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-white text-base leading-tight">{tournament.name}</CardTitle>
                  <Badge className={tournament.is_completed ? 'bg-green-500/20 text-green-400 border border-green-500/30 text-xs whitespace-nowrap' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs whitespace-nowrap'}>
                    {tournament.is_completed ? 'Concluído' : 'Em andamento'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center text-gray-400 text-sm">
                  <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                  {tournament.end_date
                    ? `${format(new Date(tournament.date), 'dd/MM/yyyy', { locale: ptBR })} — ${format(new Date(tournament.end_date), 'dd/MM/yyyy', { locale: ptBR })}`
                    : format(new Date(tournament.date), 'dd/MM/yyyy', { locale: ptBR })
                  }
                </div>
                {tournament.location && (
                  <div className="flex items-center text-gray-400 text-sm">
                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                    {tournament.location}
                  </div>
                )}

                {/* Indicadores de links */}
                <div className="flex gap-2 pt-1">
                  {tournament.bracket_link && (
                    <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                      <GitBranch className="w-3 h-3" />Chave
                    </span>
                  )}
                  {tournament.photos_link && (
                    <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                      <Image className="w-3 h-3" />Fotos
                    </span>
                  )}
                  {tournament.stream_link && (
                    <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                      <Radio className="w-3 h-3" />Stream
                    </span>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={() => handleEdit(tournament)} size="sm" className="flex-1 bg-blue-500 hover:bg-blue-600" data-testid={`edit-tournament-${tournament.id}`}>
                    <Edit className="w-3 h-3 mr-1" />Editar
                  </Button>
                  <Button onClick={() => handleDelete(tournament.id)} size="sm" className="flex-1 bg-red-500 hover:bg-red-600" data-testid={`delete-tournament-${tournament.id}`}>
                    <Trash2 className="w-3 h-3 mr-1" />Excluir
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
