import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe?target=deno&no-check'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text()

  let receivedEvent;
  try {
    receivedEvent = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      webhookSecret!
    )
  } catch (err) {
    return new Response(err.message, { status: 400 })
  }

  console.log(`Evento ricevuto: ${receivedEvent.type}`)

  const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    switch (receivedEvent.type) {
      case 'checkout.session.completed': {
        const session = receivedEvent.data.object;
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

        await supabaseAdmin
          .from('ristoranti')
          .update({
            subscription_status: 'active',
            subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_customer_id', session.customer);
        break;
      }
      case 'customer.subscription.updated': {
         const subscription = receivedEvent.data.object;
         await supabaseAdmin
            .from('ristoranti')
            .update({
                subscription_status: subscription.status,
                subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('stripe_customer_id', subscription.customer);
         break;
      }
       case 'customer.subscription.deleted': {
         const subscription = receivedEvent.data.object;
         await supabaseAdmin
            .from('ristoranti')
            .update({
                subscription_status: 'canceled',
            })
            .eq('stripe_customer_id', subscription.customer);
         break;
      }
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (error) {
    console.error('Errore durante la gestione del webhook:', error.message)
    return new Response('Webhook Error', { status: 400 })
  }
})
