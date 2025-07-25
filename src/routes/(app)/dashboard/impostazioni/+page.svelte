<script>
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let session;
  let loading = true;
  let restaurant = {
    nome: '',
    indirizzo: '',
    telefono: ''
  };
  let message = '';

  onMount(async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    session = currentSession;

    if (session) {
      const { data, error } = await supabase
        .from('ristoranti')
        .select()
        .eq('user_id', session.user.id)
        .single();

      if (data) {
        restaurant = data;
      }
      if (error && error.code !== 'PGRST116') {
        message = 'Errore nel caricamento dei dati: ' + error.message;
      }
    }
    loading = false;
  });

  async function handleSave() {
    try {
      loading = true;
      message = '';
      const user = session.user;
      const { error } = await supabase.from('ristoranti').upsert({
        id: restaurant.id,
        user_id: user.id,
        nome: restaurant.nome,
        indirizzo: restaurant.indirizzo,
        telefono: restaurant.telefono
      });
      if (error) throw error;
      message = 'Dati salvati con successo!';
    } catch (error) {
      message = error.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="dashboard-container">
  <h1>Impostazioni Ristorante</h1>
  <p>Gestisci le informazioni del tuo locale.</p>

  {#if loading}
    <p>Caricamento dati...</p>
  {:else}
    <form on:submit|preventDefault={handleSave}>
      <div class="form-group">
        <label for="nome">Nome Ristorante</label>
        <input id="nome" type="text" bind:value={restaurant.nome} required />
      </div>
      <div class="form-group">
        <label for="indirizzo">Indirizzo</label>
        <input id="indirizzo" type="text" bind:value={restaurant.indirizzo} />
      </div>
      <div class="form-group">
        <label for="telefono">Telefono</label>
        <input id="telefono" type="text" bind:value={restaurant.telefono} />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'Salvataggio...' : 'Salva Dati Ristorante'}
      </button>
    </form>
  {/if}

  {#if message}
    <p class="message">{message}</p>
  {/if}

  <a href="/dashboard" class="button-link-back">Torna alla Dashboard</a>
</div>

<style>
  .dashboard-container { max-width: 600px; margin: 40px auto; padding: 20px; font-family: sans-serif; }
  .form-group { margin-bottom: 1rem; }
  label { display: block; margin-bottom: 0.5rem; }
  input { width: 100%; padding: 0.5rem; box-sizing: border-box; }
  button { width: 100%; padding: 0.75rem; background-color: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 1rem; }
  button:disabled { background-color: #ccc; }
  .message { margin-top: 1rem; color: #007bff; }
   .button-link-back {
    display: inline-block;
    margin-top: 1rem;
    color: #007bff;
    text-decoration: none;
  }
</style>
