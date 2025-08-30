<script>
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';
  import { ArrowLeft } from 'lucide-svelte';
  import { loadStripe } from '@stripe/stripe-js';

  let loading = true;
  let subscriptionStatus = 'Non attivo';
  let trialEndsAt = null;
  let hasUsedTrial = false;
  
  // INSERISCI QUI LA TUA CHIAVE PUBBLICABILE DI TEST
  const STRIPE_PUBLIC_KEY = 'pk_live_51RvcSH0cKjSo6tY1PR6g5RIsiTMrLqKxa0XyNtgAgX6Rg4ehW5GFoQXg76YnNCWVr2lARpFSd8wfmRcg8SlQyseh00ZLuHyG5A';

  onMount(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('ristoranti')
        .select('subscription_status, trial_ends_at')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        subscriptionStatus = data.subscription_status || 'Non attivo';
        trialEndsAt = data.trial_ends_at;
        hasUsedTrial = !!trialEndsAt;
      }
    }
    loading = false;
  });

  async function handleSubscribeClick() {
    loading = true;
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session');
      
      if (error) throw new Error(`Errore dalla funzione: ${error.message}`);
      if (!data || !data.sessionId) {
          if(data.error) throw new Error(`Errore da Stripe: ${data.error}`);
          throw new Error("La funzione non ha restituito un sessionId valido.");
      }

      const stripe = await loadStripe(STRIPE_PUBLIC_KEY);
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId: data.sessionId });
      } else {
        throw new Error('Impossibile caricare Stripe.');
      }
    } catch (e) {
      if (e instanceof Error) {
        alert(e.message);
      }
    } finally {
      loading = false;
    }
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
      <h2>Gestisci il tuo <span class="accent">ZEN</span>plan.</h2>
    </hgroup>

    {#if loading}
      <p aria-busy="true">Caricamento...</p>
    {:else}
      <div class="status-box">
        <h3>Stato Attuale: <strong>{subscriptionStatus}</strong></h3>
        {#if trialEndsAt && subscriptionStatus !== 'active'}
          <p>La tua prova scade il: {new Date(trialEndsAt).toLocaleDateString('it-IT')}</p>
        {/if}
      </div>

      <div class="plan-details">
        <p>Tutti i tavoli che vuoi.<p>Tutte le prenotazioni che vuoi.<p>Tutti i clienti che hai.</p>
        <p class="zen-motto">Restando ZEN.</p>
      </div>

      {#if subscriptionStatus === 'active'}
        <button disabled>Abbonamento Attivo</button>
      {:else if !hasUsedTrial}
        <button on:click={handleSubscribeClick} class="contrast" disabled={loading}>
          {loading ? 'Attendere...' : 'Inizia la Prova Gratuita'}
        </button>
      {:else}
        <button on:click={handleSubscribeClick} class="contrast" disabled={loading}>
          {loading ? 'Attendere...' : 'Abbonati Ora (29€/mese)'}
        </button>
      {/if}
    {/if}
  </article>
</main>

<style>
  main { display: grid; place-items: center; min-height: 100vh; }
  article { text-align: center; width: 100%; max-width: 500px; padding: 2rem; position: relative; }
  .logo { display: block; margin: 0 auto 1rem; width: 80px; }
  .back-link { position: absolute; top: 1.5rem; left: 1.5rem; color: var(--muted-color); }
  hgroup { margin-bottom: 2rem; }
  h1 { font-size: 1.5rem; }
  h2 { font-weight: 300; color: var(--muted-color); font-size: 1.1rem; }
  .accent { color: var(--primary); font-weight: 700; }
  
  .status-box {
    padding: 1rem;
    border: 1px solid var(--border-color);
    border-radius: var(--pico-border-radius);
    margin-bottom: 2rem;
    background-color: #f8f9fa;
  }
  .status-box h3 {
      margin: 0;
      font-size: 1rem;
  }
   .status-box p {
      margin: 0.5rem 0 0 0;
      font-size: 0.9rem;
  }
  .status-box strong {
    color: var(--primary);
  }

  .plan-details { margin-bottom: 2.5rem; line-height: 1.6; }
  .zen-motto { font-weight: 700; font-size: 1.2rem; margin-top: 1rem; }
  button {
      width: 100%;
      --pico-font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      background-color: var(--text-color);
      border-color: var(--text-color);
  }
  button:hover { background-color: #343a40; border-color: #343a40; }
</style>
