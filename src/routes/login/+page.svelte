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
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        throw error;
      }

      goto('/dashboard');

    } catch (error) {
      message = error.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="container">
  <h1>Zentable Login</h1>
  <p>Accedi alla tua dashboard per gestire le prenotazioni.</p>
  
  <form on:submit|preventDefault={handleLogin}>
    <div class="form-group">
      <label for="email">Email</label>
      <input 
        id="email" 
        type="email" 
        bind:value={email} 
        placeholder="La tua email"
        required
      />
    </div>

    <div class="form-group">
      <label for="password">Password</label>
      <input 
        id="password" 
        type="password" 
        bind:value={password} 
        placeholder="La tua password"
        required
      />
    </div>

    <button type="submit" disabled={loading}>
      {loading ? 'Caricamento...' : 'Accedi'}
    </button>
  </form>

  {#if message}
    <p class="message">{message}</p>
  {/if}
</div>

<style>
  .container {
    max-width: 400px;
    margin: 50px auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-family: sans-serif;
  }
  .form-group {
    margin-bottom: 15px;
  }
  label {
    display: block;
    margin-bottom: 5px;
  }
  input {
    width: 100%;
    padding: 8px;
    box-sizing: border-box;
  }
  button {
    width: 100%;
    padding: 10px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  button:disabled {
    background-color: #ccc;
  }
  .message {
    margin-top: 15px;
    color: red;
  }
</style>

