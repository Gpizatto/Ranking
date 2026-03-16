import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../lib/api';
import { setAuthToken } from '../lib/api';
import { useFederation } from '../context/FederationContext';
import { Shield, LogIn, Building2, CreditCard, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';

const Login = () => {
  const navigate = useNavigate();
  const { API, slug } = useFederation();
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({
    federation_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    plan_type: 'mensal',
    start_trial: true
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
  username: loginData.username,
  password: loginData.password
});
setAuthToken(response.data.access_token, slug);
toast.success('Login realizado com sucesso!');
navigate(`/${slug}/admin`);
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

    if (registerData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API}/register-federation`, {
        federation_name: registerData.federation_name,
        email: registerData.email,
        password: registerData.password,
        plan_type: registerData.plan_type,
        start_trial: registerData.start_trial
      });

      if (registerData.start_trial) {
        toast.success('Trial de 1 dia ativado! Faça login para começar.');
      } else {
        toast.success('Cadastro realizado! Faça login e prossiga para o pagamento.');
      }

      // Auto login após registro
      const loginResponse = await axios.post(`${API}/token`,
        new URLSearchParams({
          username: registerData.email,
          password: registerData.password
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      setAuthToken(loginResponse.data.access_token);
      navigate('/admin/dashboard');

    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao registrar');
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
          <CardTitle className="text-2xl text-white">SquashRank Pro</CardTitle>
          <CardDescription className="text-gray-400">Sistema de gerenciamento de rankings</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-700">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Registrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label className="text-gray-300">Email</Label>
                  <Input
                    type="text"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
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
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600"
                  disabled={loading}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label className="text-gray-300">Nome da Federação</Label>
                  <Input
                    type="text"
                    value={registerData.federation_name}
                    onChange={(e) => setRegisterData({ ...registerData, federation_name: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Ex: Federação de Squash do Paraná"
                    required
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Email</Label>
                  <Input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="seu@email.com"
                    required
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
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Plano</Label>
                  <Select
                    value={registerData.plan_type}
                    onValueChange={(value) => setRegisterData({ ...registerData, plan_type: value })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">
                        Mensal - R$ 69,90/mês
                      </SelectItem>
                      <SelectItem value="anual">
                        Anual - R$ 600,00/ano (economize 17%)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 bg-green-500/10 p-3 rounded border border-green-500/20">
                  <Checkbox
                    id="trial"
                    checked={registerData.start_trial}
                    onCheckedChange={(checked) =>
                      setRegisterData({ ...registerData, start_trial: checked === true })
                    }
                    className="border-green-500"
                  />
                  <label
                    htmlFor="trial"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-green-400 cursor-pointer flex items-center"
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Iniciar trial grátis de 1 dia
                  </label>
                </div>

                {!registerData.start_trial && (
                  <Alert className="bg-blue-500/10 border-blue-500/20">
                    <AlertDescription className="text-blue-400 text-sm">
                      Após o cadastro, você será redirecionado para o pagamento.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-600"
                  disabled={loading}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  {loading ? 'Registrando...' : registerData.start_trial ? 'Iniciar Trial Grátis' : 'Registrar e Pagar'}
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
