import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
    const body = await req.text()
    const sig  = req.headers.get('stripe-signature')

    if (!sig) return new Response('Signature manquante', { status: 400 })

    let event: Stripe.Event
    try {
        event = await stripe.webhooks.constructEventAsync(
            body, sig, Deno.env.get('STRIPE_WEBHOOK_SECRET')!
        )
    } catch (err) {
        return new Response(`Webhook invalide: ${err.message}`, { status: 400 })
    }

    const customerId = (obj: any): string | null =>
        typeof obj?.customer === 'string' ? obj.customer : obj?.customer?.id ?? null

    const updateProfile = (custId: string, patch: object) =>
        supabase.from('profiles').update({ ...patch, updated_at: new Date().toISOString() })
            .eq('stripe_customer_id', custId)

    switch (event.type) {

        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session
            const cid = customerId(session)
            if (cid && session.subscription) {
                const sub = await stripe.subscriptions.retrieve(session.subscription as string)
                await updateProfile(cid, {
                    subscription_status:  'active',
                    subscription_end_at:  new Date(sub.current_period_end * 1000).toISOString(),
                })
            }
            break
        }

        case 'customer.subscription.updated': {
            const sub = event.data.object as Stripe.Subscription
            const cid = customerId(sub)
            if (cid) {
                await updateProfile(cid, {
                    subscription_status:  sub.status === 'active' ? 'active' : 'expired',
                    subscription_end_at:  new Date(sub.current_period_end * 1000).toISOString(),
                })
            }
            break
        }

        case 'customer.subscription.deleted': {
            const sub = event.data.object as Stripe.Subscription
            const cid = customerId(sub)
            if (cid) {
                await updateProfile(cid, { subscription_status: 'expired' })
            }
            break
        }
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
    })
})
