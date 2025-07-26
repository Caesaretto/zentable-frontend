<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';
  let loading = false;
  let message = '';

  async function handleLogin() {
    try {
      loading = true;
      message = '';
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      goto('/dashboard');
    } catch (error) {
      if (error instanceof Error) {
        message = error.message;
      }
    } finally {
      loading = false;
    }
  }
</script>

<main class="container">
  <article>
    <a href="/">
      <img src="/logo.png" alt="Logo Zentable" class="logo">
    </a>

    <hgroup>
      <h1>Bentornato</h1>
      <h2>Entra nel tuo spazio <span class="accent">ZEN.</span></h2>
    </hgroup>

    <form on:submit|preventDefault={handleLogin}>
      <input type="email" bind:value={email} name="email" placeholder="Email" aria-label="Email" autocomplete="email" required />
      <input type="password" bind:value={password} name="password" placeholder="Password" aria-label="Password" autocomplete="current-password" required />

      <button type="submit" class="contrast" disabled={loading}>
        {loading ? 'Accesso in corso...' : 'Accedi'}
      </button>
    </form>

    {#if message}
      <p class="message">{message}</p>
    {/if}

    <footer>
      Non sei ancora Zen? <a href="/register">Registrati</a>
    </footer>
  </article>
</main>

<style>
  .container {
    display: grid;
    place-items: center;
    min-height: 100svh; 
    padding: 1rem;
    box-sizing: border-box;
  }
  article {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    max-width: 400px;
    padding: 1.5rem;
    margin: 0;
    text-align: center;
    border: 1px solid var(--border-color);
    box-shadow: 0 5px 20px rgba(0,0,0,0.05);
    border-radius: var(--pico-border-radius);
  }

  .logo {
      width: 100px;
      margin-bottom: 0.5rem;
  }

  hgroup {
      margin-bottom: 0.5rem;
  }

  h1 {
    font-size: 1.5rem;
    white-space: nowrap;
    margin: 0;
  }

  h2 {
    font-weight: 300;
    color: var(--muted-color);
    font-size: 1rem;
    line-height: 1.4;
    margin: 0;
  }

  .accent {
    color: var(--primary);
    font-weight: 700;
  }

  form {
      width: 100%;
  }

  input, button {
      padding: 0.75rem;
  }

  footer {
    margin-top: 0.75rem;
    font-size: 0.8rem;
  }

  footer a {
    color: var(--primary); /* Colore rosso per il link */
    font-weight: 700;
  }

  .message {
    margin-top: 0.75rem;
    font-size: 0.9rem;
    color: var(--primary);
  }
</style>
