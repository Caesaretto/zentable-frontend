<script>
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';
  import { ArrowLeft } from 'lucide-svelte';

  let schedule = [];
  const daysOfWeek = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  let loading = true;
  let message = { show: false, text: '', type: '' };
  let restaurantId;

  onMount(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: restaurantData } = await supabase
        .from('ristoranti').select('id').eq('user_id', user.id).single();
      
      if (restaurantData) {
        restaurantId = restaurantData.id;
        const { data: scheduleData } = await supabase.from('orari').select().eq('ristorante_id', restaurantId);

        schedule = daysOfWeek.map((_, index) => {
          const dayIndex = index + 1;
          const savedDay = scheduleData?.find(s => s.giorno_settimana === dayIndex);
          return savedDay || {
            giorno_settimana: dayIndex,
            is_closed: true,
            pranzo_apertura: null, pranzo_chiusura: null,
            cena_apertura: null, cena_chiusura: null,
            ristorante_id: restaurantId
          };
        });
      }
    }
    loading = false;
  });

  function showNotification(text, type, duration = 3000) {
    message = { show: true, text, type };
    setTimeout(() => { message = { show: false, text: '', type: '' }; }, duration);
  }

  async function handleSaveSchedule() {
    loading = true;
    const cleanedSchedule = schedule.map(day => {
        if (day.is_closed) {
            return { ...day, pranzo_apertura: null, pranzo_chiusura: null, cena_apertura: null, cena_chiusura: null };
        }
        return day;
    });
    
    const { error } = await supabase.from('orari').upsert(cleanedSchedule, { onConflict: 'ristorante_id, giorno_settimana' });

    if (error) {
      showNotification('Errore: ' + error.message, 'error');
    } else {
      showNotification('Orari salvati con successo!', 'success');
    }
    loading = false;
  }
</script>

{#if message.show}
  <div class="toast {message.type}">
    {message.text}
  </div>
{/if}

<main class="container">
  <article>
    <a href="/dashboard" class="back-link" aria-label="Torna alla dashboard">
      <ArrowLeft size={24}/>
    </a>
    <img src="/logo.png" alt="Logo Zentable" class="logo">
    
    <hgroup>
      <h1>Orari di Apertura</h1>
      <h2>Imposta i giorni e i turni di apertura del tuo locale.</h2>
    </hgroup>

    {#if loading}
      <p aria-busy="true">Caricamento...</p>
    {:else}
      <div class="schedule-grid">
        {#each daysOfWeek as day, i}
          {@const daySchedule = schedule[i]}
          <div class="day-row" class:closed={daySchedule.is_closed}>
            <strong class="day-name">{day}</strong>
            <div class="shifts">
              <div class="shift-group">
                <span>Turno 1:</span>
                <input type="time" bind:value={daySchedule.pranzo_apertura} disabled={daySchedule.is_closed}>
                <span>-</span>
                <input type="time" bind:value={daySchedule.pranzo_chiusura} disabled={daySchedule.is_closed}>
              </div>
              <div class="shift-group">
                <span>Turno 2:</span>
                <input type="time" bind:value={daySchedule.cena_apertura} disabled={daySchedule.is_closed}>
                <span>-</span>
                <input type="time" bind:value={daySchedule.cena_chiusura} disabled={daySchedule.is_closed}>
              </div>
            </div>
            <label class="closed-toggle">
              <input type="checkbox" role="switch" bind:checked={daySchedule.is_closed}>
              Chiuso
            </label>
          </div>
        {/each}
      </div>
      <button on:click={handleSaveSchedule} disabled={loading}>
        {loading ? 'Salvataggio...' : 'Salva Orari'}
      </button>
    {/if}
  </article>
</main>

<style>
  main {
    display: grid;
    place-items: center;
    min-height: 100svh;
    padding: 1rem;
    box-sizing: border-box;
  }
  article {
    position: relative;
    width: 100%;
    max-width: 800px;
    margin: 0;
    padding: 2rem;
  }
  .logo { display: block; margin: 0 auto 1rem; width: 80px; }
  .back-link { position: absolute; top: 1.5rem; left: 1.5rem; color: var(--muted-color); }
  hgroup { margin-bottom: 2rem; text-align: center; }
  h1 { font-size: 1.5rem; }
  h2 { font-weight: 300; color: var(--muted-color); font-size: 1rem; }
  
  .schedule-grid { margin-bottom: 2rem; }
  .day-row {
    display: grid;
    grid-template-columns: 120px 1fr auto;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--border-color);
    gap: 1.5rem;
    transition: opacity 0.3s;
  }
  .day-row:last-child { border-bottom: none; }
  .day-row.closed { opacity: 0.6; }
  
  .day-name { font-weight: 700; text-align: right; }
  .shifts { display: flex; flex-direction: column; gap: 0.75rem; }
  .shift-group { display: flex; align-items: center; gap: 0.5rem; }
  
  .closed-toggle {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8rem;
  }

  /* --- INIZIO CORREZIONE --- */
  article button {
      width: 100%;
      background-color: var(--primary);
      border-color: var(--primary);
      color: var(--text-on-dark);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 12px;
      font-size: 1rem;
  }

  article button:hover {
      background-color: var(--primary-hover);
      border-color: var(--primary-hover);
  }
  /* --- FINE CORREZIONE --- */

  input[type="checkbox"][role="switch"]:checked {
    background-color: var(--primary);
    border-color: var(--primary);
  }

  .toast {
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    padding: 1rem; border-radius: 8px; z-index: 100;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15); color: white;
  }
  .toast.success { background-color: #28a745; }
  .toast.error { background-color: var(--primary); }
</style>
