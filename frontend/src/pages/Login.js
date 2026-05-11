import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../lib/api';
import { setAuthToken, API } from '../lib/api';

import { Shield, LogIn, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('login');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  // 🔥 FUNÇÃO PARA PEGAR TOKEN DE QUALQUER FORMATO
  const extractToken = (data) => {
    return data?.access_token || data?.token || data?.accessToken;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        username: loginData.email,
        password: loginData.password
      });

      const token = extractToken(response.data);

      if (!token) {
        throw new Error("Token não retornado pela API");
      }

      setAuthToken(token);
      toast.success('Login realizado com sucesso!');
      navigate('/admin');
      
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.detail || error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (registerData.password !== registerData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (registerData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API}/auth/register`, {
        username: registerData.email,
        password: registerData.password
      });

      // 🔥 login automático
      const loginResponse = await axios.post(`${API}/auth/login`, {
        username: registerData.email,
        password: registerData.password
      });

      const token = extractToken(loginResponse.data);

      if (!token) {
        throw new Error("Token não retornado após registro");
      }

      setAuthToken(token);
      toast.success("Conta criada e logada com sucesso!");

    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.detail || error.message || 'Erro ao registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Space Grotesk, sans-serif',
    }}>
      <style>{`
        .login-input { width: 100%; padding: 12px 14px; background: var(--t-bg); border: 1px solid var(--t-line); border-radius: 8px; font-family: 'Space Grotesk', sans-serif; font-size: 15px; color: var(--t-ink); outline: none; transition: border-color 0.15s; }
        .login-input:focus { border-color: var(--t-accent); }
        .login-input::placeholder { color: var(--t-sub); opacity: 0.6; }
        .login-btn { width: 100%; padding: 14px; background: var(--t-accent); border: none; border-radius: 8px; font-family: 'Anton', sans-serif; font-size: 15px; letter-spacing: 0.12em; color: var(--t-bg); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.15s; }
        .login-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .login-tab { flex: 1; padding: 10px; background: transparent; border: none; border-bottom: 2px solid transparent; font-family: 'Anton', sans-serif; font-size: 14px; letter-spacing: 0.12em; color: var(--t-sub); cursor: pointer; transition: all 0.15s; }
        .login-tab.active { color: var(--t-ink); border-bottom-color: var(--t-accent); }
        .login-tab:hover { color: var(--t-ink); }
      `}</style>

      <div style={{
        width: '100%',
        maxWidth: 440,
        background: 'color-mix(in srgb, var(--t-surface) 85%, transparent)',
        border: '1px solid var(--t-line)',
        borderRadius: 14,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '32px 32px 24px', textAlign: 'center' }}>
          <div style={{
            width: 64,
            height: 64,
            background: 'var(--t-accent)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Shield size={32} style={{ color: 'var(--t-bg)' }} />
          </div>
          <h1 style={{
            fontFamily: 'Anton, sans-serif',
            fontSize: 28,
            letterSpacing: '0.08em',
            color: 'var(--t-ink)',
            margin: '0 0 8px 0',
          }}>
            SQUASHRANK PRO
          </h1>
          <p style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            letterSpacing: '0.16em',
            color: 'var(--t-sub)',
            margin: 0,
          }}>
            SISTEMA DE GERENCIAMENTO DE RANKINGS
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--t-line)' }}>
          <button
            className={`login-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            LOGIN
          </button>
          <button
            className={`login-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            REGISTRAR
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 32 }}>
          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{
                  display: 'block',
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 14,
                  color: 'var(--t-ink)',
                  marginBottom: 8,
                }}>
                  Email
                </label>
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="login-input"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 14,
                  color: 'var(--t-ink)',
                  marginBottom: 8,
                }}>
                  Senha
                </label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="login-input"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                <LogIn size={18} />
                {loading ? 'ENTRANDO...' : 'ENTRAR'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Alerta */}
              <div style={{
                display: 'flex',
                gap: 10,
                padding: '12px 14px',
                background: 'color-mix(in srgb, var(--t-gold) 15%, transparent)',
                border: '1px solid var(--t-gold)',
                borderRadius: 8,
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
                <p style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: 'var(--t-ink)',
                  margin: 0,
                }}>
                  <strong>Atenção:</strong> a área administrativa é exclusiva para uso da Federação. Outros cadastros não serão aprovados.
                </p>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 14,
                  color: 'var(--t-ink)',
                  marginBottom: 8,
                }}>
                  Email
                </label>
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className="login-input"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 14,
                  color: 'var(--t-ink)',
                  marginBottom: 8,
                }}>
                  Senha
                </label>
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  className="login-input"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 14,
                  color: 'var(--t-ink)',
                  marginBottom: 8,
                }}>
                  Confirmar Senha
                </label>
                <input
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  className="login-input"
                  placeholder="Digite a senha novamente"
                  required
                />
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                <Building2 size={18} />
                {loading ? 'REGISTRANDO...' : 'REGISTRAR'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
