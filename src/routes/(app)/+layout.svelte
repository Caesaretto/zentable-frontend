<script>
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let session;

  onMount(async () => {
    const { data } = await supabase.auth.getSession();
    session = data.session;

    if (!session) {
      goto('/login');
    }
  });
</script>

{#if session}
  <slot />
{:else}
  <p>Caricamento...</p>
{/if}
