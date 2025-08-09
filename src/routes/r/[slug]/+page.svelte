<script>
  export let data;
  let { ristorante, prenotazioni } = data;
  
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';

  let bookingData = {
    date: new Date().toISOString().split('T')[0],
    time: '',
    guests: 2,
    name: '',
    phone: ''
  };
  
  let loading = false;
  let message = { text: '', type: '' };
  let timeSlots = [];
  let availability = {};
  let totalCapacity = 0;

  function calculateTotalCapacity() {
    totalCapacity = ristorante.tavoli.reduce((acc, table) => acc + table.posti, 0);
  }

  function generateAvailableSlots() {
    const dateParts = bookingData.date.split('-').map(Number);
    const localDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const dayOfWeek = localDate.getDay();
    const dayIndex = dayOfWeek === 0 ? 7 : dayOfWeek;
    const schedule = ristorante.orari.find(o => o.giorno_settimana === dayIndex);
    
    timeSlots = [];
    bookingData.time = '';
    if (!schedule) return;

    const addSlots = (start, end) => {
      if (!start || !end) return;
      let [h_start, m_start] = start.split(':').map(Number);
      let [h_end, m_end] = end.split(':').map(Number);
      if (h_end < h_start) h_end += 24;
      
      let currentTime = new Date(bookingData.date + 'T00:00:00');
      currentTime.setHours(h_start, m_start, 0, 0);
      const endTime = new Date(bookingData.date + 'T00:00:00');
      endTime.setHours(h_end, m_end, 0, 0);
      
      const now = new Date();
      const isToday = new Date(bookingData.date).toDateString() === now.toDateString();

      while (currentTime < endTime) {
        if (!(isToday && currentTime < now)) {
          timeSlots.push(currentTime.toTimeString().substring(0, 5));
        }
        currentTime.setMinutes(currentTime.getMinutes() + 15);
      }
    };

    addSlots(schedule.pranzo_apertura, schedule.pranzo_chiusura);
    addSlots(schedule.cena_apertura, schedule.cena_chiusura);
  }
  
  function calculateAvailability() {
    const newAvailability = {};
    for (const slot of timeSlots) {
        const [hour, minute] = slot.split(':').map(Number);
        const slotTime = new Date(bookingData.date);
        slotTime.setHours(hour, minute, 0, 0);

        let occupiedSeats = 0;
        for (const booking of prenotazioni) {
            const startTime = new Date(booking.data_ora);
            const endTime = new Date(booking.data_ora_fine);
            if (slotTime >= startTime && slotTime < endTime) {
                occupiedSeats += booking.numero_coperti;
            }
        }
        newAvailability[slot] = totalCapacity - occupiedSeats;
    }
    availability = newAvailability;
  }

  async function loadDataAndCalculate() {
      const date = new Date(bookingData.date);
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      const day = date.getUTCDate();
      const startDate = new Date(Date.UTC(year, month, day)).toISOString();
      const endDate = new Date(Date.UTC(year, month, day + 1)).toISOString();
      
      const { data } = await supabase.from('prenotazioni')
          .select('tavolo_id, data_ora, data_ora_fine, numero_coperti')
          .eq('ristorante_id', ristorante.id)
          .gte('data_ora', startDate)
          .lt('data_ora', endDate);
      prenotazioni = data || [];
      
      generateAvailableSlots();
      calculateAvailability();
  }
  
  onMount(() => {
    calculateTotalCapacity();
    loadDataAndCalculate();
  });

  $: if (bookingData.guests) {
      calculateAvailability();
  }

  async function handleSubmit() {
    if (!bookingData.time) {
      setMessage('Per favore, seleziona un orario', 'error');
      return;
    }
    loading = true;
    setMessage('', '');
    
    const [hour, minute] = bookingData.time.split(':').map(Number);
    const bookingStart = new Date(bookingData.date);
    bookingStart.setHours(hour, minute, 0, 0);

    const durationHours = 1.5;
    const bookingEnd = new Date(bookingStart.getTime() + durationHours * 60 * 60 * 1000);

    const suitableTables = ristorante.tavoli.filter(t => t.posti >= bookingData.guests);
    const occupiedTableIds = new Set();
    for (const booking of prenotazioni) {
        const existingStart = new Date(booking.data_ora);
        const existingEnd = new Date(booking.data_ora_fine);
        if (bookingStart < existingEnd && bookingEnd > existingStart) {
            occupiedTableIds.add(booking.tavolo_id);
        }
    }
    const availableTable = suitableTables.find(t => !occupiedTableIds.has(t.id));

    if (!availableTable) {
        setMessage('Spiacenti, non ci sono tavoli disponibili per questa richiesta.', 'error');
        loading = false;
        return;
    }

    const { data: newBookingData, error } = await supabase.from('prenotazioni').insert({
      ristorante_id: ristorante.id,
      tavolo_id: availableTable.id,
      data_ora: bookingStart.toISOString(),
      data_ora_fine: bookingEnd.toISOString(),
      numero_coperti: bookingData.guests,
      nome_cliente: bookingData.name,
      telefono_cliente: bookingData.phone
    }).select().single();

    if (error) {
      setMessage(`Errore nel salvataggio: ${error.message}`, 'error');
    } else {
      setMessage('Prenotazione confermata! Invio notifica...', 'success');
      
      // Chiama la Edge Function per inviare la notifica
      const { error: funcError } = await supabase.functions.invoke('send-whatsapp-confirmation', {
          body: { booking: newBookingData }
      });

      if (funcError) {
          setMessage('Prenotazione salvata, ma errore invio notifica.', 'error');
      };

await supabase.functions.invoke('notify-restaurateur', {
    body: { booking: newBookingData }
});
      
      prenotazioni = [...prenotazioni, newBookingData];
      calculateAvailability();
    }
    loading = false;
  }

  function setMessage(text, type, duration = 5000) {
    message = { text, type };
    setTimeout(() => { message = { text: '', type: '' }; }, duration);
  }
</script>

<main class="container">
  <article>
    <header>
      <img src="/logo.png" alt="Logo Zentable" class="logo">
      <hgroup>
        <h1>{ristorante.nome}</h1>
        <h2>Effettua una prenotazione</h2>
      </hgroup>
    </header>

    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-grid">
        <label>
          Il Tuo Nome
          <input type="text" bind:value={bookingData.name} required>
        </label>
        <label>
          Il Tuo Telefono
          <input type="tel" bind:value={bookingData.phone} required>
        </label>
      </div>
      <div class="form-grid">
        <label>
          Data
          <input type="date" bind:value={bookingData.date} on:change={loadDataAndCalculate} required>
        </label>
        <label>
          Coperti
          <input type="number" bind:value={bookingData.guests} min="1" required>
        </label>
      </div>
      
      <div class="time-slots-section">
        <label>Seleziona un orario</label>
        <div class="time-slots-container">
          {#if timeSlots.length > 0}
            {#each timeSlots as slot}
              {@const availableSeats = availability[slot] ?? totalCapacity}
              <button 
                type="button" 
                class="time-slot-btn" 
                class:selected={bookingData.time === slot}
                disabled={availableSeats < bookingData.guests}
                on:click={() => bookingData.time = slot}
                title={availableSeats < bookingData.guests ? 'Non ci sono abbastanza posti' : `${availableSeats} posti liberi`}
              >
                {slot}
              </button>
            {/each}
          {:else}
            <p class="closed-notice">Nessun orario disponibile per la data selezionata.</p>
          {/if}
        </div>
      </div>

      <button type="submit" disabled={loading} class="contrast">
        {loading ? 'Invio in corso...' : 'Prenota il Tuo Tavolo'}
      </button>
    </form>
    
    {#if message.text}
      <div class="message {message.type}">{message.text}</div>
    {/if}
  </article>
</main>

<style>
  main { display: grid; place-items: center; min-height: 100svh; padding: 1rem; box-sizing: border-box; }
  article { width: 100%; max-width: 550px; margin: 0; padding: 1.5rem; }
  header { text-align: center; margin-bottom: 1.5rem; }
  .logo { width: 80px; margin-bottom: 1rem; }
  h1 { font-size: 1.5rem; }
  h2 { font-size: 1rem; font-weight: 300; color: var(--muted-color); }
  form { display: flex; flex-direction: column; gap: 1rem; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  label { text-align: left; font-size: 0.8rem; }
  input { font-size: 0.9rem; padding: 0.6rem; }
  .time-slots-section label { margin-bottom: 0.5rem; display: block; }
  .time-slots-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 0.75rem;
  }
  .time-slot-btn {
    padding: 0.75rem 0.5rem;
    font-size: 1rem;
    font-weight: 700;
  }
  .time-slot-btn:disabled {
    background-color: var(--pico-form-element-disabled-background-color);
    border-color: var(--pico-form-element-disabled-border-color);
    color: var(--pico-form-element-disabled-color);
    cursor: not-allowed;
  }
  .time-slot-btn.selected,
  .time-slot-btn:active,
  .time-slot-btn:focus {
    background-color: var(--primary) !important;
    border-color: var(--primary) !important;
    color: var(--text-on-dark) !important;
    box-shadow: none !important;
  }
  .closed-notice { font-size: 0.9rem; width: 100%; text-align: center; padding: 1rem; background-color: #f7f7f7; border-radius: var(--pico-border-radius); }
  button[type="submit"] { margin-top: 1rem; }
  .message { padding: 10px; border-radius: 5px; margin-top: 1rem; text-align: center; }
  .message.success { background-color: #d4edda; color: #155724; }
  .message.error { background-color: #f8d7da; color: #721c24; }
  @media(max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
</style>
