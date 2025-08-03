<script>
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import { goto } from '$app/navigation';

    let session = null;
    let nome_proprietario = '';

    onMount(async () => {
        const { data } = await supabase.auth.getSession();
        session = data.session;

        if (session) {
            const { data: restaurantData } = await supabase
                .from('ristoranti')
                .select('nome_proprietario')
                .eq('user_id', session.user.id)
                .single();

            if (restaurantData && restaurantData.nome_proprietario) {
                nome_proprietario = restaurantData.nome_proprietario;
            }
        }
    });

    async function handleLogout() {
        await supabase.auth.signOut();
        session = null; // Aggiorna lo stato per far sparire il saluto
    }
</script>

<main class="container">

  {#if session}
  <div class="user-panel">
    <span class="user-welcome">
      Ciao, {nome_proprietario || session.user.email.split('@')[0]}
    </span>
    <button on:click={handleLogout} class="logout-button">Logout</button>
  </div>
  {/if}

  <div class="hero-content">
    <img src="/logo.png" alt="Logo Zentable" class="logo">

    <div class="headings">
      <h2>Gestisce le prenotazioni del tuo ristorante.</h2>
      <p class="tagline">Mentre tu resti <span class="accent">zen.</span></p>
    </div>

    <p class="description">
      Una piattaforma di gestione intelligente,<br>pensata per chi lavora da chi lavora (e resta <span class="accent">zen</span>).
    </p>

    <div class="cta-buttons">
      {#if session}
        <a href="/dashboard" class="btn-brush primary">La Tua ZENboard</a>
      {:else}
        <a href="/register" class="btn-brush primary">Diventa Zen</a>
        <a href="/login" class="btn-brush secondary">Accedi</a>
      {/if}
    </div>
  </div>
</main>

<style>
  .container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    padding: 2rem;
    box-sizing: border-box;
    text-align: center;
    position: relative;
  }
  .user-panel {
      position: absolute;
      top: 2rem;
      right: 2rem;
      display: flex;
      align-items: center;
      gap: 1rem;
  }
  .user-welcome {
      font-weight: 700;
  }
  .logout-button {
      padding: 0.5rem 1rem;
      font-size: 0.8rem;
      background-color: var(--primary);
      border-color: var(--primary);
      color: white;
      --pico-font-weight: 700;
  }
  .logo { width: 180px; margin-bottom: 2rem; }
  .headings { margin-bottom: 1.5rem; }
  .headings h2 { font-size: 1.6rem; font-weight: 700; margin: 0; white-space: nowrap; }
  .tagline { font-size: 1.4rem; color: var(--muted-color); margin-top: 0.5rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 300; }
  .accent { color: var(--primary); font-weight: 700; text-transform: uppercase; }
  .description { font-size: 1rem; line-height: 1.6; margin-bottom: 1rem; }
  .cta-buttons { margin-top: 2rem; display: flex; justify-content: center; gap: 2.5rem; align-items: center; width: 100%; }
  .btn-brush {
    position: relative; display: flex; justify-content: center; align-items: center;
    width: 180px; height: 180px; padding: 1rem; text-decoration: none;
    font-weight: 300; text-transform: uppercase; letter-spacing: 0.1em;
    transition: transform 0.2s; line-height: 1.2; box-sizing: border-box;
    border: none; background-size: contain; background-repeat: no-repeat; background-position: center;
  }
  .btn-brush span { position: relative; z-index: 1; }
  .btn-brush:hover { transform: scale(1.05); }
  .btn-brush.primary { background-image: url('/pennellata-nera.png'); color: var(--primary); font-weight: 700; }
  .btn-brush.secondary { background-image: url('/pennellata-rossa.png'); color: var(--text-color); }

  @media (max-width: 768px) {
    .headings h2 { white-space: normal; }
    .cta-buttons { flex-direction: column; gap: 2rem; }
    .logo, .btn-brush { width: 150px; height: 150px; }
    .user-panel { position: static; margin-bottom: 1rem; order: -1; }
  }
</style>
