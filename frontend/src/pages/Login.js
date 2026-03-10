import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../lib/api';
import { API, setAuthToken } from '../lib/api';
import { Shield, LogIn, Key, Mail, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';

const Login = () => {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', password: '', confirmPassword: '' });
  const [approvalData, setApprovalData] = useState({ username: '', code: '' });
  const [loading, setLoading] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(1); // 1: request, 2: approval code

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

  const handleRequestRegistration = async (e) => {
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
      const response = await axios.post(`${API}/auth/request-registration`, {
        username: registerData.username,
        password: registerData.password
      });
      
      setApprovalData({ username: registerData.username, code: '' });
      setRegistrationStep(2);
      toast.success('Solicitação enviada! Aguarde o código de aprovação no email do administrador.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao solicitar registro');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/complete-registration`, {
        username: approvalData.username,
        approval_code: approvalData.code
      });
      
      setAuthToken(response.data.access_token);
      toast.success('Registro concluído com sucesso!');
      navigate('/admin');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Código inválido ou expirado');
    } finally {
      setLoading(false);
    }
  };

  const resetRegistration = () => {
    setRegistrationStep(1);
    setRegisterData({ username: '', password: '', confirmPassword: '' });
    setApprovalData({ username: '', code: '' });
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
              <TabsTrigger value="register" data-testid="register-tab" onClick={resetRegistration}>Registrar</TabsTrigger>
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
              {registrationStep === 1 ? (
                <form onSubmit={handleRequestRegistration} className="space-y-4">
                  <Alert className="bg-blue-500/10 border-blue-500/50">
                    <Mail className="w-4 h-4" />
                    <AlertDescription className="text-gray-300">
                      Após enviar, o administrador receberá um email com código de aprovação que você deve inserir na próxima etapa.
                    </AlertDescription>
                  </Alert>
                  
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
                      minLength={6}
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
                    <Mail className="w-4 h-4 mr-2" />
                    {loading ? 'Enviando...' : 'Solicitar Registro'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleCompleteRegistration} className="space-y-4">
                  <Alert className="bg-green-500/10 border-green-500/50">
                    <CheckCircle className="w-4 h-4" />
                    <AlertDescription className="text-gray-300">
                      Um email foi enviado para <strong>gustavopizatto@hotmail.com</strong> com o código de aprovação de 6 caracteres.
                    </AlertDescription>
                  </Alert>
                  
                  <div>
                    <Label className="text-gray-300">Usuário</Label>
                    <Input
                      type="text"
                      value={approvalData.username}
                      className="bg-slate-700 border-slate-600 text-white"
                      disabled
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Código de Aprovação</Label>
                    <Input
                      type="text"
                      value={approvalData.code}
                      onChange={(e) => setApprovalData({ ...approvalData, code: e.target.value.toUpperCase() })}
                      className="bg-slate-700 border-slate-600 text-white text-center text-2xl tracking-widest font-bold"
                      placeholder="ABC123"
                      maxLength={6}
                      required
                      data-testid="approval-code-input"
                    />
                    <p className="text-xs text-gray-400 mt-1">Digite o código de 6 caracteres recebido no email</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={resetRegistration}
                      className="flex-1 bg-gray-600 hover:bg-gray-700"
                    >
                      Voltar
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-green-500 hover:bg-green-600"
                      disabled={loading || approvalData.code.length !== 6}
                      data-testid="complete-registration-button"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      {loading ? 'Verificando...' : 'Concluir Registro'}
                    </Button>
                  </div>
                  <p className="text-xs text-center text-gray-400">
                    O código expira em 24 horas
                  </p>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
