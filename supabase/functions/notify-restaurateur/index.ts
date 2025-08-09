import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { booking } = await req.json()

    // Per poter leggere i dati degli utenti, dobbiamo usare la chiave di servizio
    // che è sicura qui dentro perché siamo sul server
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Troviamo a quale ristorante appartiene la prenotazione
    const { data: restaurant, error: restError } = await supabaseAdmin
      .from('ristoranti')
      .select('user_id, nome')
      .eq('id', booking.ristorante_id)
      .single()

    if (restError) throw restError

    // 2. Troviamo l'email del proprietario di quel ristorante
    const { data: owner, error: ownerError } = await supabaseAdmin.auth.admin.getUserById(restaurant.user_id)
    if (ownerError) throw ownerError
    const ownerEmail = owner.user.email

    // 3. Spediamo l'email di notifica al proprietario usando Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Zentable <onboarding@resend.dev>', // Per il piano gratuito di Resend, il mittente deve essere questo
        to: ownerEmail,
        subject: `Nuova Prenotazione da ${booking.nome_cliente} per ${restaurant.nome}!`,
        html: `
          <h1>Nuova Prenotazione Ricevuta!</h1>
          <p><strong>Cliente:</strong> ${booking.nome_cliente}</p>
          <p><strong>Coperti:</strong> ${booking.numero_coperti}</p>
          <p><strong>Data e Ora:</strong> ${new Date(booking.data_ora).toLocaleString('it-IT', { dateStyle: 'full', timeStyle: 'short' })}</p>
          <p><strong>Telefono:</strong> ${booking.telefono_cliente || 'Non specificato'}</p>
          <p><strong>Note:</strong> ${booking.note || 'Nessuna'}</p>
        `,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(JSON.stringify(errorData))
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
