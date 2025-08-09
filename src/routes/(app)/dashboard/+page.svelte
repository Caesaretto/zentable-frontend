k<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { Settings, LayoutGrid, Calendar, Clock } from 'lucide-svelte';

  let restaurantName = 'il tuo locale';

  onMount(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: restaurantData } = await supabase
        .from('ristoranti')
        .select('nome')
        .eq('user_id', user.id)
        .single();
      if (restaurantData && restaurantData.nome) {
        restaurantName = restaurantData.nome;
      }
    }
  });

  async function handleLogout() {
    await supabase.auth.signOut();
    goto('/login');
  }
</script>

<div class="dashboard-container">
  <div class="main-content">
    <a href="/"><img src="/logo.png" alt="Logo Zentable" class="logo"></a>
    <hgroup>
      <h1>La Tua <span class="accent">ZEN</span>board</h1>
      <h2>{restaurantName}</h2>
    </hgroup>
    <div class="navigation-grid">
      <div class="nav-item">
        <a href="/dashboard/timeline" class="nav-button"><Calendar color="black" size={60} strokeWidth={1.5} /></a>
        <div class="nav-label">Prenotazioni</div>
      </div>
      <div class="nav-item">
        <a href="/dashboard/tavoli" class="nav-button"><LayoutGrid color="black" size={60} strokeWidth={1.5} /></a>
        <div class="nav-label">Tavoli</div>
      </div>
      <div class="nav-item">
        <a href="/dashboard/orari" class="nav-button"><Clock color="black" size={60} strokeWidth={1.5} /></a>
        <div class="nav-label">Orari</div>
      </div>
      <div class="nav-item">
        <a href="/dashboard/impostazioni" class="nav-button"><Settings color="black" size={60} strokeWidth={1.5} /></a>
        <div class="nav-label">Impostazioni</div>
      </div>
    </div>
  </div>
  <button class="logout-button" on:click={handleLogout}>Logout</button>
</div>

<style>
  .dashboard-container {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    min-height: 100vh;
    padding: 2rem;
    box-sizing: border-box;
    text-align: center;
  }
  .main-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }
  .logo {
    margin-top: 1rem;
    margin-bottom: 2rem;
    width: 120px;
  }
  hgroup { margin-bottom: 2.5rem; }
  h1 { font-size: 2rem; }
  h2 {
    font-weight: 300;
    color: var(--muted-color);
    font-size: 1.1rem;
    text-transform: none;
    letter-spacing: normal;
  }
  .accent { color: var(--primary); }
  .navigation-grid {
    display: flex;
    flex-direction: row;
    justify-content: center;
    gap: 2.5rem;
    width: 100%;
  }
  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  .nav-button {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 200px;
    height: 200px;
    text-decoration: none;
    background-image: url('/pennellata-nera.png');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    transition: transform 0.2s;
    border: none;
    background-color: transparent;
  }
  .nav-button:hover { transform: scale(1.05); }
  .nav-label {
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: 1rem;
    color: var(--text-color);
  }
  .logout-button {
    background-color: var(--primary);
    border-color: var(--primary);
    padding: 0.6rem 1.75rem;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-top: 2rem;
  }
  /* --- CORREZIONE BUG HOVER --- */
  .logout-button:hover {
      background-color: var(--primary-hover);
      border-color: var(--primary-hover);
      color: var(--text-on-dark);
  }
  @media (max-width: 992px) {
    .navigation-grid {
      flex-direction: column;
      align-items: center;
      gap: 2rem;
    }
    .nav-button {
      width: 180px;
      height: 180px;
    }
  }
</style>
