import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

console.log("Funzione caricata!");

const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_TOKEN')
const PHONE_NUMBER_ID = Deno.env.get('PHONE_NUMBER_ID')

// SPIA 1: Controlliamo se le credenziali sono state caricate
console.log({
  token_caricato: !!WHATSAPP_TOKEN,
  phone_id_caricato: !!PHONE_NUMBER_ID
});

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

    // SPIA 2: Vediamo che dati riceviamo dal sito
    console.log("Dati della prenotazione ricevuti:", booking);

    if (!booking || !booking.telefono_cliente) {
      throw new Error('Dati della prenotazione o numero di telefono mancanti.');
    }

    // Pulizia e formattazione del numero di telefono
    let phoneNumber = String(booking.telefono_cliente).replace(/\D/g, ''); // Rimuove tutto tranne i numeri
    if (!phoneNumber.startsWith('39')) {
        phoneNumber = '39' + phoneNumber;
    }

    // SPIA 3: Vediamo il numero di telefono finale che proviamo a usare
    console.log(`Tentativo di invio a: ${phoneNumber}`);

    const response = await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
          name: 'hello_world',
          language: { code: 'en_US' },
        },
      }),
    })

    const data = await response.json()

    // SPIA 4: Vediamo la risposta da Meta/WhatsApp
    console.log("Risposta da Meta:", data);

    if (!response.ok) throw new Error(JSON.stringify(data))

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    // SPIA 5: Se qualcosa va storto, lo scriviamo qui
    console.error("ERRORE NEL BLOCCO CATCH:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
