import React, { useState, useEffect } from 'react';
import axios from '../lib/api';
import { API } from '../lib/api';
import { CreditCard, Calendar, AlertTriangle, CheckCircle, Clock, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';

const SubscriptionCard = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await axios.get(`${API}/subscriptions/my-subscription`);
      setSubscription(response.data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (planType) => {
    setCheckoutLoading(true);
    try {
      const origin_url = window.location.origin;
      const response = await axios.post(`${API}/subscriptions/create-checkout`, null, {
        params: {
          plan_type: planType,
          origin_url: origin_url
        }
      });
      
      // Redirect to Stripe Checkout
      window.location.href = response.data.url;
      
    } catch (error) {
      toast.error('Erro ao iniciar checkout');
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-green-500/20">
        <CardContent className="py-8">
          <div className="text-center text-gray-400">Carregando assinatura...</div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription || !subscription.has_subscription) {
    return (
      <Card className="bg-slate-800/50 border-red-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
            Sem Assinatura Ativa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-red-500/10 border-red-500/20 mb-4">
            <AlertDescription className="text-red-400">
              Você precisa de uma assinatura ativa para usar o sistema.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Button
              onClick={() => handleCheckout('mensal')}
              disabled={checkoutLoading}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Assinar Plano Mensal - R$ 99,90/mês
            </Button>
            <Button
              onClick={() => handleCheckout('anual')}
              disabled={checkoutLoading}
              className="w-full bg-green-500 hover:bg-green-600"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Assinar Plano Anual - R$ 999,00/ano
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { subscription: sub, days_remaining, is_active } = subscription;
  const isExpired = sub.status === 'expired' || !is_active;
  const isTrial = sub.is_trial;
  const isLowDays = days_remaining <= 3 && days_remaining > 0;

  return (
    <Card className={`bg-slate-800/50 ${isExpired ? 'border-red-500/20' : isLowDays ? 'border-yellow-500/20' : 'border-green-500/20'}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span className="flex items-center">
            {isTrial ? <Gift className="w-5 h-5 mr-2 text-green-400" /> : <CreditCard className="w-5 h-5 mr-2 text-blue-400" />}
            Status da Assinatura
          </span>
          <Badge className={
            isExpired ? 'bg-red-500' : 
            isTrial ? 'bg-yellow-500' : 
            'bg-green-500'
          }>
            {isExpired ? 'Expirada' : isTrial ? 'Trial' : 'Ativa'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status atual */}
        <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Plano:</span>
            <span className="text-white font-semibold">
              {sub.plan_type === 'mensal' ? 'Mensal' : 'Anual'}
              {isTrial && ' (Trial)'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Dias restantes:
            </span>
            <span className={`font-bold text-lg ${
              isExpired ? 'text-red-400' : 
              isLowDays ? 'text-yellow-400' : 
              'text-green-400'
            }`}>
              {days_remaining} {days_remaining === 1 ? 'dia' : 'dias'}
            </span>
          </div>

          {!isExpired && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Válido até:</span>
              <span className="text-gray-300">
                {new Date(sub.end_date).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}
        </div>

        {/* Alertas */}
        {isExpired && (
          <Alert className="bg-red-500/10 border-red-500/20">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <AlertDescription className="text-red-400">
              Sua assinatura expirou. Renove para continuar usando o sistema.
            </AlertDescription>
          </Alert>
        )}

        {isLowDays && !isExpired && (
          <Alert className="bg-yellow-500/10 border-yellow-500/20">
            <Clock className="w-4 h-4 text-yellow-400" />
            <AlertDescription className="text-yellow-400">
              Sua assinatura está prestes a expirar! Renove agora.
            </AlertDescription>
          </Alert>
        )}

        {isTrial && !isExpired && (
          <Alert className="bg-green-500/10 border-green-500/20">
            <Gift className="w-4 h-4 text-green-400" />
            <AlertDescription className="text-green-400">
              Você está no período de trial. Assine para continuar após o trial.
            </AlertDescription>
          </Alert>
        )}

        {/* Botões de ação */}
        {(isExpired || isLowDays || isTrial) && (
          <div className="space-y-2 pt-2">
            <Button
              onClick={() => handleCheckout('mensal')}
              disabled={checkoutLoading}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {isExpired || isTrial ? 'Assinar' : 'Renovar'} Plano Mensal - R$ 99,90/mês
            </Button>
            <Button
              onClick={() => handleCheckout('anual')}
              disabled={checkoutLoading}
              className="w-full bg-green-500 hover:bg-green-600"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {isExpired || isTrial ? 'Assinar' : 'Renovar'} Plano Anual - R$ 999,00/ano
            </Button>
          </div>
        )}

        {!isExpired && !isLowDays && !isTrial && (
          <div className="flex items-center justify-center text-green-400 text-sm">
            <CheckCircle className="w-4 h-4 mr-2" />
            Sua assinatura está ativa e em dia!
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard;
