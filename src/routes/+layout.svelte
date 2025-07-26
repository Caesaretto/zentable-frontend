<script>
  import '@picocss/pico/css/pico.min.css';
</script>

<slot />

<style global>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;700&display=swap');

  :root {
    --font-family: 'Poppins', sans-serif;
    --primary: #b91c1c; 
    --text-color: #212529;
    --text-on-dark: #fdfdfd;
    --muted-color: #6c757d;
    --background-color: #fdfdfd;
    --pico-font-family: var(--font-family);
  }

  :global(body, html) {
    height: 100%;
    margin: 0;
    padding: 0;
  }

  body {
    background-color: var(--background-color);
    /* Pattern a quadri più visibile */
    background-image:
      linear-gradient(rgba(0,0,0,0.15) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,0,0,0.15) 1px, transparent 1px);
    background-size: 30px 30px;
    font-family: var(--font-family);
    color: var(--text-color);
    font-weight: 300;
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
</style>
