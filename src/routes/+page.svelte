<main class="container">
  
  <img src="/logo.png" alt="Logo Zentable" class="logo">
  
  <div class="headings">
    <h2>Gestisce le prenotazioni del tuo ristorante.</h2>
    <p class="tagline">Mentre tu resti <span class="accent">zen.</span></p>
  </div>
  
  <p class="description">
    Una piattaforma di gestione intelligente,<br>pensata per chi lavora da chi lavora (e resta zen).
  </p>

  <div class="cta-buttons">
    <a href="/register" class="btn-brush primary">
      <span>Diventa<br>Zen</span>
    </a>
    <a href="/login" class="btn-brush secondary">
      <span>Accedi</span>
    </a>
  </div>

</main>

<style>
  .container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    padding: 2rem;
    box-sizing: border-box;
    text-align: center;
  }

  .logo {
    width: 180px;
    height: auto;
    margin-bottom: 2rem;
  }

  .headings { margin-bottom: 1.5rem; }
  .headings h2 { font-size: 1.6rem; font-weight: 700; margin: 0; padding: 0; white-space: nowrap; }
  .tagline { font-size: 1.4rem; color: var(--muted-color); margin-top: 0.5rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 300; }
  .tagline .accent { color: var(--primary); font-weight: 700; }
  .description { font-size: 1rem; line-height: 1.6; margin-bottom: 1rem; }
  .cta-buttons { margin-top: 2rem; display: flex; gap: 2.5rem; align-items: center; }

  .btn-brush {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 180px;
    height: 180px;
    text-decoration: none;
    font-weight: 300;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    transition: transform 0.2s;
    line-height: 1.2;
    box-sizing: border-box;
    border: none;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }

  .btn-brush span {
    position: relative;
    z-index: 1;
  }

  .btn-brush:hover {
    transform: scale(1.05);
  }

  /* Pulsante SINISTRA (Registrati): Sfondo NERO, Testo ROSSO */
  .btn-brush.primary {
    background-image: url('/pennellata-nera.png');
    color: var(--primary);
  }

  /* Pulsante DESTRA (Accedi): Sfondo ROSSO, Testo NERO */
  .btn-brush.secondary {
    background-image: url('/pennellata-rossa.png');
    color: var(--text-color);
  }

  @media (max-width: 768px) {
    .headings h2 { white-space: normal; }
    .cta-buttons { flex-direction: column; gap: 2rem; }
    .logo, .btn-brush { width: 150px; height: 150px; }
  }
</style>
