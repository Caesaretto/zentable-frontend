<script>
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';
  import { ArrowLeft } from 'lucide-svelte';

  let tables = [];
  let restaurantId;
  let newTableName = '';
  let newTableSeats = 2;
  let loading = true;
  let message = { show: false, text: '', type: '' };

  async function loadTables() {
    loading = true;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: restaurantData } = await supabase
      .from('ristoranti')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (restaurantData) {
      restaurantId = restaurantData.id;
      const { data: tablesData } = await supabase
        .from('tavoli')
        .select('id, nome, posti')
        .eq('ristorante_id', restaurantId);
      
      if (tablesData) {
        tables = tablesData.sort((a, b) => 
          a.nome.localeCompare(b.nome, undefined, { numeric: true, sensitivity: 'base' })
        );
      }
    }
    loading = false;
  }

  onMount(loadTables);

  function showNotification(text, type, duration = 3000) {
    message = { show: true, text, type };
    setTimeout(() => { message = { show: false, text: '', type: '' }; }, duration);
  }

  async function handleAddTable() {
    if (!newTableName || !restaurantId) return;
    
    const { error } = await supabase.from('tavoli').insert({
      nome: newTableName,
      posti: newTableSeats,
      ristorante_id: restaurantId
    });

    if (error) {
      showNotification('Errore: ' + error.message, 'error');
    } else {
      newTableName = '';
      newTableSeats = 2;
      showNotification('Tavolo aggiunto!', 'success');
      await loadTables();
    }
  }
</script>

{#if message.show}
  <div class="toast {message.type}">
    {message.text}
  </div>
{/if}

<main class="container">
  <article>
    <a href="/dashboard" class="back-link" aria-label="Torna alla dashboard">
      <ArrowLeft size={24}/>
    </a>
    <img src="/logo.png" alt="Logo Zentable" class="logo">
    
    <hgroup>
      <h1>Gestione Tavoli</h1>
      <h2>Aggiungi e visualizza i tavoli del tuo locale.</h2>
    </hgroup>

    <form on:submit|preventDefault={handleAddTable} class="add-form">
      <input type="text" bind:value={newTableName} placeholder="Nome tavolo (es. T1)" required />
      <input type="number" bind:value={newTableSeats} min="1" placeholder="Posti" required />
      <button type="submit" class="contrast">Aggiungi</button>
    </form>

    <hr />

    <div class="tables-grid">
      {#if loading}
        <p aria-busy="true">Caricamento tavoli...</p>
      {:else if tables.length === 0}
        <p>Nessun tavolo ancora creato.</p>
      {:else}
        {#each tables as table (table.id)}
          <div class="table-item">
            <div class="table-enso">
              <span class="table-name">{table.nome}</span>
            </div>
            <div class="table-seats">{table.posti} posti</div>
          </div>
        {/each}
      {/if}
    </div>
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
  
  .add-form {
    display: grid;
    grid-template-columns: 2fr 1fr auto;
    gap: 1rem;
    max-width: 500px;
    margin: 0 auto;
  }

  .tables-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 2rem;
    margin-top: 2rem;
    min-height: 160px;
  }

  .table-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .table-enso {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 120px;
    height: 120px;
    background-image: url('/pennellata-nera.png');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }

  .table-name {
    display: block;
    font-size: 1.8rem;
    font-weight: 700;
    line-height: 1;
    color: var(--text-color);
  }

  .table-seats {
    font-weight: 700;
    text-transform: uppercase;
    font-size: 0.8rem;
    color: var(--muted-color);
  }

  .toast {
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    padding: 1rem; border-radius: 8px; z-index: 100;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15); color: white;
  }
  .toast.success { background-color: #28a745; }
  .toast.error { background-color: var(--primary); }
</style>
