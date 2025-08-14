<script>
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';
  import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-svelte';

  let tables = [];
  let bookings = [];
  let schedule = {};
  let loading = true;
  let restaurantId;
  
  let selectedDate = new Date().toISOString().split('T')[0];
  let selectedShift = 1;
  let timeSlots = [];

  let showCreateModal = false;
  let showEditModal = false;
  let newBooking = {};
  let selectedBooking = {};
  let message = { show: false, text: '', type: '' };

  function goToPreviousDay() {
    const currentDate = new Date(selectedDate);
    currentDate.setUTCDate(currentDate.getUTCDate() - 1);
    selectedDate = currentDate.toISOString().split('T')[0];
    loadDataForDate();
  }

  function goToNextDay() {
    const currentDate = new Date(selectedDate);
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    selectedDate = currentDate.toISOString().split('T')[0];
    loadDataForDate();
  }

  function formatTime(timeString) {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  }

  function generateTimeSlots(start, end) {
    if (!start || !end) return [];
    const slots = [];
    let [h_start, m_start] = start.split(':').map(Number);
    let [h_end, m_end] = end.split(':').map(Number);
    if (h_end < h_start) h_end += 24;
    
    let currentTime = new Date();
    currentTime.setHours(h_start, m_start, 0, 0);
    const endTime = new Date();
    endTime.setHours(h_end, m_end, 0, 0);
    
    while (currentTime < endTime) {
      slots.push(currentTime.toTimeString().substring(0, 5));
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }
    return slots;
  }

  function updateTimelineView() {
    if (selectedShift === 1) {
      timeSlots = generateTimeSlots(schedule.pranzo_apertura, schedule.pranzo_chiusura);
    } else {
      timeSlots = generateTimeSlots(schedule.cena_apertura, schedule.cena_chiusura);
    }
  }

  async function loadDataForDate() {
    loading = true;
    const dayOfWeek = new Date(selectedDate).getUTCDay();
    const dayIndex = dayOfWeek === 0 ? 7 : dayOfWeek;

    const { data: scheduleData } = await supabase.from('orari')
      .select().eq('ristorante_id', restaurantId).eq('giorno_settimana', dayIndex).single();
    
    schedule = scheduleData || {};
    
    if (!((selectedShift === 1 && schedule.pranzo_apertura) || (selectedShift === 2 && schedule.cena_apertura))) {
        selectedShift = (schedule.pranzo_apertura) ? 1 : 2;
    }

    const startDate = `${selectedDate} 00:00:00`;
    const endDate = `${selectedDate} 23:59:59`;
    const { data: bookingsData } = await supabase.from('prenotazioni')
      .select('*, tavoli(nome)')
      .eq('ristorante_id', restaurantId)
      .gte('data_ora', startDate).lte('data_ora', endDate);
    
    bookings = bookingsData?.filter(b => b.tavolo_id) || [];
    
    updateTimelineView();
    loading = false;
  }

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: restaurantData } = await supabase.from('ristoranti')
        .select('id').eq('user_id', session.user.id).single();
      
      if (restaurantData) {
        restaurantId = restaurantData.id;
        const { data: tablesData } = await supabase.from('tavoli').select().eq('ristorante_id', restaurantId);
        
        if (tablesData) {
            tables = tablesData.sort((a, b) => 
              a.nome.localeCompare(b.nome, undefined, { numeric: true, sensitivity: 'base' })
            );
        }
        await loadDataForDate();
      } else {
        loading = false;
      }
    } else {
        loading = false;
    }
  });
  
  function handleBookingClick(booking) {
    const startTime = new Date(booking.data_ora);
    const endTime = new Date(booking.data_ora_fine);
    const durationMinutes = (endTime - startTime) / (1000 * 60);
    const durataOre = durationMinutes / 60;
    selectedBooking = {...booking, durata: durataOre};
    showEditModal = true;
  }

  function handleSlotClick(tableId, time) {
    const [hour, minute] = time.split(':');
    const bookingDateTime = new Date(selectedDate);
    bookingDateTime.setHours(hour, minute, 0, 0);

    newBooking = {
      tavolo_id: tableId,
      data_ora: bookingDateTime.toISOString(),
      nome_cliente: '',
      numero_coperti: tables.find(t => t.id === tableId)?.posti || 2,
      telefono_cliente: '',
      note: '',
      durata: 1.5
    };
    showCreateModal = true;
  }
  
  async function handleSaveBooking() {
    loading = true;
    const startTime = new Date(newBooking.data_ora);
    const endTime = new Date(startTime.getTime() + newBooking.durata * 60 * 60 * 1000);
    
    const { error } = await supabase.from('prenotazioni').insert({
        ristorante_id: restaurantId,
        tavolo_id: newBooking.tavolo_id,
        data_ora: newBooking.data_ora,
        data_ora_fine: endTime.toISOString(),
        nome_cliente: newBooking.nome_cliente,
        numero_coperti: newBooking.numero_coperti,
        telefono_cliente: newBooking.telefono_cliente,
        note: newBooking.note
    });

    if (error) {
        showNotification('Errore: ' + error.message, 'error');
    } else {
        showNotification('Prenotazione salvata!', 'success');
        showCreateModal = false;
        await loadDataForDate();
    }
    loading = false;
  }
  
  async function handleUpdateBooking() {
    loading = true;
    const startTime = new Date(selectedBooking.data_ora);
    const endTime = new Date(startTime.getTime() + selectedBooking.durata * 60 * 60 * 1000);

    const { error } = await supabase.from('prenotazioni')
        .update({
            nome_cliente: selectedBooking.nome_cliente,
            numero_coperti: selectedBooking.numero_coperti,
            telefono_cliente: selectedBooking.telefono_cliente,
            note: selectedBooking.note,
            data_ora_fine: endTime.toISOString()
        })
        .eq('id', selectedBooking.id);

    if (error) {
        showNotification('Errore: ' + error.message, 'error');
    } else {
        showNotification('Prenotazione aggiornata!', 'success');
        showEditModal = false;
        await loadDataForDate();
    }
    loading = false;
  }

  async function handleDeleteBooking() {
    if (!confirm('Sei sicuro di voler cancellare questa prenotazione?')) return;
    
    loading = true;
    const { error } = await supabase.from('prenotazioni').delete().eq('id', selectedBooking.id);

    if (error) {
        showNotification('Errore: ' + error.message, 'error');
    } else {
        showNotification('Prenotazione cancellata!', 'success');
        showEditModal = false;
        await loadDataForDate();
    }
    loading = false;
  }

  function findBookingThatStartsAt(tableId, time) {
    return bookings.find(b => {
      if (b.tavolo_id !== tableId) return false;
      const bookingTime = new Date(b.data_ora);
      const [hour, minute] = time.split(':');
      return bookingTime.getHours() == hour && bookingTime.getMinutes() == minute;
    });
  }

  function isSlotCovered(tableId, time) {
    const [hour, minute] = time.split(':');
    const slotTime = new Date(selectedDate);
    slotTime.setHours(hour, minute, 0, 0);

    return bookings.some(b => {
      if (b.tavolo_id !== tableId || !b.data_ora_fine) return false;
      const startTime = new Date(b.data_ora);
      const endTime = new Date(b.data_ora_fine);
      return startTime < slotTime && slotTime < endTime;
    });
  }

  function calculateSpan(booking, startIndex) {
    if (!booking.data_ora_fine) return 1;
    const startTime = new Date(booking.data_ora);
    const endTime = new Date(booking.data_ora_fine);
    const durationMinutes = (endTime - startTime) / (1000 * 60);
    const span = Math.max(1, Math.round(durationMinutes / 30));
    const remainingSlots = timeSlots.length - startIndex;
    return Math.min(span, remainingSlots);
  }

  function showNotification(text, type, duration = 3000) {
    message = { show: true, text, type };
    setTimeout(() => { message = { show: false, text: '', type: '' }; }, duration);
  }
</script>

{#if message.show}
  <div class="toast {message.type}">{message.text}</div>
{/if}

<main class="container">
  <article>
    <hgroup>
      <h1>Timeline</h1>
      <h2>Visualizza e gestisci le tue prenotazioni.</h2>
    </hgroup>
  
    <div class="controls">
        <div class="control-item">
            <label for="date">Data</label>
            <div class="date-input-group">
                <button on:click={goToPreviousDay} class="icon-button" aria-label="Giorno precedente"><ChevronLeft size={20}/></button>
                <input type="date" id="date" bind:value={selectedDate} on:change={loadDataForDate}>
                <button on:click={goToNextDay} class="icon-button" aria-label="Giorno successivo"><ChevronRight size={20}/></button>
            </div>
        </div>
        
        {#if schedule.pranzo_apertura}
        <div class="control-item">
            <label>Turno 1</label>
            <button on:click={() => { selectedShift = 1; updateTimelineView(); }} class:active={selectedShift === 1}>
                {formatTime(schedule.pranzo_apertura)} - {formatTime(schedule.pranzo_chiusura)}
            </button>
        </div>
        {/if}
        {#if schedule.cena_apertura}
        <div class="control-item">
            <label>Turno 2</label>
            <button on:click={() => { selectedShift = 2; updateTimelineView(); }} class:active={selectedShift === 2}>
                {formatTime(schedule.cena_apertura)} - {formatTime(schedule.cena_chiusura)}
            </button>
        </div>
        {/if}
    </div>
    
    {#if loading}
      <p aria-busy="true">Caricamento...</p>
    {:else if timeSlots.length === 0}
      <div class="empty-state">Nessun turno aperto per il giorno selezionato.</div>
    {:else}
      <div class="timeline-wrapper">
        <div class="timeline-grid" style="--time-slots: {timeSlots.length};">
          <div class="header-cell table-header">Tavoli</div>
          {#each timeSlots as time}
            <div class="header-cell time-header">{time}</div>
          {/each}

          {#each tables as table (table.id)}
            <div class="header-cell table-name">{table.nome} ({table.posti}p)</div>
            {#each timeSlots as time, i}
              {@const startingBooking = findBookingThatStartsAt(table.id, time)}
              {#if startingBooking}
                <button 
                  class="grid-cell booking-cell" 
                  title={startingBooking.note}
                  style="grid-column: span {calculateSpan(startingBooking, i)};"
                  on:click={() => handleBookingClick(startingBooking)}
                >
                  {startingBooking.nome_cliente} ({startingBooking.numero_coperti}p)
                </button>
              {:else if !isSlotCovered(table.id, time)}
                <button class="grid-cell time-slot" on:click={() => handleSlotClick(table.id, time)}></button>
              {/if}
            {/each}
          {/each}
        </div>
      </div>
    {/if}
  </article>
</main>

<style>
  main { display: grid; place-items: center; min-height: 100svh; padding: 1rem; }
  article { 
    position: relative; 
    width: 100%; 
    max-width: 95%; 
    height: 95vh; 
    margin: 0; 
    padding: 1rem 1.5rem; 
    display: flex; 
    flex-direction: column; 
  }
  hgroup { margin-bottom: 1rem; text-align: center; }
  h1 { font-size: 1.5rem; }
  h2 { font-weight: 300; color: var(--muted-color); font-size: 1rem; }
  
.controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    align-items: flex-end;
    margin-bottom: 1rem;
  }
  .control-item {
      display: flex;
      flex-direction: column;
  }
  .control-item label {
      font-size: 0.8rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
      display: block;
      text-align: left;
  }
  
  .date-input-group {
    display: flex;
  }
  
  .date-input-group input, .date-input-group button, .shift-button {
      height: 45px; /* Altezza uniforme e ridotta */
      box-sizing: border-box;
      padding: 0.5rem;
      font-size: 0.9rem;
      margin: 0;
  }

  .date-input-group input {
      flex-grow: 1;
      border-radius: 0;
      text-align: center;
  }
  
  .icon-button {
      width: 45px; /* Larghezza fissa e ridotta */
      flex-shrink: 0;
      border: 1px solid var(--border-color);
      background-color: var(--card-background-color);
      color: var(--text-color);
      display: grid;
      place-items: center;
  }
  .icon-button:first-child {
      border-right: none;
      border-radius: var(--pico-border-radius) 0 0 var(--pico-border-radius);
  }
   .icon-button:last-child {
      border-left: none;
      border-radius: 0 var(--pico-border-radius) var(--pico-border-radius) 0;
  }

  .shift-button {
    width: 100%;
    background-color: #f3f4f6;
    border: 1px solid var(--border-color);
    color: var(--text-color);
    border-radius: var(--pico-border-radius);
    font-weight: 700;
  }

  .shift-button.active {
    background-color: var(--primary);
    border-color: var(--primary);
    color: var(--text-on-dark);
  }

  .timeline-wrapper { overflow: auto; flex-grow: 1; border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color);}
  .timeline-grid { display: grid; grid-template-columns: 120px repeat(var(--time-slots), minmax(120px, 1fr)); gap: 1px; background-color: #ccc; }
  .header-cell { background-color: #f8f9fa; padding: 10px; text-align: center; font-weight: bold; position: sticky; top: 0; z-index: 3; }
  .table-name { background-color: #f8f9fa; text-align: right; padding: 10px 15px; font-weight: bold; position: sticky; left: 0; z-index: 2; }
  .grid-cell { position: relative; z-index: 1; background-color: white; min-height: 40px; display: flex; align-items: center; justify-content: center; font-size: 12px; border: none; padding: 0; cursor: pointer; }
  .time-slot:hover { background-color: #e0efff; }
  .booking-cell { background-color: var(--primary); border: 1px solid var(--primary-hover); color: var(--text-on-dark); text-transform: uppercase; font-weight: 700; overflow: hidden; justify-content: flex-start; text-align: left; padding: 5px; }
</style>
