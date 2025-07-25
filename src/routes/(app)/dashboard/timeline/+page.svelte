<script>
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';

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
  let message = { text: '', type: '' };

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
    selectedShift = (schedule.pranzo_apertura) ? 1 : 2;

    const startDate = `${selectedDate} 00:00:00`;
    const endDate = `${selectedDate} 23:59:59`;
    const { data: bookingsData } = await supabase.from('prenotazioni')
      .select().eq('ristorante_id', restaurantId)
      .gte('data_ora', startDate).lte('data_ora', endDate);

    bookings = bookingsData || [];
    updateTimelineView();
    loading = false;
  }

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: restaurantData } = await supabase.from('ristoranti')
      .select('id').eq('user_id', session.user.id).single();

    if (restaurantData) {
      restaurantId = restaurantData.id;
      const { data: tablesData } = await supabase.from('tavoli').select().eq('ristorante_id', restaurantId).order('nome');
      if (tablesData) tables = tablesData;
      await loadDataForDate();
    } else {
      loading = false;
    }
  });

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

  function handleBookingClick(booking) {
    const startTime = new Date(booking.data_ora);
    const endTime = new Date(booking.data_ora_fine);
    const durationMinutes = (endTime - startTime) / (1000 * 60);
    const durataOre = durationMinutes / 60;

    selectedBooking = {...booking, durata: durataOre};
    showEditModal = true;
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
        setMessage('Errore: ' + error.message, 'error');
    } else {
        setMessage('Prenotazione salvata!', 'success');
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
        setMessage('Errore: ' + error.message, 'error');
    } else {
        setMessage('Prenotazione aggiornata!', 'success');
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
        setMessage('Errore: ' + error.message, 'error');
    } else {
        setMessage('Prenotazione cancellata!', 'success');
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

  // --- LA FUNZIONE CORRETTA ---
  function calculateSpan(booking, startIndex) {
    if (!booking.data_ora_fine) return 1;
    const startTime = new Date(booking.data_ora);
    const endTime = new Date(booking.data_ora_fine);
    const durationMinutes = (endTime - startTime) / (1000 * 60);
    const span = Math.max(1, Math.round(durationMinutes / 30));

    // Calcola quanti slot mancano fino alla fine della griglia
    const remainingSlots = timeSlots.length - startIndex;

    // Usa il valore più piccolo tra la durata reale e gli slot rimanenti
    return Math.min(span, remainingSlots);
  }
  // --- FINE CORREZIONE ---

  function setMessage(text, type, duration = 3000) {
    message = { text, type };
    setTimeout(() => {
      message = { text: '', type: '' };
    }, duration);
  }
</script>

{#if showCreateModal}
  <div class="modal-overlay" on:click={() => showCreateModal = false}>
    <div class="modal-content" on:click|stopPropagation>
      <h2>Nuova Prenotazione</h2>
      <p>
        Tavolo: {tables.find(t => t.id === newBooking.tavolo_id)?.nome} <br>
        Data: {new Date(newBooking.data_ora).toLocaleString()}
      </p>
      <form on:submit|preventDefault={handleSaveBooking}>
        <div class="form-group">
          <label for="nome">Nome Cliente</label>
          <input id="nome" type="text" bind:value={newBooking.nome_cliente} required>
        </div>
        <div class="form-group-inline">
          <div class="form-group">
            <label for="coperti">Coperti</label>
            <input id="coperti" type="number" bind:value={newBooking.numero_coperti} min="1" required>
          </div>
          <div class="form-group">
            <label for="durata">Durata (ore)</label>
            <input id="durata" type="number" bind:value={newBooking.durata} min="0.5" step="0.5" required>
          </div>
        </div>
        <div class="form-group">
          <label for="telefono">Telefono</label>
          <input id="telefono" type="tel" bind:value={newBooking.telefono_cliente}>
        </div>
         <div class="form-group">
          <label for="note">Note</label>
          <textarea id="note" bind:value={newBooking.note}></textarea>
        </div>
        <button type="submit" disabled={loading}>{loading ? 'Salvataggio...' : 'Salva Prenotazione'}</button>
      </form>
    </div>
  </div>
{/if}

{#if showEditModal}
   <div class="modal-overlay" on:click={() => showEditModal = false}>
    <div class="modal-content" on:click|stopPropagation>
      <h2>Dettagli Prenotazione</h2>
       <form on:submit|preventDefault={handleUpdateBooking}>
        <div class="form-group">
          <label for="edit-nome">Nome Cliente</label>
          <input id="edit-nome" type="text" bind:value={selectedBooking.nome_cliente} required>
        </div>
         <div class="form-group-inline">
            <div class="form-group">
              <label for="edit-coperti">Coperti</label>
              <input id="edit-coperti" type="number" bind:value={selectedBooking.numero_coperti} min="1" required>
            </div>
            <div class="form-group">
              <label for="edit-durata">Durata (ore)</label>
              <input id="edit-durata" type="number" bind:value={selectedBooking.durata} min="0.5" step="0.5" required>
            </div>
        </div>
        <div class="form-group">
          <label for="edit-telefono">Telefono</label>
          <input id="edit-telefono" type="tel" bind:value={selectedBooking.telefono_cliente}>
        </div>
         <div class="form-group">
          <label for="edit-note">Note</label>
          <textarea id="edit-note" bind:value={selectedBooking.note}></textarea>
        </div>
        <div class="button-group">
            <button type="submit" disabled={loading}>{loading ? 'Salvataggio...' : 'Aggiorna Prenotazione'}</button>
            <button type="button" class="delete" on:click={handleDeleteBooking} disabled={loading}>Cancella</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<div class="timeline-container">
  <h1>Timeline Prenotazioni</h1>
  <div class="controls">
      <input type="date" bind:value={selectedDate} on:change={loadDataForDate}>
      {#if schedule.pranzo_apertura}
        <button on:click={() => { selectedShift = 1; updateTimelineView(); }} class:active={selectedShift === 1}>
          Turno 1 ({schedule.pranzo_apertura} - {schedule.pranzo_chiusura})
        </button>
      {/if}
      {#if schedule.cena_apertura}
        <button on:click={() => { selectedShift = 2; updateTimelineView(); }} class:active={selectedShift === 2}>
          Turno 2 ({schedule.cena_apertura} - {schedule.cena_chiusura})
        </button>
      {/if}
    </div>

  {#if message.text}
    <p class="message {message.type}">{message.text}</p>
  {/if}

  {#if loading && bookings.length === 0}
    <p>Caricamento timeline...</p>
  {:else if timeSlots.length === 0}
    <p>Nessun turno aperto per il giorno selezionato, oppure nessun orario impostato.</p>
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
</div>

<style>
  .timeline-container { padding: 20px; font-family: sans-serif; }
  .controls { margin-bottom: 20px; display: flex; gap: 10px; align-items: center; }
  .controls button { padding: 8px 16px; border: 1px solid #ccc; background-color: #f7f7f7; cursor: pointer; border-radius: 5px;}
  .controls button.active { background-color: #007bff; color: white; border-color: #007bff; }

  .timeline-wrapper { overflow-x: auto; border: 1px solid #ccc; }
  .timeline-grid { 
    display: grid; 
    grid-template-columns: 120px repeat(var(--time-slots), minmax(120px, 1fr)); 
    gap: 1px; 
    background-color: #ccc; 
  }

  .header-cell { 
    background-color: #f8f9fa; 
    padding: 10px; 
    text-align: center; 
    font-weight: bold; 
    position: sticky; 
    top: 0;
    z-index: 2;
  }

  .table-name { 
    background-color: #f8f9fa;
    text-align: right; 
    padding: 10px 15px; 
    font-weight: bold; 
    position: sticky; 
    left: 0;
    z-index: 1;
  }

  .grid-cell { 
    background-color: white; 
    min-height: 40px; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    font-size: 12px;
    position: relative;
    z-index: 0;
    border: none;
    padding: 0;
  }

  .time-slot:hover { background-color: #e0efff; }

  .booking-cell { 
    background-color: #d4edda; 
    border: 1px solid #c3e6cb; 
    border-radius: 4px; 
    overflow: hidden; 
    white-space: nowrap; 
    text-overflow: ellipsis; 
    padding: 5px;
    width: 100%;
    box-sizing: border-box;
    grid-column-start: auto;
    justify-content: flex-start;
    cursor: pointer;
    text-align: left;
  }

  .message { padding: 10px; border-radius: 5px; margin: 10px 0; }
  .message.success { background-color: #d4edda; color: #155724; }
  .message.error { background-color: #f8d7da; color: #721c24; }

  .modal-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background-color: rgba(0,0,0,0.5); display: flex;
    justify-content: center; align-items: center; z-index: 10;
  }
  .modal-content {
    background-color: white; padding: 20px; border-radius: 8px;
    width: 90%; max-width: 500px;
  }
  .modal-content .form-group { margin-bottom: 15px; }
  .modal-content label { display: block; margin-bottom: 5px; }
  .modal-content input, .modal-content textarea { width: 100%; padding: 8px; box-sizing: border-box; }
  .form-group-inline { display: flex; gap: 15px; }
  .form-group-inline .form-group { flex: 1; }
  .button-group { display: flex; gap: 10px; margin-top: 20px;}
  .button-group button { flex: 1; }
  .button-group button.delete { background-color: #dc3545; }
</style>
