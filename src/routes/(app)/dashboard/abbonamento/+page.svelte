<script>
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';
  import { ArrowLeft } from 'lucide-svelte';

  let loading = true;
  let subscriptionStatus = 'Non attivo';
  let periodEnd = '';

  onMount(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('ristoranti')
        .select('subscription_status, subscription_period_end')
        .eq('user_id', user.id)
        .single();

      if (data) {
        subscriptionStatus = data.subscription_status || 'Non attivo';
        if (data.subscription_period_end) {
          periodEnd = new Date(data.subscription_period_end).toLocaleDateString('it-IT');
        }
      }
    }
    loading = false;
  });

  function handleSubscribeClick() {
    // Logica da implementare nel prossimo passo
    alert('Qui avvieremo il checkout con Stripe!');
  }
</script>

<main class="container">
  <article>
    <a href="/dashboard" class="back-link" aria-label="Torna alla dashboard">
      <ArrowLeft size={24}/>
    </a>
    <img src="/logo.png" alt="Logo Zentable" class="logo">

    <hgroup>
      <h1>Il Tuo Abbonamento</h1>
      <h2>Gestisci il tuo piano di abbonamento Zentable.</h2>
    </hgroup>

    {#if loading}
      <p aria-busy="true">Caricamento stato abbonamento...</p>
    {:else}
      <div class="status-box">
        <h3>Stato Attuale: <strong>{subscriptionStatus}</strong></h3>
        {#if periodEnd}
          <p>Il tuo piano è attivo fino al: {periodEnd}</p>
        {/if}
      </div>

      {#if subscriptionStatus !== 'active'}
        <button on:click={handleSubscribeClick}>
          Abbonati Ora (29€/mese)
        </button>
      {:else}
        <button disabled>Sei già abbonato</button>
      {/if}
    {/if}
  </article>
</main>

<style>
  main { display: grid; place-items: center; min-height: 100svh; padding: 1rem; }
  article { text-align: center; width: 100%; max-width: 600px; }
  .logo { display: block; margin: 0 auto 1rem; width: 80px; }
  .back-link { position: absolute; top: 1.5rem; left: 1.5rem; color: var(--muted-color); }
  hgroup { margin-bottom: 2rem; }
  .status-box {
    padding: 1.5rem;
    border: 1px solid var(--border-color);
    border-radius: var(--pico-border-radius);
    margin-bottom: 2rem;
  }
  .status-box strong {
    color: var(--primary);
  }
</style>
