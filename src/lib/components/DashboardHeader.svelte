<script>
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let nome_proprietario = '';

  onMount(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: restaurantData } = await supabase
            .from('ristoranti')
            .select('nome_proprietario')
            .eq('user_id', user.id)
            .single();

        if (restaurantData && restaurantData.nome_proprietario) {
            nome_proprietario = restaurantData.nome_proprietario;
        } else {
            nome_proprietario = user.email.split('@')[0];
        }
    }
  });

  async function handleLogout() {
    await supabase.auth.signOut();
    goto('/login');
  }
</script>

<nav class="container-fluid">
  <ul>
    <li><a href="/dashboard"><img src="/logo.png" alt="Zentable Logo" class="nav-logo"></a></li>
  </ul>
  <ul>
    <li>
      <details class="dropdown">
        <summary role="button" class="secondary outline">
          Ciao, {nome_proprietario}
        </summary>
        <ul dir="rtl">
          <li><a href="/dashboard/impostazioni">Impostazioni</a></li>
          <li><a href="/dashboard/abbonamento">Abbonamento</a></li>
          <li><hr></li>
          <li><a href="#" on:click|preventDefault={handleLogout}>Logout</a></li>
        </ul>
      </details>
    </li>
  </ul>
</nav>

<style>
  .nav-logo {
    height: 80px;
    width: auto;
  }
  .dropdown ul {
      min-width: 200px;
  }
</style>
