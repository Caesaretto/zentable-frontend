<script>
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';
  import { ArrowLeft } from 'lucide-svelte';

  let clients = [];
  let loading = true;
  let error = null;

  onMount(async () => {
    // CORREZIONE: Chiamiamo la nostra nuova funzione "concierge" (RPC)
    const { data, error: fetchError } = await supabase
      .rpc('get_miei_clienti');

    if (fetchError) {
      error = fetchError.message;
    } else {
      // Ordiniamo i risultati qui, nel frontend
      clients = data.sort((a, b) => new Date(b.ultima_prenotazione) - new Date(a.ultima_prenotazione));
    }
    loading = false;
  });
</script>

<main class="container">
  <article>
    <a href="/dashboard" class="back-link" aria-label="Torna alla dashboard">
      <ArrowLeft size={24}/>
    </a>
    <img src="/logo.png" alt="Logo Zentable" class="logo">

    <hgroup>
      <h1>Storico Clienti</h1>
      <h2>La lista di tutti i clienti che hanno prenotato.</h2>
    </hgroup>

    {#if loading}
      <p aria-busy="true">Caricamento clienti...</p>
    {:else if error}
      <p>Errore: {error}</p>
    {:else if clients.length === 0}
      <p>Nessun cliente trovato.</p>
    {:else}
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Telefono</th>
            <th>Tot. Prenotazioni</th>
            <th>Ultima Visita</th>
          </tr>
        </thead>
        <tbody>
          {#each clients as client (client.telefono_cliente)}
            <tr>
              <td>{client.ultimo_nome}</td>
              <td>{client.telefono_cliente}</td>
              <td>{client.numero_prenotazioni}</td>
              <td>{new Date(client.ultima_prenotazione).toLocaleDateString('it-IT')}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </article>
</main>

<style>
  main {
    display: grid;
    place-items: center;
    min-height: 100svh;
    padding: 1rem;
    box-sizing: border-box;
  }
  article {
    position: relative;
    width: 100%;
    max-width: 900px;
    margin: 0;
    padding: 2rem;
  }
  .logo { display: block; margin: 0 auto 1rem; width: 80px; }
  .back-link { position: absolute; top: 1.5rem; left: 1.5rem; color: var(--muted-color); }
  hgroup { margin-bottom: 2rem; text-align: center; }
  h1 { font-size: 1.5rem; }
  h2 { font-weight: 300; color: var(--muted-color); font-size: 1rem; }
  table {
    width: 100%;
  }
</style>
