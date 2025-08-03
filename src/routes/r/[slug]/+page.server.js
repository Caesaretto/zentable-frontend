import { error } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export async function load({ params }) {
  const nomeRicerca = params.slug.replace(/-/g, ' ');

  const { data: ristorante } = await supabase
    .from('ristoranti')
    .select(`
      id,
      nome,
      indirizzo,
      telefono,
      orari (*),
      tavoli (*)
    `)
    .ilike('nome', nomeRicerca)
    .single();

  if (!ristorante) {
    throw error(404, 'Ristorante non trovato');
  }

  return { ristorante };
}
