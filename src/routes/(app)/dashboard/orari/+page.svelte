<script>
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';

  let schedule = [];
  const daysOfWeek = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  let loading = true;
  let message = '';
  let restaurantId;

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: restaurantData } = await supabase
      .from('ristoranti').select('id').eq('user_id', session.user.id).single();

    if (restaurantData) {
      restaurantId = restaurantData.id;
      const { data: scheduleData } = await supabase.from('orari').select().eq('ristorante_id', restaurantId);

      if (scheduleData && scheduleData.length > 0) {
        schedule = scheduleData.sort((a, b) => a.giorno_settimana - b.giorno_settimana);
      } else {
        // Crea un orario di default (tutto chiuso) se non esiste
        schedule = daysOfWeek.map((_, index) => ({
          giorno_settimana: index + 1,
          pranzo_apertura: null, pranzo_chiusura: null,
          cena_apertura: null, cena_chiusura: null,
          ristorante_id: restaurantId
        }));
      }
    }
    loading = false;
  });

  async function handleSaveSchedule() {
    loading = true;
    // Pulisce i dati prima di salvare: se un orario è vuoto, lo salva come null
    const cleanedSchedule = schedule.map(day => ({
        ...day,
        pranzo_apertura: day.pranzo_apertura || null,
        pranzo_chiusura: day.pranzo_chiusura || null,
        cena_apertura: day.cena_apertura || null,
        cena_chiusura: day.cena_chiusura || null,
    }));

    const { error } = await supabase.from('orari').upsert(cleanedSchedule, { onConflict: 'ristorante_id, giorno_settimana' });

    if (error) {
      message = 'Errore nel salvataggio: ' + error.message;
    } else {
      message = 'Orari salvati con successo!';
    }
    loading = false;
  }
</script>

<div class="schedule-container">
  <h1>Gestione Orari di Apertura</h1>
  <p>Imposta gli orari per ogni giorno. Lascia i campi vuoti per indicare un turno o un giorno di chiusura.</p>

  {#if loading}
    <p>Caricamento...</p>
  {:else}
    <div class="schedule-grid">
      {#each daysOfWeek as day, i}
        {@const daySchedule = schedule.find(s => s.giorno_settimana === i + 1) || {}}
        <div class="day-row">
          <strong class="day-name">{day}</strong>
          <div class="shifts">
            <div class="shift-group">
              <span>Turno 1:</span>
              <input type="time" bind:value={daySchedule.pranzo_apertura}>
              <span>-</span>
              <input type="time" bind:value={daySchedule.pranzo_chiusura}>
            </div>
            <div class="shift-group">
              <span>Turno 2 (opz.):</span>
              <input type="time" bind:value={daySchedule.cena_apertura}>
              <span>-</span>
              <input type="time" bind:value={daySchedule.cena_chiusura}>
            </div>
          </div>
        </div>
      {/each}
    </div>
    <button on:click={handleSaveSchedule} disabled={loading}>
      {loading ? 'Salvataggio...' : 'Salva Orari'}
    </button>
  {/if}

  {#if message}
    <p class="message">{message}</p>
  {/if}
</div>

<style>
  .schedule-container { max-width: 700px; margin: 40px auto; font-family: sans-serif; }
  .schedule-grid { margin-bottom: 20px; border: 1px solid #eee; border-radius: 8px; }
  .day-row { display: grid; grid-template-columns: 100px 1fr; align-items: center; padding: 15px; border-bottom: 1px solid #eee; gap: 15px; }
  .day-row:last-child { border-bottom: none; }
  .day-name { font-size: 1.1rem; }
  .shifts { display: flex; flex-direction: column; gap: 10px; }
  .shift-group { display: flex; align-items: center; gap: 10px; }
  input[type="time"] { padding: 5px; }
  button { width: 100%; padding: 12px; font-size: 1rem; cursor: pointer; }
  .message { margin-top: 1rem; }
</style>
