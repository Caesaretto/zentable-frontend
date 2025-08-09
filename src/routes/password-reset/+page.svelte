<script>
  import { supabase } from '$lib/supabaseClient';

  let email = '';
  let loading = false;
  let message = '';
  let messageType = 'error';

  async function handlePasswordReset() {
    try {
      loading = true;
      message = '';
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://zentable.netlify.app/update-password', // La pagina dove l'utente imposterà la nuova password
      });

      if (error) throw error;

      message = 'Email di recupero inviata! Controlla la tua posta.';
      messageType = 'success';

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
      <h1>Password Dimenticata?</h1>
      <h2>Inserisci la tua email per ricevere il link di recupero.</h2>
    </hgroup>

    <form on:submit|preventDefault={handlePasswordReset}>
      <input type="email" bind:value={email} name="email" placeholder="La tua email di registrazione" required />
      <button type="submit" class="contrast" disabled={loading}>
        {loading ? 'Invio in corso...' : 'Invia Link di Recupero'}
      </button>
    </form>

    {#if message}
      <p class="message {messageType}">{message}</p>
    {/if}

    <footer>
      Ricordi la password? <a href="/login">Torna al Login</a>
    </footer>
  </article>
</main>

<style>
  /* Stili identici a login/register per coerenza */
  main { display: grid; place-items: center; min-height: 100svh; padding: 1rem; }
  article { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; width: 100%; max-width: 400px; padding: 1.5rem; margin: 0; text-align: center; border: 1px solid var(--border-color); box-shadow: 0 5px 20px rgba(0,0,0,0.05); border-radius: var(--pico-border-radius); }
  .logo { width: 100px; margin-bottom: 0.5rem; }
  hgroup { margin-bottom: 0.5rem; }
  h1 { font-size: 1.5rem; white-space: nowrap; margin: 0; margin-bottom: 0.5rem; }
  h2 { font-weight: 300; color: var(--muted-color); font-size: 0.9rem; line-height: 1.4; margin: 0; }
  form { width: 100%; }
  input, button { padding: 0.75rem; }
  footer { margin-top: 0.75rem; font-size: 0.8rem; }
  footer a { color: var(--primary); font-weight: 700; }
  .message { margin-top: 0.75rem; font-size: 0.9rem; }
  .message.success { color: #28a745; }
  .message.error { color: var(--primary); }
</style>
