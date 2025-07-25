<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';

  async function handleLogout() {
    await supabase.auth.signOut();
    goto('/login');
  }
</script>

<div class="dashboard-container">
  <h1>Benvenuto su Zentable!</h1>
  <p>Scegli uno strumento per iniziare a gestire il tuo locale.</p>

  <div class="navigation-grid">
    <a href="/dashboard/timeline" class="nav-card">
      <h2>🗓️ Timeline</h2>
      <p>Visualizza e gestisci le prenotazioni.</p>
    </a>
    <a href="/dashboard/tavoli" class="nav-card">
      <h2>🪑 Gestione Tavoli</h2>
      <p>Crea e modifica i tavoli della tua sala.</p>
    </a>
    <a href="/dashboard/orari" class="nav-card">
      <h2>🕰️ Gestione Orari</h2>
      <p>Imposta i tuoi giorni e turni di apertura.</p>
    </a>
    <a href="/dashboard/impostazioni" class="nav-card">
      <h2>⚙️ Impostazioni</h2>
      <p>Modifica i dati del tuo ristorante.</p>
    </a>
  </div>

  <button class="logout-button" on:click={handleLogout}>
    Logout
  </button>
</div>

<style>
  .dashboard-container { max-width: 800px; margin: 40px auto; font-family: sans-serif; }
  h1 { margin-bottom: 0.5rem; }
  p { margin-top: 0; color: #666; }
  .navigation-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-top: 30px;
    margin-bottom: 30px;
  }
  .nav-card {
    display: block;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    text-decoration: none;
    color: inherit;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .nav-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  .nav-card h2 { margin-top: 0; }
  .logout-button {
    padding: 10px 20px;
    background-color: #dc3545;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 0.9rem;
    float: right;
  }
</style>
