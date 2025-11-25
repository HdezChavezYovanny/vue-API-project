<script setup></script>

<template>
  <header>
    <div class="sticky-title">
      <h1>Vue View</h1>
    </div>
    <nav>
      <router-link to="/" class="nav-link home" aria-label="Home" title="Home">
        <svg class="icon" viewBox="0 0 24 18" width="18" height="18" fill="currentColor" aria-hidden="true">
          <path d="M12 3.3 2 9v11a1 1 0 0 0 1 1h6v-7h6v7h6a1 1 0 0 0 1-1V9l-10-5.7z"/>
        </svg>
        Inicio
      </router-link>
      <router-link to="/profeView" class="nav-link">Version del profesor</router-link>
      <router-link to="/myView" class="nav-link">Mi version mejorada</router-link>
      <router-link to="/VuetifyView" class="nav-link">Version con Vuetify</router-link>
    </nav>
  </header>
  

  <router-view/>
</template>

<style>
html, body {
  height: 100%;
}

body { 
  margin: 0; 
  background: #DCDCDC;
}


header {

  background: linear-gradient(135deg, #2D6CDF, #2256AE); /* AZUL PRINCIPAL */
}


.sticky-title {
  position: sticky;         
  padding-top: env(safe-area-inset-top, 0);
  top: 0;                 
  z-index: 1000;
  background: linear-gradient(135deg, #2D6CDF, #2256AE); 
  box-shadow: 0 5px 8px rgba(0, 0, 0, 0.3);
  height: 100px;
}

header h1 {
  color: white; 
  margin: 0;
  padding: 0.5rem 0;
  text-align: center;
  font-size: 3rem;
  text-shadow: 1px 1px 10px #F85A3E; /* NARANJA SECUNDARIO */
}

nav {
  padding: 1rem; 
  display: flex; 
  gap: 1rem; 
  align-items: center;
  background: #5090E0; /* Un tono de azul intermedio para la barra de navegación */
}

/* --- Estilos de Enlaces --- */
nav a {
  color: whitesmoke;
  text-decoration: none;
  transition: color 160ms ease, background-color 160ms ease, transform 160ms ease;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  display: inline-block;
  font-weight: 700;
}

nav a:hover,
nav a:focus-visible{
  color: white; 
  background: #F85A3E; /* NARANJA SECUNDARIO */
  transform: translateY(-2px);
  outline: none;
  box-shadow: 0 5px 4px rgba(0, 0, 0, 0.15);
}

nav a:active{
  transform: translateY(0);
  background: rgba(0, 0, 0, 0.15);
}

/* --- Estilos de Enlace Activo --- */
.router-link-active,
.router-link-exact-active {
  background: #F85A3E;   /* CAMBIO: Fondo NARANJA */
  color: white;          /* CAMBIO: Texto BLANCO */
  font-weight: 800; 
  transform: translateY(0px);
  box-shadow: 0 5px 6px rgba(0, 0, 0, 0.12);
}

</style>