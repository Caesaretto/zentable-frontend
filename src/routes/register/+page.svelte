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

      message = 'Registrazione avvenuta! Controlla la tua email per confermare l\'account e poi accedi.';
      
      // Dopo 3 secondi, reindirizziamo l'utente alla pagina di login
      setTimeout(() => {
        goto('/login');
      }, 3000);

    } catch (error) {
      message = error.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="container">
  <h1>Registra il Tuo Ristorante</h1>
  <p>Crea un nuovo account su Zentable per iniziare.</p>
  
  <form on:submit|preventDefault={handleSignUp}>
    <div class="form-group">
      <label for="email">La tua Email</label>
      <input id="email" type="email" bind:value={email} placeholder="es. mario@ristorante.it" required />
    </div>
    <div class="form-group">
      <label for="password">Scegli una Password</label>
      <input id="password" type="password" bind:value={password} required />
    </div>
    <button type="submit" disabled={loading}>
      {loading ? 'Creazione account in corso...' : 'Registrati'}
    </button>
  </form>

  {#if message}
    <p class="message">{message}</p>
  {/if}

  <p class="link-container">
    Hai già un account? <a href="/login">Accedi ora</a>
  </p>
</div>

<style>
  .container { max-width: 400px; margin: 50px auto; padding: 20px; border: 1px solid #ccc; border-radius: 8px; font-family: sans-serif; }
  .form-group { margin-bottom: 15px; }
  label { display: block; margin-bottom: 5px; }
  input { width: 100%; padding: 8px; box-sizing: border-box; }
  button { width: 100%; padding: 10px; background-color: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; }
  button:disabled { background-color: #ccc; }
  .message { margin-top: 15px; text-align: center; }
  .link-container { margin-top: 20px; text-align: center; font-size: 0.9rem; }
  a { color: #007bff; }
</style>
