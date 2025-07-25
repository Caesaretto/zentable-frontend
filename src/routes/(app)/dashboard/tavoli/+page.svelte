<script>
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';

  let tables = [];
  let restaurantId;
  let newTableName = '';
  let newTableSeats = 2;
  let loading = true;
  let message = '';

  // Funzione per caricare i tavoli esistenti
  async function loadTables() {
    loading = true;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Prima troviamo l'ID del ristorante dell'utente
    const { data: restaurantData } = await supabase
      .from('ristoranti')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (restaurantData) {
      restaurantId = restaurantData.id;
      
      // Poi carichiamo i tavoli di quel ristorante
      const { data: tablesData, error } = await supabase
        .from('tavoli')
        .select('id, nome, posti')
        .eq('ristorante_id', restaurantId)
        .order('nome');
      
      if (error) {
        message = 'Errore nel caricamento tavoli: ' + error.message;
      } else {
        tables = tablesData;
      }
    }
    loading = false;
  }

  // Al caricamento della pagina, eseguiamo la funzione
  onMount(loadTables);

  // Funzione per aggiungere un nuovo tavolo
  async function handleAddTable() {
    if (!newTableName || !restaurantId) return;
    
    const { data, error } = await supabase.from('tavoli').insert({
      nome: newTableName,
      posti: newTableSeats,
      ristorante_id: restaurantId
    });

    if (error) {
      message = 'Errore: ' + error.message;
    } else {
      newTableName = '';
      newTableSeats = 2;
      message = 'Tavolo aggiunto!';
      await loadTables(); // Ricarica la lista dei tavoli
    }
  }
</script>

<div class="tables-container">
  <h1>Gestione Tavoli</h1>
  <p>Aggiungi e visualizza i tavoli del tuo ristorante.</p>

  <form on:submit|preventDefault={handleAddTable} class="add-form">
    <h3>Aggiungi un nuovo tavolo</h3>
    <input type="text" bind:value={newTableName} placeholder="Nome tavolo (es. T1, Veranda)" required />
    <input type="number" bind:value={newTableSeats} min="1" required />
    <button type of="submit">Aggiungi Tavolo</button>
  </form>

  {#if message}
    <p class="message">{message}</p>
  {/if}

  <hr />

  <h2>Tavoli Esistenti</h2>
  {#if loading}
    <p>Caricamento...</p>
  {:else if tables.length === 0}
    <p>Nessun tavolo ancora creato.</p>
  {:else}
    <ul>
      {#each tables as table (table.id)}
        <li>{table.nome} - {table.posti} posti</li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .tables-container { max-width: 600px; margin: 40px auto; font-family: sans-serif; }
  .add-form { display: flex; gap: 10px; align-items: center; margin-bottom: 20px; }
  input { padding: 8px; }
  button { padding: 8px 12px; background-color: #007bff; color: white; border: none; cursor: pointer; }
  hr { margin: 20px 0; }
  ul { list-style-type: none; padding: 0; }
  li { background-color: #f7f7f7; padding: 10px; margin-bottom: 5px; border-radius: 4px; }
  .message { margin: 10px 0; }
</style>
