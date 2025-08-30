<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { Settings, LayoutGrid, Calendar, Clock, Users } from 'lucide-svelte';

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
</script>

<div class="dashboard-container">
  <div class="main-content">
    
    <a href="/">
      <img src="/logo.png" alt="Logo Zentable" class="logo">
    </a>

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
        <a href="/dashboard/clienti" class="nav-button"><Users color="black" size={60} strokeWidth={1.5} /></a>
        <div class="nav-label">Clienti</div>
      </div>
      <div class="nav-item">
        <a href="/dashboard/orari" class="nav-button"><Clock color="black" size={60} strokeWidth={1.5} /></a>
        <div class="nav-label">Orari</div>
      </div>
    </div>
  </div>
</div>

<style>
  .dashboard-container {
    display: flex;
    flex-direction: column;
    justify-content: center; /* Centra verticalmente */
    align-items: center;
    min-height: calc(100vh - 75px); /* Altezza meno l'header */
    padding: 1rem;
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
    width: 150px; /* Logo leggermente più piccolo per bilanciare */
    margin-bottom: 2rem;
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
    flex-wrap: wrap;
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
    width: 180px;
    height: 180px;
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
</style>
