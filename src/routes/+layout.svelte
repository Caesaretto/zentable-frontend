<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';

  let notification = { show: false, message: '' };

  onMount(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Questo si attiva quando l'utente conferma l'email
      if (event === 'SIGNED_IN' && session) {
        showNotification('Email confermata con successo! Verrai reindirizzato.');

        // Reindirizza alla pagina delle impostazioni del ristorante dopo 2 secondi
        setTimeout(() => {
          goto('/dashboard/impostazioni');
        }, 2000);
      }
    });

    // Pulisce il listener quando il componente viene distrutto
    return () => subscription.unsubscribe();
  });

  function showNotification(message) {
    notification = { show: true, message: message };
    setTimeout(() => {
      notification = { show: false, message: '' };
    }, 4000); // Il messaggio scompare dopo 4 secondi
  }
</script>

{#if notification.show}
  <div class="toast">
    {notification.message}
  </div>
{/if}

<slot />

<style>
  .toast {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #28a745;
    color: white;
    padding: 16px;
    border-radius: 8px;
    z-index: 100;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
</style>
