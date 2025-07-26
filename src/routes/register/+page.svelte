<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';
  let loading = false;
  let message = '';

  async function handleSignUp() {
    try {
      loading = true;
      message = '';
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) throw error;

      message = 'Registrazione avvenuta! Controlla la tua email per confermare l\'account.';
      
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
      <h1>Crea il tuo account</h1>
      <h2>Inizia a gestire le tue<br>prenotazioni in modo <span class="accent">ZEN.</span></h2>
    </hgroup>
    
    <form on:submit|preventDefault={handleSignUp}>
      <input type="email" bind:value={email} name="email" placeholder="Email" aria-label="Email" autocomplete="email" required />
      <input type="password" bind:value={password} name="password" placeholder="Scegli una password sicura" aria-label="Password" autocomplete="new-password" required />

      <button type="submit" class="contrast" disabled={loading}>
        {loading ? 'Creazione account...' : 'Registrati Gratis'}
      </button>
    </form>

    {#if message}
      <p class="message">{message}</p>
    {/if}
    
    <footer>
      Sei già Zen? <a href="/login">Accedi</a>
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
    font-size: 0.9rem;
    line-height: 1.4;
    margin: 0;
    margin-top: 0.5rem; /* Aggiunge spazio sotto h1 */
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
    color: var(--primary);
    font-weight: 700;
  }
  
  .message {
    margin-top: 0.75rem;
    font-size: 0.9rem;
  }
</style>
