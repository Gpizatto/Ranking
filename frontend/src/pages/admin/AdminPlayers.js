import React, { useState, useEffect, useRef } from 'react';
import axios from '../../lib/api';
import { API } from '../../lib/api';
import { Users, Plus, Edit, Trash2, Upload, Camera, FileText, Filter, X, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { toast } from 'sonner';

const AdminPlayers = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    photo_url: '',
    city: '',
    academy: '',
    coach: '',
    main_class: '1a',
    birth_date: '',
    gender: ''
  });
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ name: '', gender: '', city: '', academy: '' });
  const fileInputRef = useRef(null);
  const excelInputRef = useRef(null);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await axios.get(`${API}/players`);
      setPlayers(response.data);
    } catch (error) {
      toast.error('Erro ao carregar jogadores');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 5MB');
      return;
    }

    setUploading(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await axios.post(`${API}/players/upload-photo`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFormData({ ...formData, photo_url: response.data.photo_url });
      toast.success('Foto carregada com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer upload da foto');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingPlayer) {
        await axios.put(`${API}/players/${editingPlayer.id}`, formData);
        toast.success('Jogador atualizado com sucesso!');
      } else {
        await axios.post(`${API}/players`, formData);
        toast.success('Jogador criado com sucesso!');
      }

      setDialogOpen(false);
      resetForm();
      fetchPlayers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar jogador');
    }
  };

  const handleEdit = (player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      photo_url: player.photo_url || '',
      city: player.city || '',
      academy: player.academy || '',
      coach: player.coach || '',
      main_class: player.main_class || '1a',
      birth_date: player.birth_date || '',
      gender: player.gender || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este jogador?')) return;

    try {
      await axios.delete(`${API}/players/${id}`);
      toast.success('Jogador excluído com sucesso!');
      fetchPlayers();
    } catch (error) {
      toast.error('Erro ao excluir jogador');
    }
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await axios.post(`${API}/import-players-excel`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setImportResult(response.data);
      
      if (response.data.players_created > 0 || response.data.players_updated > 0) {
        toast.success(`${response.data.players_created} criados, ${response.data.players_updated} atualizados!`);
        fetchPlayers();
      }
      
      if (response.data.errors.length > 0) {
        toast.error(`${response.data.errors.length} erros encontrados`);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao importar Excel');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', photo_url: '', city: '', academy: '', coach: '', main_class: '1a', birth_date: '', gender: '' });
    setEditingPlayer(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get(`${API}/players/template`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'modelo_jogadores.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Modelo baixado com sucesso!');
    } catch (error) {
      toast.error('Erro ao baixar modelo');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2" data-testid="admin-players-title">Gerenciar Jogadores</h1>
          <p className="text-gray-400 text-sm">Cadastre e edite jogadores</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setFilterOpen(!filterOpen)}
            variant="outline"
            className={`border-slate-600 gap-2 ${filterOpen ? 'bg-blue-500 text-white border-blue-500' : 'text-gray-300 hover:bg-slate-700'}`}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
          <Button
            onClick={handleDownloadTemplate}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <FileText className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Baixar Modelo</span>
          </Button>
          <Button
            onClick={() => excelInputRef.current?.click()}
            className="bg-purple-500 hover:bg-purple-600"
            data-testid="import-players-button"
          >
            <Upload className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Importar Excel</span>
          </Button>
          <input
            ref={excelInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportExcel}
            className="hidden"
          />
          
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-green-500 hover:bg-green-600" data-testid="add-player-button">
                <Plus className="w-4 h-4 mr-2" />
                Novo Jogador
              </Button>
            </DialogTrigger>
          <DialogContent className="bg-slate-800 border-green-500/20">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingPlayer ? 'Editar Jogador' : 'Novo Jogador'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={formData.photo_url} />
                    <AvatarFallback className="bg-green-500 text-white text-2xl">
                      {formData.name ? formData.name.charAt(0) : <Camera className="w-8 h-8" />}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 rounded-full p-2"
                    disabled={uploading}
                    data-testid="upload-photo-button"
                  >
                    <Upload className="w-4 h-4 text-white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
              {uploading && (
                <p className="text-center text-sm text-gray-400">Fazendo upload...</p>
              )}
              <div>
                <Label className="text-gray-300">Nome do Jogador</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                  data-testid="player-name-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-300">Cidade</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Curitiba, PR"
                    data-testid="player-city-input"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Classe Principal</Label>
                  <Select
                    value={formData.main_class}
                    onValueChange={(value) => setFormData({ ...formData, main_class: value })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="player-class-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['1a', '2a', '3a', '4a', '5a', '6a', 'Duplas'].map(cls => (
                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-gray-300">Academia</Label>
                <Input
                  value={formData.academy}
                  onChange={(e) => setFormData({ ...formData, academy: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Nome da academia"
                  data-testid="player-academy-input"
                />
              </div>
              <div>
                <Label className="text-gray-300">Treinador</Label>
                <Input
                  value={formData.coach}
                  onChange={(e) => setFormData({ ...formData, coach: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Nome do treinador"
                  data-testid="player-coach-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-300">Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Gênero</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600" data-testid="player-submit-button">
                {editingPlayer ? 'Atualizar' : 'Criar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Import Result */}
      {importResult && (
        <Card className="bg-blue-500/10 border-blue-500/50">
          <CardContent className="pt-6">
            <h3 className="text-white font-semibold mb-2">Resultado da Importação:</h3>
            <p className="text-green-400">✅ {importResult.players_created} jogadores criados</p>
            <p className="text-blue-400">🔄 {importResult.players_updated} jogadores atualizados</p>
            {importResult.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-red-400">❌ {importResult.errors.length} erros:</p>
                <ul className="text-xs text-gray-400 mt-1 max-h-32 overflow-y-auto">
                  {importResult.errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : (
        <div className="flex gap-4">

          {/* Painel lateral de filtros */}
          <div className={`transition-all duration-200 ${filterOpen ? 'w-64 min-w-[16rem]' : 'w-0 overflow-hidden'}`}>
            {filterOpen && (
              <Card className="bg-slate-800/50 border-blue-500/20 sticky top-4">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <Filter className="w-4 h-4" /> Filtros
                    </CardTitle>
                    <button onClick={() => setFilterOpen(false)} className="text-gray-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-300 text-xs mb-1 block">Nome</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 w-3 h-3 text-gray-400" />
                      <Input
                        placeholder="Buscar por nome..."
                        value={filters.name}
                        onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white text-sm pl-7"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-300 text-xs mb-1 block">Gênero</Label>
                    <div className="flex flex-col gap-1">
                      {['', 'Masculino', 'Feminino'].map(g => (
                        <button
                          key={g}
                          onClick={() => setFilters({ ...filters, gender: g })}
                          className={`text-left text-sm px-3 py-1.5 rounded transition-colors ${
                            filters.gender === g
                              ? 'bg-blue-500 text-white'
                              : 'text-gray-300 hover:bg-slate-700'
                          }`}
                        >
                          {g === '' ? 'Todos' : g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-300 text-xs mb-1 block">Cidade</Label>
                    <Input
                      placeholder="Filtrar por cidade..."
                      value={filters.city}
                      onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 text-xs mb-1 block">Academia</Label>
                    <Input
                      placeholder="Filtrar por academia..."
                      value={filters.academy}
                      onChange={(e) => setFilters({ ...filters, academy: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                  </div>
                  {(filters.name || filters.gender || filters.city || filters.academy) && (
                    <button
                      onClick={() => setFilters({ name: '', gender: '', city: '', academy: '' })}
                      className="w-full text-xs text-red-400 hover:text-red-300 flex items-center justify-center gap-1 pt-1"
                    >
                      <X className="w-3 h-3" /> Limpar filtros
                    </button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Conteúdo principal */}
          <div className="flex-1 min-w-0">
            {/* Barra de busca rápida + botão filtros */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar jogador..."
                  value={filters.name}
                  onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                  className="bg-slate-800/50 border-slate-600 text-white pl-9"
                />
              </div>
              <Button
                onClick={() => setFilterOpen(!filterOpen)}
                variant="outline"
                className={`border-slate-600 gap-2 ${filterOpen ? 'bg-blue-500 text-white border-blue-500' : 'text-gray-300 hover:bg-slate-700'}`}
              >
                <Filter className="w-4 h-4" />
                Filtros
                {(filters.gender || filters.city || filters.academy) && (
                  <span className="bg-blue-400 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {[filters.gender, filters.city, filters.academy].filter(Boolean).length}
                  </span>
                )}
              </Button>
            </div>

            {/* Grid de jogadores filtrado */}
            {(() => {
              const filtered = players.filter(p => {
                const nameOk = !filters.name || p.name.toLowerCase().includes(filters.name.toLowerCase());
                const genderOk = !filters.gender || p.gender === filters.gender;
                const cityOk = !filters.city || (p.city || '').toLowerCase().includes(filters.city.toLowerCase());
                const academyOk = !filters.academy || (p.academy || '').toLowerCase().includes(filters.academy.toLowerCase());
                return nameOk && genderOk && cityOk && academyOk;
              });

              if (filtered.length === 0) {
                return (
                  <Card className="bg-slate-800/50 border-blue-500/20">
                    <CardContent className="py-12">
                      <div className="text-center text-gray-400">
                        <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>{players.length === 0 ? 'Nenhum jogador cadastrado' : 'Nenhum jogador encontrado com esses filtros'}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <>
                  <p className="text-gray-400 text-sm mb-3">{filtered.length} jogador{filtered.length !== 1 ? 'es' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="players-admin-grid">
                    {filtered.map((player) => (
                      <Card key={player.id} className="bg-slate-800/50 border-blue-500/20" data-testid={`player-admin-card-${player.id}`}>
                        <CardContent className="pt-6">
                          <div className="flex items-center space-x-4 mb-4">
                            <Avatar className="w-16 h-16">
                              <AvatarImage src={player.photo_url} />
                              <AvatarFallback className="bg-green-500 text-white text-xl">
                                {player.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="text-white font-semibold text-lg">{player.name}</h3>
                              {player.birth_date && (
                                <p className="text-gray-400 text-xs mt-0.5">
                                  🎂 {new Date(player.birth_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                                  {' · '}
                                  {(() => { const t = new Date(); const b = new Date(player.birth_date + 'T00:00:00'); return t.getFullYear() - b.getFullYear() - (t < new Date(t.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0); })()} anos
                                </p>
                              )}
                              {player.gender && (
                                <p className="text-gray-400 text-xs">{player.gender}</p>
                              )}
                              {player.city && (
                                <p className="text-gray-400 text-xs">📍 {player.city}</p>
                              )}
                              {player.academy && (
                                <p className="text-gray-400 text-xs truncate">🏫 {player.academy}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleEdit(player)}
                              size="sm"
                              className="flex-1 bg-blue-500 hover:bg-blue-600"
                              data-testid={`edit-player-${player.id}`}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              onClick={() => handleDelete(player.id)}
                              size="sm"
                              className="flex-1 bg-red-500 hover:bg-red-600"
                              data-testid={`delete-player-${player.id}`}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Excel Format Guide */}
      <Card className="bg-slate-800/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white text-sm">📋 Formato do Excel para Importação de Jogadores</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-400 space-y-2">
          <p><strong className="text-white">Sheet "Players"</strong> com colunas:</p>
          <p className="font-mono bg-slate-900 p-2 rounded text-xs">
            Name | City | Academy | Coach | Class
          </p>
          <p>Exemplo:</p>
          <p className="font-mono bg-slate-900 p-2 rounded text-xs">
            João Silva | Curitiba, PR | Academia XYZ | Carlos Souza | 1a
          </p>
          <p className="text-xs text-yellow-400">
            ℹ️ Se o jogador já existir (mesmo nome), os dados serão atualizados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPlayers;
