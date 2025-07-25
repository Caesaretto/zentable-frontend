import { error } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient'; // Usiamo il nostro client unificato

export async function load({ params }) {
  // Trasforma lo "slug" dell'URL in un nome di ricerca flessibile
  // es. "la-vittoria" diventa "la vittoria"
  const nomeRicerca = params.slug.replace(/-/g, ' ');

console.log(`Sto cercando il ristorante con nome: "${nomeRicerca}"`);

  const { data: ristorante } = await supabase
    .from('ristoranti')
    .select(`
      id,
      nome,
      indirizzo,
      telefono,
      orari (giorno_settimana, pranzo_apertura, pranzo_chiusura, cena_apertura, cena_chiusura)
    `)
    // Usiamo 'ilike' che è case-insensitive (ignora maiuscole/minuscole)
    .ilike('nome', nomeRicerca)
    .single();

  if (!ristorante) {
    throw error(404, 'Ristorante non trovato');
  }

  return { ristorante };
}
