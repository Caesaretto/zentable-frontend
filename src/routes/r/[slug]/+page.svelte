<script>
  export let data;
  const { ristorante } = data;

  import { supabase } from '$lib/supabaseClient';

  let bookingData = {
    date: new Date().toISOString().split('T')[0],
    time: '', // L'ora verrà scelta cliccando un pulsante
    guests: 2,
    name: '',
    phone: ''
  };

  let loading = false;
  let message = { text: '', type: '' };
  let timeSlots = [];

  // Funzione per generare gli slot orari disponibili
  function generateAvailableSlots() {
    const dayOfWeek = new Date(bookingData.date).getUTCDay();
    const dayIndex = dayOfWeek === 0 ? 7 : dayOfWeek;
    const schedule = ristorante.orari.find(o => o.giorno_settimana === dayIndex);

    timeSlots = [];
    if (!schedule) return;

    const addSlots = (start, end) => {
      if (!start || !end) return;
      let [h_start, m_start] = start.split(':').map(Number);
      let [h_end, m_end] = end.split(':').map(Number);
      if (h_end < h_start) h_end += 24;

      let currentTime = new Date();
      currentTime.setHours(h_start, m_start, 0, 0);
      const endTime = new Date();
      endTime.setHours(h_end, m_end, 0, 0);

      while (currentTime < endTime) {
        timeSlots.push(currentTime.toTimeString().substring(0, 5));
        currentTime.setMinutes(currentTime.getMinutes() + 15); // Slot ogni 15 min
      }
    };

    addSlots(schedule.pranzo_apertura, schedule.pranzo_chiusura);
    addSlots(schedule.cena_apertura, schedule.cena_chiusura);
  }

  async function handleSubmit() {
    if (!bookingData.time) {
      setMessage('Per favore, seleziona un orario', 'error');
      return;
    }
    loading = true;
    setMessage('', '');

    const [hour, minute] = bookingData.time.split(':');
    const bookingDateTime = new Date(bookingData.date);
    bookingDateTime.setHours(hour, minute, 0, 0);

    const durationHours = 1.5;
    const endTime = new Date(bookingDateTime.getTime() + durationHours * 60 * 60 * 1000);

    const { error } = await supabase.from('prenotazioni').insert({
      ristorante_id: ristorante.id,
      data_ora: bookingDateTime.toISOString(),
      data_ora_fine: endTime.toISOString(),
      numero_coperti: bookingData.guests,
      nome_cliente: bookingData.name,
      telefono_cliente: bookingData.phone
    });

    if (error) {
      setMessage(`Errore: ${error.message}`, 'error');
    } else {
      setMessage('Prenotazione confermata! Grazie.', 'success');
    }
    loading = false;
  }

  function setMessage(text, type, duration = 5000) {
    message = { text, type };
    setTimeout(() => { message = { text: '', type: '' }; }, duration);
  }

  // Calcola gli slot disponibili al primo caricamento
  generateAvailableSlots();
</script>

<div class="booking-page">
  <header>
    <h1>Benvenuto da {ristorante.nome}</h1>
    <p>{ristorante.indirizzo}</p>
    <p>Tel: {ristorante.telefono}</p>
  </header>

  <main>
    <h2>Effettua una Prenotazione</h2>
    <form class="booking-form" on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label for="name">Il tuo Nome</label>
        <input type="text" id="name" bind:value={bookingData.name} required>
      </div>
      <div class="form-group">
        <label for="phone">Il tuo Telefono</label>
        <input type="tel" id="phone" bind:value={bookingData.phone} required>
      </div>
      <div class="form-group-inline">
        <div class="form-group">
          <label for="date">Data</label>
          <input type="date" id="date" bind:value={bookingData.date} on:change={generateAvailableSlots} required>
        </div>
        <div class="form-group">
          <label for="guests">Coperti</label>
          <input type="number" id="guests" bind:value={bookingData.guests} min="1" required>
        </div>
      </div>

      <div class="form-group">
        <label>Seleziona un orario</label>
        <div class="time-slots-container">
          {#if timeSlots.length > 0}
            {#each timeSlots as slot}
              <button 
                type="button" 
                class="time-slot-btn" 
                class:selected={bookingData.time === slot}
                on:click={() => bookingData.time = slot}
              >
                {slot}
              </button>
            {/each}
          {:else}
            <p>Nessun orario disponibile per la data selezionata. Il locale potrebbe essere chiuso.</p>
          {/if}
        </div>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Invio in corso...' : 'Prenota il Tuo Tavolo'}
      </button>
    </form>

    {#if message.text}
      <div class="message {message.type}">{message.text}</div>
    {/if}
  </main>
</div>

<style>
  .booking-page { max-width: 600px; margin: 40px auto; font-family: sans-serif; }
  header { text-align: center; margin-bottom: 40px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
  .booking-form { display: grid; gap: 20px; }
  .form-group { display: flex; flex-direction: column; }
  .form-group-inline { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  label { margin-bottom: 5px; font-size: 0.9rem; color: #555; }
  input { padding: 10px; border: 1px solid #ccc; border-radius: 5px; }
  button { padding: 12px; background-color: #007bff; color: white; border: none; border-radius: 5px; font-size: 1rem; cursor: pointer; }
  .time-slots-container { display: flex; flex-wrap: wrap; gap: 10px; }
  .time-slot-btn { background-color: #f0f0f0; border: 1px solid #ccc; padding: 8px 12px; border-radius: 5px; cursor: pointer; }
  .time-slot-btn.selected { background-color: #007bff; color: white; border-color: #0056b3; }
  .message { padding: 10px; border-radius: 5px; margin-top: 20px; text-align: center; }
  .message.success { background-color: #d4edda; color: #155724; }
  .message.error { background-color: #f8d7da; color: #721c24; }
</style>
