<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';
  let passwordConfirm = '';
  let loading = false;
  let message = '';
  let messageType = 'error';

  async function handleSignUp() {
    if (password !== passwordConfirm) {
      message = 'Le password non coincidono.';
      messageType = 'error';
      return;
    }

    try {
      loading = true;
      message = '';
      
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) {
        // Gestisce errori espliciti (es. password troppo debole)
        message = error.message;
        messageType = 'error';
      } else if (data.user && data.user.identities && data.user.identities.length === 0) {
        // Questo è il modo corretto per identificare un utente esistente.
        // Supabase restituisce un utente senza "identità" in questo caso.
        message = "Questo indirizzo email è già registrato. Prova ad accedere.";
        messageType = 'error'; // Mostra un errore rosso, come richiesto.
      } else {
        // Questo è il caso di una nuova registrazione andata a buon fine.
        message = 'Registrazione quasi completata! Controlla la tua email per confermare l\'account.';
        messageType = 'success';
      }

    } catch (err) {
      if (err instanceof Error) {
        message = err.message;
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
      <h1>Crea il tuo account</h1>
      <h2>Inizia a gestire le tue prenotazioni<br>in modo <span class="accent">ZEN.</span></h2>
    </hgroup>
    
    <form on:submit|preventDefault={handleSignUp}>
      <input type="email" bind:value={email} placeholder="Email" autocomplete="email" required />
      <input type="password" bind:value={password} placeholder="Scegli una password sicura" autocomplete="new-password" required />
      <input type="password" bind:value={passwordConfirm} placeholder="Ripeti la password" autocomplete="new-password" required />

      <button type="submit" class="contrast" disabled={loading}>
        {loading ? 'Creazione account...' : 'Registrati Gratis'}
      </button>
    </form>

    {#if message}
      <p class="message {messageType}">{message}</p>
    {/if}
    
    <footer>
      Sei già Zen? <a href="/login">Accedi</a>
    </footer>
  </article>
</main>

<style>
  main { display: grid; place-items: center; min-height: 100svh; padding: 1rem; }
  article { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; width: 100%; max-width: 400px; padding: 1.5rem; margin: 0; text-align: center; border: 1px solid var(--border-color); box-shadow: 0 5px 20px rgba(0,0,0,0.05); border-radius: var(--pico-border-radius); }
  .logo { width: 100px; margin-bottom: 0.5rem; }
  hgroup { margin-bottom: 0.5rem; }
  h1 { font-size: 1.5rem; white-space: nowrap; margin: 0; }
  h2 { font-weight: 300; color: var(--muted-color); font-size: 0.9rem; line-height: 1.4; margin: 0; margin-top: 0.5rem; }
  .accent { color: var(--primary); font-weight: 700; }
  form { width: 100%; }
  input, button { padding: 0.75rem; }
  footer { margin-top: 0.75rem; font-size: 0.8rem; }
  footer a { color: var(--primary); font-weight: 700; }
  .message { margin-top: 0.75rem; font-size: 0.9rem; }
  .message.success { color: #28a745; }
  .message.error { color: var(--primary); }
</style>
