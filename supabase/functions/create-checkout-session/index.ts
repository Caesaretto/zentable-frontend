import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
const PRICE_ID = Deno.env.get('STRIPE_PRICE_ID')
// --- CORREZIONE: Leggiamo il nostro secret invece di quello automatico ---
const SITE_URL = Deno.env.get('SITE_URL')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('User not found.')

    const { data: restaurant } = await supabaseClient
        .from('ristoranti')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .single()

    if (!restaurant) throw new Error('Restaurant profile not found.')

    let customerId = restaurant.stripe_customer_id

    if (!customerId) {
      const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
              'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({ email: user.email }).toString()
      });
      const customer = await customerResponse.json();
      if (customer.error) throw new Error(customer.error.message);

      customerId = customer.id;
      await supabaseClient.from('ristoranti').update({ stripe_customer_id: customerId }).eq('user_id', user.id);
    }

    const sessionResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            'customer': customerId,
            'mode': 'subscription',
            'line_items[0][price]': PRICE_ID!,
            'line_items[0][quantity]': '1',
            'success_url': `${SITE_URL}/dashboard?payment=success`,
            'cancel_url': `${SITE_URL}/dashboard/abbonamento`,
        }).toString()
    });

    const session = await sessionResponse.json();
    if (session.error) throw new Error(session.error.message);

    return new Response(JSON.stringify({ sessionId: session.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('ERRORE DETTAGLIATO CATTURATO:', error);
    return new Response(JSON.stringify({ error: error.message || 'Errore sconosciuto nella funzione' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
