import React, { useState, useEffect } from 'react';
import axios, { API } from '../../lib/api';
import { Palette, Check } from 'lucide-react';
import { toast } from 'sonner';

const THEMES = [
  {
    id: 'blue',  // Backend espera 'blue'
    name: 'Storm',
    description: 'Azul FSP evoluído (padrão)',
    accent: '#4aa3ff',
    accent2: '#22e1ff',
    bg: 'linear-gradient(135deg, #070d1a 0%, #0d2347 55%, #070d1a 100%)',
    preview: ['#070d1a', '#4aa3ff', '#22e1ff'],
    fspTheme: 'storm',  // Tema FSP real
  },
  {
    id: 'red',  // Backend espera 'red'
    name: 'Inferno',
    description: 'Preto + magenta + lime',
    accent: '#ff2d6f',
    accent2: '#c6f432',
    bg: 'linear-gradient(135deg, #0a0a0c 0%, #1a0a14 55%, #0a0a0c 100%)',
    preview: ['#0a0a0c', '#ff2d6f', '#c6f432'],
    fspTheme: 'inferno',
  },
  {
    id: 'orange',  // Backend espera 'orange'
    name: 'Champion',
    description: 'Dourado premium',
    accent: '#d4a017',
    accent2: '#f5d36b',
    bg: 'linear-gradient(135deg, #0e0c08 0%, #231708 55%, #0e0c08 100%)',
    preview: ['#0e0c08', '#d4a017', '#f5d36b'],
    fspTheme: 'champion',
  },
  {
    id: 'silver',  // Backend espera 'silver'
    name: 'Glacier',
    description: 'Claro / minimal',
    accent: '#2d8a3e',
    accent2: '#0d6e7b',
    bg: 'linear-gradient(135deg, #f4f1ea 0%, #eae6dc 55%, #f4f1ea 100%)',
    preview: ['#f4f1ea', '#2d8a3e', '#0d6e7b'],
    fspTheme: 'glacier',
  },
];

const AdminLayout = () => {
  const [currentTheme, setCurrentTheme] = useState('storm');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get(`${API}/theme`).then(res => {
      const backendTheme = res.data.theme || 'blue';
      setCurrentTheme(backendTheme);
      
      // Mapeia o tema do backend para o fspTheme
      const theme = THEMES.find(t => t.id === backendTheme);
      const fspTheme = theme?.fspTheme || 'storm';
      document.documentElement.setAttribute('data-theme', fspTheme);
    }).catch(() => {
      // Se falhar, usa storm como padrão
      document.documentElement.setAttribute('data-theme', 'storm');
    });
  }, []);

  const handleSelectTheme = async (themeId) => {
    setSaving(true);
    try {
      const response = await axios.put(`${API}/theme?theme=${themeId}`);
      setCurrentTheme(themeId);
      
      // Encontra o tema e aplica o fspTheme correto
      const theme = THEMES.find(t => t.id === themeId);
      const fspTheme = theme?.fspTheme || themeId;
      document.documentElement.setAttribute('data-theme', fspTheme);
      
      toast.success('Tema aplicado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
      console.error('Response:', error.response?.data);
      toast.error(error.response?.data?.detail || error.response?.data?.message || 'Erro ao salvar tema');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--t-ink)' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontFamily: 'Anton, sans-serif',
          fontSize: 'clamp(32px, 6vw, 48px)',
          letterSpacing: '0.04em',
          margin: '0 0 12px 0',
        }}>
          <Palette size={36} style={{ color: 'var(--t-accent)' }} />
          LAYOUT & PALETAS
        </h1>
        <p style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 15,
          color: 'var(--t-sub)',
          margin: 0,
        }}>
          Escolha a paleta de cores do sistema. A mudança é aplicada para todos os visitantes.
        </p>
      </div>

      {/* Grid de temas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 18,
        marginBottom: 32,
      }}>
        {THEMES.map((theme) => {
          const isActive = currentTheme === theme.id;
          return (
            <div
              key={theme.id}
              onClick={() => !saving && handleSelectTheme(theme.id)}
              style={{
                background: theme.bg,
                border: `2px solid ${isActive ? 'var(--t-accent)' : 'var(--t-line)'}`,
                borderRadius: 12,
                overflow: 'hidden',
                cursor: saving ? 'wait' : 'pointer',
                transition: 'all 0.2s',
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.borderColor = 'var(--t-sub)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.borderColor = 'var(--t-line)';
              }}
            >
              {/* Color strip */}
              <div style={{ display: 'flex', height: 12 }}>
                {theme.preview.map((color, i) => (
                  <div key={i} style={{ flex: 1, background: color }} />
                ))}
              </div>

              <div style={{ padding: 20 }}>
                {/* Check badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: theme.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {isActive && <Check size={20} style={{ color: '#fff', strokeWidth: 3 }} />}
                  </div>
                  {isActive && (
                    <span style={{
                      fontFamily: 'Anton, sans-serif',
                      fontSize: 11,
                      letterSpacing: '0.14em',
                      padding: '4px 10px',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                    }}>
                      ATIVO
                    </span>
                  )}
                </div>

                {/* Nome */}
                <h3 style={{
                  fontFamily: 'Anton, sans-serif',
                  fontSize: 22,
                  letterSpacing: '0.08em',
                  color: '#fff',
                  margin: '0 0 4px 0',
                }}>
                  {theme.name.toUpperCase()}
                </h3>
                <p style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.6)',
                  margin: '0 0 16px 0',
                }}>
                  {theme.description}
                </p>

                {/* Mini preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ height: 8, borderRadius: 4, width: '75%', background: theme.accent, opacity: 0.4 }} />
                  <div style={{ height: 8, borderRadius: 4, width: '50%', background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <div style={{
                      height: 24,
                      padding: '0 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 4,
                      background: theme.accent,
                      fontFamily: 'Anton, sans-serif',
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      color: '#fff',
                    }}>
                      BOTÃO
                    </div>
                    <div style={{
                      height: 24,
                      padding: '0 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.1)',
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.5)',
                    }}>
                      Cancelar
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info card */}
      <div style={{
        background: 'color-mix(in srgb, var(--t-surface) 85%, transparent)',
        border: '1px solid var(--t-line)',
        borderRadius: 12,
        padding: 24,
      }}>
        <h3 style={{
          fontFamily: 'Anton, sans-serif',
          fontSize: 16,
          letterSpacing: '0.08em',
          color: 'var(--t-ink)',
          margin: '0 0 16px 0',
        }}>
          ℹ️ COMO FUNCIONA
        </h3>
        <div style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 14,
          lineHeight: 1.6,
          color: 'var(--t-sub)',
        }}>
          <p style={{ margin: '0 0 8px 0' }}>• O tema é salvo no banco de dados e aplicado para todos os visitantes do site.</p>
          <p style={{ margin: '0 0 8px 0' }}>• As cores de destaque afetam botões, bordas, links ativos e elementos de navegação.</p>
          <p style={{ margin: '0 0 8px 0' }}>• O fundo escuro muda de tom junto com a paleta escolhida.</p>
          <p style={{ margin: 0 }}>• A mudança é aplicada imediatamente, sem precisar recarregar a página.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
