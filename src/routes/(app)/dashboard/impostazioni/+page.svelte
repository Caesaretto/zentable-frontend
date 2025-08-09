<script>
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';
  import { ArrowLeft } from 'lucide-svelte';

  let loading = true;
  let userEmail = '';
  let restaurant = { nome: '', indirizzo: '', telefono: '', nome_proprietario: '', cognome_proprietario: '' };
  let notification = { show: false, message: '', type: '' };
  let publicLink = '';
  let copyButtonText = 'Copia';

  function updatePublicLink() {
    if (restaurant.nome) {
      const slug = restaurant.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
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
        updatePublicLink();
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
      updatePublicLink();
    }
    loading = false;
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(publicLink);
    copyButtonText = 'Copiato!';
    setTimeout(() => { copyButtonText = 'Copia'; }, 2000);
  }
</script>

{#if notification.show}
  <div class="toast {notification.type}">{notification.message}</div>
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
        <button type="submit" disabled={loading} class="contrast">
          {loading ? 'Salvataggio...' : 'Salva'}
        </button>
      </form>
      
      <hr>

      <div class="public-link-section">
        <label for="public-link">Il Tuo Link di Prenotazione Pubblico</label>
        <div class="link-group">
          <input id="public-link" type="text" readonly bind:value={publicLink} placeholder="Salva il nome del ristorante per generare il link">
          <button type="button" on:click={copyToClipboard} class="copy-button" disabled={!publicLink}>{copyButtonText}</button>
        </div>
      </div>
    {/if}
  </article>
</main>

<style>
  main { display: grid; place-items: center; min-height: 100svh; padding: 1rem; }
  article { position: relative; width: 100%; max-width: 700px; padding: 2rem; margin: 0; }
  .logo { display: block; margin: 0 auto 1rem; width: 80px; }
  .back-link { position: absolute; top: 1.5rem; left: 1.5rem; color: var(--muted-color); }
  hgroup { margin-bottom: 2rem; text-align: center; }
  h1 { font-size: 1.5rem; }
  h2 { font-weight: 300; color: var(--muted-color); font-size: 1rem; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  button.contrast { font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
  
  .public-link-section { margin-top: 1.5rem; text-align: left; }
  .link-group {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0;
    align-items: center; /* Allinea verticalmente gli elementi */
  }
  .link-group input, .link-group button {
      height: var(--pico-form-element-height, 3rem); /* Altezza uniforme */
      margin: 0;
  }
  .link-group input {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
  }
  .copy-button {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      background-color: var(--text-color);
      border-color: var(--text-color);
      color: var(--text-on-dark);
      width: 120px;
  }
  .copy-button:hover { background-color: #343a40; border-color: #343a40; }
  
  .toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); padding: 1rem; border-radius: 8px; z-index: 100; box-shadow: 0 4px 12px rgba(0,0,0,0.15); color: white; }
  .toast.success { background-color: #28a745; }
  .toast.error { background-color: var(--primary); }

  @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } }
</style>
