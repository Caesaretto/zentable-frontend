import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_TOKEN')
const PHONE_NUMBER_ID = Deno.env.get('PHONE_NUMBER_ID')

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

    const bookingTime = new Date(booking.data_ora).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

    const response = await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: booking.telefono_cliente,
        type: 'template',
        template: {
          name: 'conferma_prenotazione_zentable',
          language: { code: 'it' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: booking.nome_cliente },
                { type: 'text', text: String(booking.numero_coperti) },
                { type: 'text', text: bookingTime }
              ]
            }
          ]
        },
      }),
    })

    const data = await response.json()
    if (!response.ok) throw new Error(JSON.stringify(data))

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
