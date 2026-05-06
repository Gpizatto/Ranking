"""
Subscription routes for SquashRank Pro
Handles Stripe integration, payment webhooks, and subscription management
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone, timedelta
from typing import Dict
import os
import logging

# Importa de config.py — fonte única de verdade para preços
from config import SUBSCRIPTION_PLANS

# Logger
logger = logging.getLogger(__name__)


def create_subscription_router(db, get_current_user):
    """
    Create subscription router with database and auth dependency
    """
    router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

    @router.post("/create-checkout")
    async def create_checkout_session(
        plan_type: str,
        origin_url: str,
        current_user = Depends(get_current_user)
    ):
        """Create Stripe checkout session for subscription payment"""
        if plan_type not in SUBSCRIPTION_PLANS:
            raise HTTPException(status_code=400, detail="Invalid plan type")

        plan = SUBSCRIPTION_PLANS[plan_type]

        try:
            from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutSessionRequest

            stripe_api_key = os.getenv('STRIPE_API_KEY')
            webhook_url = f"{origin_url}/api/webhook/stripe"
            stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)

            success_url = f"{origin_url}/admin/dashboard?session_id={{CHECKOUT_SESSION_ID}}"
            cancel_url = f"{origin_url}/admin/dashboard"

            checkout_request = CheckoutSessionRequest(
                amount=plan['price'],
                currency=plan['currency'],
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    "user_id": current_user.id,
                    "plan_type": plan_type,
                    "federation_name": current_user.federation_name or ""
                }
            )

            session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)

            transaction_doc = {
                "user_id": current_user.id,
                "session_id": session.session_id,
                "amount": plan['price'],
                "currency": plan['currency'],
                "payment_status": "pending",
                "metadata": checkout_request.metadata,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }

            await db.payment_transactions.insert_one(transaction_doc)
            return {"url": session.url, "session_id": session.session_id}

        except ImportError:
            raise HTTPException(status_code=501, detail="Stripe não configurado neste ambiente")

    @router.get("/status/{session_id}")
    async def get_checkout_status(
        session_id: str,
        current_user = Depends(get_current_user)
    ):
        """Get checkout session status and update subscription if paid"""
        transaction = await db.payment_transactions.find_one(
            {"session_id": session_id, "user_id": current_user.id},
            {"_id": 0}
        )

        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")

        if transaction['payment_status'] == 'paid':
            return {"payment_status": "paid", "message": "Payment already processed"}

        try:
            from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutStatusResponse

            stripe_api_key = os.getenv('STRIPE_API_KEY')
            stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
            checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)

            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {
                    "payment_status": checkout_status.payment_status,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )

            if checkout_status.payment_status == 'paid' and transaction['payment_status'] != 'paid':
                metadata = checkout_status.metadata
                user_id = metadata.get('user_id')
                plan_type = metadata.get('plan_type')

                if user_id and plan_type and plan_type in SUBSCRIPTION_PLANS:
                    plan = SUBSCRIPTION_PLANS[plan_type]
                    await db.subscriptions.update_one(
                        {"user_id": user_id},
                        {"$set": {
                            "status": "active",
                            "is_trial": False,
                            "plan_type": plan_type,
                            "start_date": datetime.now(timezone.utc).isoformat(),
                            "end_date": (datetime.now(timezone.utc) + timedelta(days=plan['duration_days'])).isoformat(),
                            "next_billing_date": (datetime.now(timezone.utc) + timedelta(days=plan['duration_days'])).isoformat()
                        }}
                    )

            return {
                "payment_status": checkout_status.payment_status,
                "status": checkout_status.status,
                "amount_total": checkout_status.amount_total,
                "currency": checkout_status.currency
            }

        except ImportError:
            raise HTTPException(status_code=501, detail="Stripe não configurado neste ambiente")
        except Exception as e:
            logger.error(f"Error checking checkout status: {e}")
            raise HTTPException(status_code=500, detail="Erro ao verificar pagamento")

    @router.get("/my-subscription")
    async def get_my_subscription(current_user = Depends(get_current_user)):
        """Get current user's subscription status"""
        subscription = await db.subscriptions.find_one(
            {"user_id": current_user.id},
            {"_id": 0}
        )

        if not subscription:
            return {"has_subscription": False, "message": "No subscription found"}

        end_date = datetime.fromisoformat(subscription['end_date'].replace('Z', '+00:00'))
        is_expired = datetime.now(timezone.utc) >= end_date

        if is_expired and subscription['status'] == 'active':
            await db.subscriptions.update_one(
                {"user_id": current_user.id},
                {"$set": {"status": "expired"}}
            )
            subscription['status'] = 'expired'

        days_remaining = (end_date - datetime.now(timezone.utc)).days

        return {
            "has_subscription": True,
            "subscription": subscription,
            "days_remaining": max(0, days_remaining),
            "is_active": subscription['status'] == 'active' and not is_expired
        }

    @router.post("/cancel")
    async def cancel_subscription(current_user = Depends(get_current_user)):
        """Cancel subscription"""
        result = await db.subscriptions.update_one(
            {"user_id": current_user.id},
            {"$set": {"status": "canceled"}}
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Subscription not found")

        return {"message": "Subscription canceled successfully"}

    return router
