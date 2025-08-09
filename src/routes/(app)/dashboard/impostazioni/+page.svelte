<script>
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';
  import { ArrowLeft } from 'lucide-svelte';

  let loading = true;
  let userEmail = '';
  let restaurant = {
    nome: '',
    indirizzo: '',
    telefono: '',
    nome_proprietario: '',
    cognome_proprietario: ''
  };
  let notification = { show: false, message: '', type: '' };
  
  let publicLink = '';
  let copyButtonText = 'Copia Link';

  function updatePublicLink() {
    if (restaurant.nome) {
      const slug = restaurant.nome.toLowerCase().replace(/\s+/g, '-');
      publicLink = `https://zentable.netlify.app/r/${slug}`;
    } else {
      publicLink = '';
    }
  }

  onMount(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userEmail = user.email;
      const { data } = await supabase.from('ristoranti').select().eq('user_id', user.id).single();
      if (data) {
        restaurant = data;
        updatePublicLink(); // Calcola il link al caricamento
      }
    }
    loading = false;
  });
  
  function showNotification(message, type, duration = 3000) {
    notification = { show: true, message, type };
    setTimeout(() => {
      notification = { show: false, message: '', type: '' };
    }, duration);
  }

  async function handleSave() {
    loading = true;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('ristoranti').upsert({
      id: restaurant.id,
      user_id: user.id,
      nome: restaurant.nome,
      indirizzo: restaurant.indirizzo,
      telefono: restaurant.telefono,
      nome_proprietario: restaurant.nome_proprietario,
      cognome_proprietario: restaurant.cognome_proprietario
    });

    if (error) {
      showNotification('Errore: ' + error.message, 'error');
    } else {
      showNotification('Dati salvati con successo!', 'success');
      updatePublicLink(); // Aggiorna il link dopo il salvataggio
    }
    loading = false;
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(publicLink);
    copyButtonText = 'Copiato!';
    setTimeout(() => { copyButtonText = 'Copia Link'; }, 2000);
  }
</script>

{#if notification.show}
  <div class="toast {notification.type}">
    {notification.message}
  </div>
{/if}

<main class="container">
  <article>
    <a href="/dashboard" class="back-link" aria-label="Torna alla dashboard">
      <ArrowLeft size={24}/>
    </a>
    <img src="/logo.png" alt="Logo Zentable" class="logo">
    
    <hgroup>
      <h1>Impostazioni</h1>
      <h2>Gestisci le informazioni del tuo locale e del tuo profilo.</h2>
    </hgroup>
    
    {#if loading}
      <p aria-busy="true">Caricamento...</p>
    {:else}
      <form on:submit|preventDefault={handleSave}>
        
        <fieldset class="form-grid">
          <label>
            Il Tuo Nome
            <input type="text" name="nome_proprietario" placeholder="Mario" bind:value={restaurant.nome_proprietario}>
          </label>
          <label>
            Il Tuo Cognome
            <input type="text" name="cognome_proprietario" placeholder="Rossi" bind:value={restaurant.cognome_proprietario}>
          </label>
        </fieldset>
        
        <hr>
        
        <label for="nome_ristorante">Nome Ristorante</label>
        <input type="text" id="nome_ristorante" name="nome_ristorante" placeholder="Nome del locale" bind:value={restaurant.nome} required>
        
        <fieldset class="form-grid">
            <label>
                Indirizzo
                <input type="text" name="indirizzo" placeholder="Indirizzo del locale" bind:value={restaurant.indirizzo}>
            </label>
            <label>
                Telefono
                <input type="tel" name="telefono" placeholder="Telefono del locale" bind:value={restaurant.telefono}>
            </label>
        </fieldset>

        <label for="email">Email Account</label>
        <input type="email" id="email" name="email" value={userEmail} disabled>

        <button type="submit" disabled={loading}>
          {loading ? 'Salvataggio...' : 'Salva'}
        </button>
      </form>
      
      <hr>

      <div class="public-link-section">
        <label for="public-link">Il Tuo Link di Prenotazione Pubblico</label>
        <div class="grid">
          <input id="public-link" type="text" readonly bind:value={publicLink} placeholder="Salva il nome del ristorante per generare il link">
          <button on:click={copyToClipboard} class="secondary" disabled={!publicLink}>{copyButtonText}</button>
        </div>
      </div>
    {/if}
  </article>
</main>

<style>
  main { display: grid; place-items: center; min-height: 100svh; padding: 1rem; box-sizing: border-box; }
  article { position: relative; width: 100%; max-width: 700px; margin: 0; padding: 2rem; }
  .logo { display: block; margin: 0 auto 1rem; width: 80px; }
  .back-link { position: absolute; top: 1.5rem; left: 1.5rem; color: var(--muted-color); }
  hgroup { margin-bottom: 2rem; text-align: center; }
  h1 { font-size: 1.5rem; }
  h2 { font-weight: 300; color: var(--muted-color); font-size: 1rem; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  button[type="submit"] { font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; background-color: var(--primary); border-color: var(--primary); }
  
  .public-link-section {
    margin-top: 1.5rem;
    text-align: left;
  }
  
  .toast {
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    padding: 1rem; border-radius: 8px; z-index: 100;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15); color: white;
  }
  .toast.success { background-color: #28a745; }
  .toast.error { background-color: var(--primary); }

  @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } }
</style>
