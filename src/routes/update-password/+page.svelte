<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let password = '';
  let passwordConfirm = '';
  let loading = false;
  let message = '';
  let messageType = 'error';

  let hasValidSession = false;

  // Controlliamo se l'utente è arrivato qui da un link di reset valido
  onMount(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        hasValidSession = true;
      }
    });
  });

  async function handleUpdatePassword() {
    if (password !== passwordConfirm) {
      message = 'Le password non coincidono.';
      messageType = 'error';
      return;
    }

    try {
      loading = true;
      message = '';

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      message = 'Password aggiornata con successo! Ora puoi accedere.';
      messageType = 'success';
      setTimeout(() => {
        goto('/login');
      }, 2000);

    } catch (error) {
      if (error instanceof Error) {
        message = error.message;
        messageType = 'error';
      }
    } finally {
      loading = false;
    }
  }
</script>

<main class="container">
  <article>
    <a href="/"><img src="/logo.png" alt="Logo Zentable" class="logo"></a>
    <hgroup>
      <h1>Crea una nuova password</h1>
      <h2>Inserisci una nuova password sicura per il tuo account.</h2>
    </hgroup>
    
    {#if hasValidSession}
      <form on:submit|preventDefault={handleUpdatePassword}>
        <input type="password" bind:value={password} placeholder="Nuova password" autocomplete="new-password" required />
        <input type="password" bind:value={passwordConfirm} placeholder="Conferma la nuova password" autocomplete="new-password" required />

        <button type="submit" class="contrast" disabled={loading}>
          {loading ? 'Salvataggio...' : 'Salva Nuova Password'}
        </button>
      </form>
    {:else}
       <p>Per reimpostare la password, devi prima richiedere un link dalla pagina di <a href="/password-reset">recupero password</a>.</p>
    {/if}


    {#if message}
      <p class="message {messageType}">{message}</p>
    {/if}
    
  </article>
</main>

<style>
  main { display: grid; place-items: center; min-height: 100svh; padding: 1rem; }
  article { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; width: 100%; max-width: 400px; padding: 1.5rem; margin: 0; text-align: center; border: 1px solid var(--border-color); box-shadow: 0 5px 20px rgba(0,0,0,0.05); border-radius: var(--pico-border-radius); }
  .logo { width: 100px; margin-bottom: 0.5rem; }
  hgroup { margin-bottom: 0.5rem; }
  h1 { font-size: 1.5rem; white-space: nowrap; margin: 0; }
  h2 { font-weight: 300; color: var(--muted-color); font-size: 0.9rem; line-height: 1.4; margin: 0; margin-top: 0.5rem; }
  form { width: 100%; }
  input, button { padding: 0.75rem; }
  .message { margin-top: 0.75rem; font-size: 0.9rem; }
  .message.success { color: #28a745; }
  .message.error { color: var(--primary); }
</style>
