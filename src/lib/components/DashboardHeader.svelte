<script>
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let nome_proprietario = '';
  let trialMessage = '';
  let trialExpired = false;

  onMount(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: restaurantData } = await supabase
            .from('ristoranti')
            .select('nome_proprietario, trial_ends_at, subscription_status')
            .eq('user_id', user.id)
            .single();
        
        if (restaurantData) {
            nome_proprietario = restaurantData.nome_proprietario || user.email.split('@')[0];

            if (restaurantData.subscription_status !== 'active' && restaurantData.trial_ends_at) {
                const endDate = new Date(restaurantData.trial_ends_at);
                const now = new Date();
                const diffTime = endDate - now;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 0) {
                    trialMessage = `Hai ancora ${diffDays} giorni di prova.`;
                } else {
                    trialMessage = 'Prova gratuita scaduta!';
                    trialExpired = true;
                }
            }
        }
    }
  });

  async function handleLogout() {
    await supabase.auth.signOut();
    goto('/login');
  }
</script>

{#if trialMessage}
    <div class="trial-banner" class:expired={trialExpired}>
        {trialMessage}
        {#if trialExpired}
            <a href="/dashboard/abbonamento">Abbonati Ora</a>
        {/if}
    </div>
{/if}

<nav class="container-fluid">
  <ul>
    <li>
        <a href="/" class="home-link">HOME</a>
    </li>
  </ul>
  <ul>
    <li>
      <details class="dropdown">
        <summary role="button" class="secondary outline">
          Ciao, {nome_proprietario}
        </summary>
        <ul dir="rtl">
          <li><a href="/dashboard/impostazioni">Impostazioni</a></li>
          <li><a href="/dashboard/abbonamento">Abbonamento</a></li>
          <li><hr></li>
          <li><a href="#" on:click|preventDefault={handleLogout}>Logout</a></li>
        </ul>
      </details>
    </li>
  </ul>
</nav>

<style>
  .home-link {
      color: var(--text-color);
      text-decoration: none;
      font-weight: 700;
      letter-spacing: 0.1em;
  }
  .home-link:hover {
      color: var(--primary);
  }
  .dropdown ul {
      min-width: 200px;
  }
  nav {
      border-bottom: 1px solid var(--border-color);
      padding: 0.75rem 1rem;
      background-color: var(--card-background-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
  }
  nav ul {
      margin: 0;
  }
  .trial-banner {
      background-color: var(--text-color);
      color: var(--text-on-dark);
      text-align: center;
      padding: 0.5rem;
      font-size: 0.9rem;
  }
  .trial-banner.expired {
      background-color: var(--primary);
  }
  .trial-banner a {
      color: white;
      font-weight: bold;
      text-decoration: underline;
      margin-left: 1rem;
  }
</style>
