<script>
    import { page } from '$app/stores';
</script>

<nav>
  <ul>
    <li><a href="/"><img src="/logo.png" alt="Zentable Logo" class="nav-logo"></a></li>
  </ul>
  <ul>
    <li><a href="/#features">Come Funziona</a></li>
    <li><a href="/#pricing">Prezzi</a></li>
  </ul>
  <ul>
    {#if $page.data.session}
        <li><a href="/dashboard" role="button" class="contrast">La Tua ZENboard</a></li>
    {:else}
        <li><a href="/login">Accedi</a></li>
        <li><a href="/register" role="button">Prova Gratis</a></li>
    {/if}
  </ul>
</nav>

<style>
  .nav-logo {
    height: 35px;
    width: auto;
  }
</style>
