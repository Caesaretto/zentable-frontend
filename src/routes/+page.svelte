<div class="hero-container">
  <main class="hero-content">
    <h1>Zentable</h1>
    <p class="tagline">Prenotazioni per ristoranti. Restando Zen.</p>
    <p class="description">
      Un gestionale semplice, visivo e senza fronzoli, pensato per chi lavora e non ha tempo da perdere.
    </p>
    <div class="cta-buttons">
      <a href="/register" class="btn btn-primary">Crea il Tuo Account Gratis</a>
      <a href="/login" class="btn btn-secondary">Già Cliente? Accedi</a>
    </div>
  </main>
</div>

<style>
  .hero-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
    text-align: center;
    font-family: sans-serif;
  }
  .hero-content {
    max-width: 600px;
    padding: 20px;
  }
  h1 {
    font-size: 4rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
  }
  .tagline {
    font-size: 1.5rem;
    color: #555;
    margin-top: 0;
    margin-bottom: 1.5rem;
  }
  .description {
    font-size: 1.1rem;
    color: #666;
    line-height: 1.6;
  }
  .cta-buttons {
    margin-top: 40px;
    display: flex;
    justify-content: center;
    gap: 20px;
  }
  .btn {
    display: inline-block;
    padding: 12px 24px;
    text-decoration: none;
    font-size: 1rem;
    border-radius: 8px;
    transition: transform 0.2s;
  }
  .btn:hover {
    transform: translateY(-2px);
  }
  .btn-primary {
    background-color: #007bff;
    color: white;
  }
  .btn-secondary {
    background-color: #f0f0f0;
    color: #333;
    border: 1px solid #ccc;
  }
</style>
