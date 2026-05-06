# config.py
# Fonte única de verdade para configurações compartilhadas entre server.py e subscription_routes.py
# Para alterar preços, edite APENAS este arquivo.

SUBSCRIPTION_PLANS = {
    "mensal": {
        "name": "Plano Mensal",
        "price": 99.90,       # R$ 99,90/mês
        "currency": "brl",
        "duration_days": 30
    },
    "anual": {
        "name": "Plano Anual",
        "price": 600.00,      # R$ 600,00/ano (~R$ 50/mês)
        "currency": "brl",
        "duration_days": 365
    }
}
