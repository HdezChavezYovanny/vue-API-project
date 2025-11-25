<script setup>

import { ref, computed, onMounted, watch } from "vue";
import { fetchStations } from "@/services/API/api.js";
import { haversineKm } from "../utils/geo.js";
import { FUEL_FIELDS } from "../utils/fuelFields.js";

import StationCard from "../components/GasStationCard.vue";

const all = ref([]);
const loading = ref(false);
const error = ref("");

// Variables para los campos de input (NO disparan la búsqueda automáticamente)
const inputLat = ref(40.4168);
const inputLon = ref(-3.7038);

// Variables que disparan la lógica de búsqueda (solo se actualizan al pulsar botón)
const searchLat = ref(40.4168);
const searchLon = ref(-3.7038);

const fuelKey = ref("Precio Gasolina 95 E5");
const radiusKm = ref(100);

const whitelist = ref([]);
const blacklist = ref([]);
const selectedBrand = ref("");

const page = ref(1);
const sortBy = ref("price");

async function loadData() {
  loading.value = true;
  try {
    all.value = await fetchStations();
  } catch {
    error.value = "Error al cargar datos.";
  }
  loading.value = false;
}
onMounted(loadData);

// --- Funciones para Ubicación ---

// Función que toma los valores de input y DISPARA la búsqueda
function useManualLocation() {
    searchLat.value = inputLat.value;
    searchLon.value = inputLon.value;
    page.value = 1; // Reset page on new search
}

function detectMyLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      // 1. Actualiza los campos de texto
      inputLat.value = position.coords.latitude;
      inputLon.value = position.coords.longitude;
      // 2. Dispara la búsqueda
      useManualLocation(); 
    }, () => {
      error.value = "No se pudo obtener la ubicación.";
    });
  } else {
    error.value = "Geolocalización no soportada por este navegador.";
  }
}

// --- Funciones para Listas ---
function addToWhiteList() {
  if (selectedBrand.value && !whitelist.value.includes(selectedBrand.value)) {
    whitelist.value.push(selectedBrand.value);
    blacklist.value = blacklist.value.filter(b => b !== selectedBrand.value);
    selectedBrand.value = "";
    page.value = 1; 
  }
}

function removeFromWhitelist(brand) {
  whitelist.value = whitelist.value.filter(b => b !== brand);
  page.value = 1; 
}

function addToBlackList() {
  if (selectedBrand.value && !blacklist.value.includes(selectedBrand.value)) {
    blacklist.value.push(selectedBrand.value);
    whitelist.value = whitelist.value.filter(b => b !== selectedBrand.value);
    selectedBrand.value = "";
    page.value = 1; 
  }
}

function removeFromBlacklist(brand) {
  blacklist.value = blacklist.value.filter(b => b !== brand);
  page.value = 1; 
}


// --- Computed ---
const enriched = computed(() =>
  all.value.map(st => ({
    ...st,
    // Usa las variables de búsqueda reales
    distanceKm: haversineKm(searchLat.value, searchLon.value, st.lat, st.lon),
    price: st.raw[fuelKey.value]
      ? parseFloat(st.raw[fuelKey.value].replace(",", "."))
      : NaN
  }))
);

const brandUniverse = computed(() =>
  Array.from(new Set(all.value.map(x => x.brand).filter(Boolean))).sort()
);

const filteredByBrand = computed(() => {
  if (whitelist.value.length) {
    return enriched.value.filter(s => whitelist.value.includes(s.brand));
  }
  if (blacklist.value.length) {
    return enriched.value.filter(s => !blacklist.value.includes(s.brand));
  }
  return enriched.value;
});

const withinRadius = computed(() =>
  filteredByBrand.value.filter(s => s.distanceKm <= radiusKm.value)
);

const sorted = computed(() => {
  const arr = withinRadius.value.slice();
  if (sortBy.value === "distance") {
    arr.sort((a, b) => a.distanceKm - b.distanceKm);
  } else if (sortBy.value === "brand") {
    arr.sort((a, b) => a.brand.localeCompare(b.brand));
  } else {
    arr.sort((a, b) => (a.price || Infinity) - (b.price || Infinity));
  }
  return arr;
});

const pageSize = 10;
const totalPages = computed(() =>
  Math.ceil(sorted.value.length / pageSize)
);

// Funcionalidad de paginación
const pageItems = computed(() =>
  sorted.value.slice((page.value - 1) * pageSize, page.value * pageSize)
);
function nextPage() {
    if (page.value < totalPages.value) page.value++;
}
function prevPage() {
    if (page.value > 1) page.value--;
}

// Resetea la página si los filtros (que no son la ubicación) cambian
watch([fuelKey, radiusKm, whitelist, blacklist, sortBy], () => {
  page.value = 1;
});
</script>

<template>
    <div class="container">
        <h1>Mi Versión Mejorada</h1>
        
        <p>Datos cargados: {{ all.length }}</p>
        
        <div class="main-filters-layout">
            
            <div class="left-column">
                <section class="section">
                    <h2>Ubicación</h2>
                    <div class="section-content location-content">
                        <label>Latitud: <input type="number" v-model="inputLat"/></label>
                        <label>Longitud: <input type="number" v-model="inputLon"/></label>
                        
                        <div class="location-buttons-group">
                            <button @click="detectMyLocation" class="btn btn-secondary">Usar mi ubicación</button>
                            <button @click="useManualLocation" class="btn btn-primary">Buscar ubicación manual</button>
                        </div>
                    </div>
                </section>

                <section class="section">
                    <h2>Combustible</h2>
                    <div class="section-content">
                        <label>Combustible:
                            <select v-model="fuelKey">
                                <option v-for="f in FUEL_FIELDS" :key="f.key" :value="f.key">{{ f.label }}</option>
                            </select>
                        </label>
                        
                        <label>Radio (Km):
                            <input type="number" v-model="radiusKm">
                        </label>
                    </div>
                </section>
            </div>
            
            <section class="section section-brands-right">
                <h2>Marcas</h2>
                
                <div class="section-content mark-select-row">
                    <label>Marca a gestionar:
                        <select v-model="selectedBrand">
                            <option value="">- seleccionar marca -</option>
                            <option v-for="b in brandUniverse" :key="b" :value="b">{{ b }}</option>
                        </select>
                    </label>
                </div>
                
                <div class="button-row">
                    <button @click="addToWhiteList" class="btn btn-primary btn-list-align">Añadir a lista blanca</button>
                    <button @click="addToBlackList" class="btn btn-secondary btn-list-align">Añadir a lista negra</button>
                </div>
                
                <div class="lists-container">
                    <div class="lists-section">
                        <h3>Lista Blanca</h3>
                        <div class="chips">
                            <span
                            v-for="b in whitelist"
                            :key="'w-'+b"
                            class="chip chip-green"
                            @click="removeFromWhitelist(b)"
                            >
                                {{ b }} ×
                            </span>
                        </div>
                    </div>

                    <div class="lists-section">
                        <h3>Lista negra</h3>
                        <div class="chips">
                            <span
                            v-for="b in blacklist"
                            :key="'b-'+b"
                            class="chip chip-red"
                            @click="removeFromBlacklist(b)"
                            >
                                {{ b }} ×
                            </span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
        <section class="section">
            <h2>Resultados dentro del radio</h2>
            
            <div class="section-content results-controls">
                <label style="font-weight: 600;">Ordenar por:
                    <select v-model="sortBy" class="input">
                        <option value="price">Precio</option>
                        <option value="distance">Cercanía</option>
                        <option value="brand">Marca</option>
                    </select>
                </label>
            </div>

            <div v-if="loading" class="loading">Cargando...</div>
            <div v-else-if="error" class="error">{{ error }}</div>
            
            <div class="results-view">
                <div class="pagination">
                    <button
                    class="btn btn-secondary"
                    :disabled="page <= 1"
                    @click="prevPage"
                    >
                        Anterior
                    </button>

                    <span>Página {{ page }} / {{ totalPages }} ({{ sorted.length }} estaciones)</span>

                    <button
                    class="btn btn-secondary"
                    :disabled="page >= totalPages"
                    @click="nextPage"
                    >
                        Siguiente
                    </button>

                </div>

                <div>
                    <ul class="results-list-grid">
                        <li v-for="it in pageItems" :key="it.id">
                            <StationCard :item="it" :fuelKey="fuelKey" />
                        </li>
                    </ul>
                </div>
            </div>
        </section>
    </div>
</template>

<style scoped>
/* ===============================
  BLOQUE 1: ESTILOS GLOBALES & GENERALES
  =============================== */
body {
  font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
  background-color: #DCDCDC; /* NEUTRO BASE (Más profundo) */
  margin: 0;
  color: #1a1a1a;
}

.container {
  padding: 1.5rem;
  margin: 0 auto; 
  max-width: 1200px;
}

/* ---------------------------------
   DISEÑO H1 (TÍTULO PRINCIPAL)
   --------------------------------- */
.container h1 {
  background-color: #DCDCDC; /* NEUTRO BASE */
  padding: 1rem 2rem;
  margin: 1.5rem auto; 
  width: fit-content; 
  border-radius: 1.5rem;
  font-size: 2.2rem;
  color: #2D6CDF; /* AZUL PRINCIPAL (Refinado) */
  text-align: center;
  /* Sombra de relieve fuerte */
  box-shadow: 
    8px 8px 16px #A3A3A3, /* Sombra Oscura (Refinada) */
    -8px -8px 16px #F0F0F0; /* Sombra Clara (Refinada) */
  /* Sombra de texto suave */
  text-shadow: 1px 1px 1px #A3A3A3;
}

h2, h3, h4 {
  color: #F85A3E; /* NARANJA SECUNDARIO (Refinado) */
}

/* ===============================
  BLOQUE 1.5: LAYOUT PRINCIPAL (2 COLUMNAS)
  =============================== */
.main-filters-layout {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
}

/* Columna Izquierda: Ubicación + Combustible */
.left-column {
    display: flex;
    flex-direction: column;
    gap: 1.5rem; 
    flex: 1 1 50%; 
}
.left-column .section {
    margin-bottom: 0; 
}

/* Columna Derecha: Marcas */
.section-brands-right {
    flex: 1 1 50%; 
    margin-bottom: 0;
}


/* ===============================
  BLOQUE 2: MENSAJES (LOADING/ERROR)
  =============================== */
.loading {
  text-align: center;
  font-size: 1.2rem;
  font-weight: 600;
  padding: 2rem;
  color: #F85A3E; /* CAMBIO: NARANJA SECUNDARIO (Antes morado) */
}

.error {
  color: #F85A3E; /* NARANJA */
  background-color: #fcece0;
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: center;
}

/* ===============================
  BLOQUE 3: SECCIÓN (TARJETA NEUMÓRFICA)
  =============================== */
.section {
  background-color: #C7C7C7; /* NEUTRO SECCIÓN (Más profundo) */
  border-radius: 2rem;
  overflow: hidden; /* Asegura que el h2 respete los bordes */
  padding: 0 0 1.5rem 0;
  margin-bottom: 1.5rem; 
  margin-top: 0;
  /* Efecto de Hundimiento */
  box-shadow: inset 5px 5px 10px #A3A3A3, inset -5px -5px 10px #F0F0F0;
  border: 1px solid rgba(0,0,0,0.05);
}

.section h2 {
  margin: 0 -1.5rem;
  padding: 0.75rem 1.5rem;
  text-align: center;
  display: block;
  background-color: #DCDCDC; /* NEUTRO BASE */
  color: #F85A3E; /* NARANJA SECUNDARIO */
  /* Relieve del texto */
  text-shadow: 1px 1px 1px #F0F0F0, -1px -1px 1px #A3A3A3;
  box-shadow: inset 2px 2px 5px #A3A3A3, inset -2px -2px 5px #F0F0F0;
  border-bottom: none;
  
  /* Borde inferior redondeado para el h2 */
  border-bottom-left-radius: 2.5rem;
  border-bottom-right-radius: 2.5rem;
}

/* Contenedor Flexbox para los inputs */
.section-content {
  padding: 1.5rem;
  display: flex;
  flex-wrap: wrap; 
  gap: 1rem;
  align-items: center;
  justify-content: center;
  color: #1a1a1a;
  font-weight: 600;
}

/* Ajuste para que Latitud, Longitud y el grupo de botones ocupen 1/3 */
.location-content label {
    flex-grow: 1;
    flex-basis: 30%; 
    min-width: 150px;
}
.location-buttons-group {
    flex-grow: 1;
    flex-basis: 30%;
    min-width: 150px;
    display: flex;
    flex-direction: column; 
    gap: 0.5rem; 
}

/* Estilos de la fila select de Marca */
.mark-select-row {
    padding-bottom: 0.5rem; 
}

.section-content label {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1 1 200px; 
}

.mark-select-row label {
    flex: 0 1 400px; 
    max-width: 80%;
}

/* ===============================
  BLOQUE 4: INPUTS & SELECTS (HUNDIDOS)
  =============================== */
.section-content input[type="number"],
.section select {
  background-color: #F0F0F0; /* NEUTRO CLARO (Mejor para inputs) */
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  color: #1a1a1a;
  /* Sombra Hundida */
  box-shadow: inset 2px 2px 5px #A3A3A3, inset -2px -2px 5px #FFFFFF;
  outline: none;
  border: 1px solid rgba(0,0,0,0.05);
  flex-grow: 1; 
}

/* CORRECCIÓN: Limitar el ancho del select de marca */
.mark-select-row select {
    max-width: 350px; 
}

.section-content input[type="number"]:focus,
.section select:focus {
  /* Efecto de foco sutil */
  box-shadow: inset 2px 2px 5px #A3A3A3,
              inset -2px -2px 5px #F0F0F0,
              0 0 5px #2D6CDF; /* AZUL PRINCIPAL */
}

/* Estilo visual del SELECTOR */
.section select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%231a1a1a'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.7em top 50%;
  background-size: 0.65em auto;
}

/* ===============================
  BLOQUE 5: BOTONES (RELIEVE)
  =============================== */
.btn, .section-content button {
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  /* Sombra de Relieve */
  box-shadow: 3px 3px 6px #A3A3A3, -3px -3px 6px #F0F0F0;
}

/* Botón principal (Azul) */
.btn-primary {
  background-color: #2D6CDF; /* AZUL PRINCIPAL */
  color: white;
}
/* Botón secundario (Naranja) */
.btn-secondary {
  background-color: #F85A3E; /* CAMBIO: NARANJA SECUNDARIO */
  color: white;
}

.btn:hover, .section-content button:hover {
  box-shadow: 1px 1px 3px #A3A3A3, -1px -1px 3px #F0F0F0;
  transform: translateY(1px);
}

.btn:active, .section-content button:active {
  box-shadow: inset 2px 2px 5px #A3A3A3, inset -2px -2px 5px #F0F0F0;
  transform: translateY(2px);
}

.button-row {
  display: flex;
  justify-content: space-between; 
  gap: 1rem;
  margin-top: 1rem;
  padding: 0 1.5rem;
}

.btn-list-align {
    flex-grow: 0;
}

/* ===============================
  BLOQUE 6: LISTAS (CHIPS & SECCIONES)
  =============================== */
.lists-container {
  display: flex;
  gap: 1.5rem;
  margin-top: 1.5rem;
  padding: 0 1.5rem;
  flex-wrap: wrap; 
  justify-content: center; 
}

.lists-section {
  flex: 1 1 45%; 
  min-width: 250px; 
  background-color: #C7C7C7; /* NEUTRO SECCIÓN */
  padding: 1rem;
  border-radius: 0.75rem;
  box-shadow: inset 3px 3px 6px #A3A3A3, inset -3px -3px 6px #F0F0F0;
}

.lists-section h3 {
  color: #F85A3E; /* CAMBIO: NARANJA SECUNDARIO (Antes #1a1a1a) */
  text-align: center;
  margin-bottom: 0.75rem;
  text-shadow: none;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.1s ease;
  box-shadow: 2px 2px 4px #A3A3A3, -2px -2px 4px #F0F0F0;
}

.chip-green {
  background-color: #2D6CDF; /* AZUL PRINCIPAL */
  color: white;
}

.chip-red {
  background-color: #F85A3E; /* NARANJA SECUNDARIO */
  color: white;
}

.chip:hover {
  transform: translateY(-1px);
}

.chip:active {
  box-shadow: inset 1px 1px 3px #A3A3A3, inset -1px -1px 3px #F0F0F0;
}

/* ===============================
  BLOQUE 7: RESULTADOS & PAGINACIÓN
  =============================== */
.results-view {
  padding: 0 1.5rem;
}

.pagination {
  display: flex; 
  align-items: center; 
  justify-content: center; 
  gap: 10px;
  margin-top: 10px;
}

.results-list-grid {
  list-style: none;
  padding: 0;
  margin-top: 20px;
  /* IMPLEMENTACIÓN DOBLE COLUMNA CON GRID */
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(45%, 1fr)); 
  /* ESPACIO VERTICAL AUMENTADO */
  row-gap: 2.5rem; 
  column-gap: 1.5rem;
  justify-content: space-between;
}

.results-list-grid li {
    padding: 0;
    margin: 0;
}

/* ---------------------------------
   DISEÑO DE TARJETA DE RESULTADO (Hundido)
   --------------------------------- */
.station-card {
    background-color: #C7C7C7; /* NEUTRO SECCIÓN */
    border-radius: 1.5rem;
    padding: 1rem;
    /* Efecto de Hundimiento (Inward) */
    box-shadow: inset 4px 4px 8px #A3A3A3, inset -4px -4px 8px #F0F0F0;
    transition: background-color 0.2s, box-shadow 0.2s; 
    height: 100%; 
    display: flex;
    flex-direction: column;
    cursor: default; 
}
.station-card:hover {
    background-color: #DCDCDC; /* Ligeramente más claro */
    box-shadow: inset 3px 3px 7px #A3A3A3, inset -3px -3px 7px #F0F0F0; 
    transform: none; 
}

/* Estilos internos asumidos para los elementos de la tarjeta */
.card-brand {
    font-size: 1.2rem;
    font-weight: 700;
    color: #2D6CDF; /* AZUL PRINCIPAL */
    margin: 0 0 0.5rem 0;
    border-bottom: 1px solid #A3A3A3;
    padding-bottom: 0.5rem;
    text-shadow: 1px 1px 1px #A3A3A3;
}

.card-address {
    font-size: 0.9rem;
    color: #333;
    margin-bottom: 0.75rem;
}

.card-price {
    font-size: 2.5rem;
    font-weight: 800;
    color: #F85A3E; /* NARANJA SECUNDARIO */
    text-align: right;
    margin: 0.5rem 0;
    line-height: 1;
}
.card-price small {
    font-size: 0.4em;
    font-weight: 500;
    color: #1a1a1a;
}
.card-distance {
    font-weight: 600;
    color: #F85A3E; /* CAMBIO: NARANJA SECUNDARIO (Antes morado) */
    margin-top: 0.5rem;
    text-align: right;
    font-size: 1rem;
}
/* --------------------------------- */


/* ===============================
  BLOQUE 8: MEDIA QUERIES (RESPONSIVIDAD)
  =============================== */

@media (max-width: 900px) {
    /* En pantallas medianas y pequeñas, las dos columnas principales se apilan */
    .main-filters-layout {
        flex-direction: column;
        gap: 0; 
    }
    .left-column {
        flex: auto;
    }
    .section-brands-right {
        margin-bottom: 1.5rem; 
    }
}

@media (max-width: 600px) {
  /* Reseteo para dispositivos muy pequeños */
  .section-content {
    flex-direction: column;
    align-items: stretch;
  }
  .section-content label {
    flex-basis: 100%;
  }

  /* Los botones de la fila se apilan */
  .button-row {
    flex-direction: column;
    align-items: stretch;
  }
  .button-row button {
    width: 100%;
  }

  /* Las listas de chips y resultados se apilan */
  .lists-container {
    flex-direction: column;
  }
  .lists-section {
    flex-basis: 100%;
  }

  .results-list-grid {
      /* En móvil, solo una columna */
      grid-template-columns: 1fr; 
      row-gap: 1.5rem; 
  }

  /* La sección de Ubicación se apila correctamente */
  .location-content label,
  .location-buttons-group {
      flex-basis: 100%;
      min-width: 100%;
  }
}
</style>