import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

    try {
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
        const priceId   = Deno.env.get('STRIPE_PRICE_ID')
        if (!stripeKey) throw new Error('Secret STRIPE_SECRET_KEY manquant dans Supabase.')
        if (!priceId)   throw new Error('Secret STRIPE_PRICE_ID manquant dans Supabase.')

        const stripe = new Stripe(stripeKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Non autorisé')

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await supabase.auth.getUser(token)
        if (userError || !user) throw new Error('Session invalide')

        // Récupérer ou créer le client Stripe
        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single()

        let customerId = profile?.stripe_customer_id

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { supabase_user_id: user.id },
            })
            customerId = customer.id
            await supabase
                .from('profiles')
                .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
                .eq('id', user.id)
        }

        // Créer la session Checkout
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: 'https://depensa.ca/app?subscribed=true',
            cancel_url:  'https://depensa.ca/app',
            locale: 'fr',
            subscription_data: {
                metadata: { supabase_user_id: user.id },
            },
        })

        return new Response(JSON.stringify({ url: session.url }), {
            headers: { ...CORS, 'Content-Type': 'application/json' },
        })
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...CORS, 'Content-Type': 'application/json' },
        })
    }
})
