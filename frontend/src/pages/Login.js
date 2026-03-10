import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../lib/api';
import { API, setAuthToken } from '../lib/api';
import { Shield, LogIn } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const Login = () => {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, loginData);
      setAuthToken(response.data.access_token);
      toast.success('Login realizado com sucesso!');
      navigate('/admin');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao fazer login');
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

    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/register`, {
        username: registerData.username,
        password: registerData.password
      });
      setAuthToken(response.data.access_token);
      toast.success('Conta criada com sucesso!');
      navigate('/admin');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Card className="w-full max-w-md bg-slate-800/50 border-green-500/20">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-white" data-testid="login-title">Área Administrativa</CardTitle>
          <CardDescription className="text-gray-400">Acesso exclusivo para administradores</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-700">
              <TabsTrigger value="login" data-testid="login-tab">Login</TabsTrigger>
              <TabsTrigger value="register" data-testid="register-tab">Registrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label className="text-gray-300">Usuário</Label>
                  <Input
                    type="text"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                    data-testid="login-username-input"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Senha</Label>
                  <Input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                    data-testid="login-password-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600"
                  disabled={loading}
                  data-testid="login-submit-button"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label className="text-gray-300">Usuário</Label>
                  <Input
                    type="text"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                    data-testid="register-username-input"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Senha</Label>
                  <Input
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                    data-testid="register-password-input"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Confirmar Senha</Label>
                  <Input
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                    data-testid="register-confirm-password-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-600"
                  disabled={loading}
                  data-testid="register-submit-button"
                >
                  {loading ? 'Criando conta...' : 'Criar Conta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
