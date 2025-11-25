<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { fetchStations } from "@/services/API/api.js";
import { haversineKm } from "../utils/geo.js";
import { FUEL_FIELDS } from "../utils/fuelFields.js";

const all = ref([]);
const loading = ref(false);
const error = ref("");

// Variables de Ubicación
const inputLat = ref(40.4168);
const inputLon = ref(-3.7038);
const searchLat = ref(40.4168);
const searchLon = ref(-3.7038);

// Variables de Filtro
const fuelKey = ref("Precio Gasolina 95 E5");
const radiusKm = ref(100);

// Variables de Listas
const whitelist = ref([]);
const blacklist = ref([]);
const selectedBrand = ref("");

// Variables de Resultados
const page = ref(1);
const sortBy = ref("price");
const itemsPerPage = ref(12);

// ------------------------------------
// VARIABLES Y FUNCIONES DEL DIÁLOGO (MODAL)
// ------------------------------------
const dialog = ref(false);
const selectedStation = ref(null); 

function showStationDetails(station) {
  selectedStation.value = station;
  dialog.value = true;
}

// ------------------------------------
// FUNCIONES DE NAVEGACIÓN
// ------------------------------------
function goToMaps(lat, lon, brand) {
    // URL de Google Maps para navegación (modo Conducción)
    const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving&destination_place_id=${brand}`;
    window.open(navUrl, '_blank');
}


// ------------------------------------
// LÓGICA DE DATOS
// ------------------------------------
async function loadData() {
  loading.value = true;
  try {
    all.value = await fetchStations();
  } catch(e) {
    error.value = e.message || "Error al cargar datos. Verifique la API o la conexión.";
    console.error("Error en loadData:", e);
  } finally {
    loading.value = false;
  }
}
onMounted(loadData);    //Montamos los datos

function useManualLocation() {
    searchLat.value = inputLat.value;
    searchLon.value = inputLon.value;
    page.value = 1; 
}

function detectMyLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      inputLat.value = position.coords.latitude;
      inputLon.value = position.coords.longitude;
      useManualLocation(); 
    }, () => {
      alert("No se pudo obtener la ubicación.");
    });
  } else {
    alert("Geolocalización no soportada por este navegador.");
  }
}

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

// ------------------------------------
// COMPUTED (Filtros y Ordenamiento)
// ------------------------------------
const enriched = computed(() =>
  all.value.map(st => ({
    ...st,
    distanceKm: haversineKm(searchLat.value, searchLon.value, st.lat, st.lon),
    horario: st.raw["Horario"] || st.raw["Horario (sin acento)"] || '',
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

const totalPages = computed(() =>
  Math.ceil(sorted.value.length / itemsPerPage.value)
);

// ------------------------------------
// Paginación
// ------------------------------------
const pageItems = computed(() =>
  sorted.value.slice((page.value - 1) * itemsPerPage.value, page.value * itemsPerPage.value)
);

watch([fuelKey, radiusKm, whitelist, blacklist, sortBy], () => {
  page.value = 1;
});
</script>

<template>
    <v-app> 
        <v-main class="bg-grey-lighten-3">
            <v-container>
                <h1 class="text-h4 text-center mb-6 text-primary">Vista Vuetify basada en mi versión</h1>
                
                <v-alert v-if="error" type="error" class="mb-4" closable>{{ error }}</v-alert>

                <v-row>
                    <v-col cols="12" md="6"> <!--Establecemos tamaño de pantalla para pantallas mas pequeñas -->
                        
                        <v-card class="mb-4" :loading="loading" elevation="4">
                            <v-card-title class="text-secondary text-h6 font-weight-bold">Ubicación</v-card-title>
                            <v-card-text>
                                <v-row dense>
                                    <v-col cols="12" sm="6">
                                        <v-text-field id="inputLat" label="Latitud" title="Latitud de la búsqueda" v-model.number="inputLat" type="number" variant="outlined" density="compact" hide-details></v-text-field>
                                    </v-col>
                                    <v-col cols="12" sm="6">
                                        <v-text-field id="inputLon" label="Longitud" title="Longitud de la búsqueda" v-model.number="inputLon" type="number" variant="outlined" density="compact" hide-details></v-text-field>
                                    </v-col>
                                </v-row>
                                <v-row dense class="mt-2">
                                    <v-col cols="12" sm="6">
                                        <v-btn 
                                            block 
                                            color="secondary" 
                                            @click="detectMyLocation" 
                                            variant="outlined" 
                                            prepend-icon="mdi-map-marker-radius-outline"
                                            class="d-none d-sm-flex" 
                                        >
                                           Usar mi ubicación
                                        </v-btn>
                                        <v-btn 
                                            block 
                                            color="secondary" 
                                            @click="detectMyLocation" 
                                            variant="outlined" 
                                            prepend-icon="mdi-map-marker-radius-outline"
                                            class="d-flex d-sm-none text-caption"
                                        >
                                            Mi ubicación
                                        </v-btn>
                                    </v-col>
                                    <v-col cols="12" sm="6">
                                        <v-btn 
                                            block 
                                            color="primary" 
                                            @click="useManualLocation" 
                                            prepend-icon="mdi-magnify"
                                            class="d-none d-sm-flex"
                                        >
                                            Buscar
                                        </v-btn>
                                        <v-btn 
                                            block 
                                            color="primary" 
                                            @click="useManualLocation" 
                                            prepend-icon="mdi-magnify"
                                            class="d-flex d-sm-none text-caption"
                                        >
                                            Buscar
                                        </v-btn>
                                    </v-col>
                                </v-row>
                            </v-card-text>
                        </v-card>

                        <v-card class="mb-4" elevation="4">
                            <v-card-title class="text-secondary text-h6 font-weight-bold">Combustible y Radio</v-card-title>
                            <v-card-text>
                                <v-row dense>
                                    <v-col cols="12" sm="6">
                                        <v-select 
                                            id="fuelKey"
                                            label="Combustible" 
                                            title="Seleccione el tipo de combustible" 
                                            v-model="fuelKey" 
                                            :items="FUEL_FIELDS" 
                                            item-title="label" 
                                            item-value="key"
                                            variant="outlined" density="compact" hide-details
                                        ></v-select>
                                    </v-col>
                                    <v-col cols="12" sm="6">
                                        <v-text-field id="radiusKm" label="Radio (Km)" title="Radio máximo de búsqueda en kilómetros" v-model.number="radiusKm" type="number" variant="outlined" density="compact" hide-details></v-text-field>
                                    </v-col>
                                </v-row>
                            </v-card-text>
                        </v-card>
                    </v-col>
                    
                    <v-col cols="12" md="6">
                        <v-card elevation="4">
                            <v-card-title class="text-secondary text-h6 font-weight-bold">Filtro por Marcas</v-card-title>
                            <v-card-text>
                                <v-select 
                                    id="selectedBrand"
                                    label="Marca a gestionar" 
                                    title="Marca para añadir o quitar de listas"
                                    v-model="selectedBrand" 
                                    :items="brandUniverse" 
                                    variant="outlined" density="compact" clearable
                                    class="mb-4"
                                    prepend-icon="mdi-gas-station"
                                ></v-select>

                                <v-row dense>
                                    <v-col cols="12" sm="6">
                                        <v-btn block color="primary" @click="addToWhiteList" :disabled="!selectedBrand" prepend-icon="mdi-list-status">Add Lista Blanca</v-btn>
                                    </v-col>
                                    <v-col cols="12" sm="6">
                                        <v-btn block color="secondary" @click="addToBlackList" :disabled="!selectedBrand" prepend-icon="mdi-list-status">Add Lista Negra</v-btn>
                                    </v-col>
                                </v-row>

                                <v-divider class="my-4"></v-divider>

                                <v-row>
                                    <v-col cols="12" sm="6">
                                        <h4 class="text-primary mb-2">Lista Blanca (Incluir)</h4>
                                        <div class="d-flex flex-wrap chip-container">
                                            <v-chip v-for="b in whitelist" :key="'w-'+b" closable @click:close="removeFromWhitelist(b)" color="primary" variant="tonal" class="ma-1">
                                                {{ b }}
                                            </v-chip>
                                            <p v-if="whitelist.length === 0" class="text-caption text-medium-emphasis">Ninguna marca incluida.</p>
                                        </div>
                                    </v-col>

                                    <v-col cols="12" sm="6">
                                        <h4 class="text-secondary mb-2">Lista Negra (Excluir)</h4>
                                        <div class="d-flex flex-wrap chip-container">
                                            <v-chip v-for="b in blacklist" :key="'b-'+b" closable @click:close="removeFromBlacklist(b)" color="secondary" variant="tonal" class="ma-1">
                                                {{ b }}
                                            </v-chip>
                                            <p v-if="blacklist.length === 0" class="text-caption text-medium-emphasis">Ninguna marca excluida.</p>
                                        </div>
                                    </v-col>
                                </v-row>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>

                <v-card class="mt-6" :loading="loading" elevation="4">
                    <v-card-title class="text-primary d-flex align-center justify-space-between">
                        <span class="text-h6 font-weight-bold">Resultados ({{ sorted.length }} estaciones) - Selecciona una opción</span>
                        
                        <v-select 
                            id="sortBy"
                            label="Ordenar por" 
                            v-model="sortBy" 
                            :items="[{ title: 'Precio', value: 'price' }, { title: 'Cercanía', value: 'distance' }, { title: 'Marca', value: 'brand' }]"
                            variant="outlined" density="compact" hide-details
                            style="max-width: 150px;"
                        ></v-select>
                    </v-card-title>
                    
                    <v-card-text>
                        <v-pagination 
                            v-model="page" 
                            :length="totalPages" 
                            :total-visible="7" 
                            class="mb-4"
                            :disabled="totalPages <= 1"
                            color="#1a1a1a"
                        ></v-pagination>

                        <v-row v-if="!loading && !error && pageItems.length > 0">
                            <v-col cols="12" sm="6" md="4" lg="3" v-for="it in pageItems" :key="it.id">
                                <v-card 
                                    elevation="2" 
                                    class="station-card"
                                    clickable 
                                    @click="showStationDetails(it)" >
                                    <v-card-title class="text-subtitle-1 text-primary font-weight-bold">{{ it.brand }}</v-card-title>
                                    
                                    <v-card-text class="pt-2 pb-2">
                                        <p class="text-caption text-medium-emphasis">{{ it.address }}</p>
                                        
                                        <p v-if="it.horario" class="text-caption text-success font-weight-bold mb-2">
                                            <v-icon icon="mdi-clock-outline" size="small"></v-icon> {{ it.horario }}
                                        </p>

                                        <v-divider class="my-2"></v-divider>
                                        <div class="d-flex justify-space-between align-center">
                                            <span class="text-h5 text-secondary font-weight-black">{{ it.price ? it.price.toFixed(3) : 'N/A' }} €</span>
                                            <span class="text-subtitle-2 text-primary">{{ it.distanceKm.toFixed(2) }} Km</span>
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>
                        <v-alert v-else-if="!loading && !error && sorted.length === 0" type="warning" text="No se encontraron gasolineras con esos filtros en tu ubicación actual." class="mt-4"></v-alert> 
                    </v-card-text>
                </v-card>
            </v-container>

            <v-dialog 
                v-model="dialog" 
                max-width="600"
                :persistent="false" 
                v-if="selectedStation"
            >
                <v-card>
                    <v-card-title class="text-h5 bg-primary text-white">
                        Detalles de {{ selectedStation.brand }}
                    </v-card-title>
                    
                    <v-card-text>
                        <v-list density="compact">
                            <v-list-item>
                                <v-list-item-title class="font-weight-bold">Dirección:</v-list-item-title>
                                <v-list-item-subtitle>{{ selectedStation.address }}</v-list-item-subtitle>
                            </v-list-item>
                            
                            <v-list-item>
                                <v-list-item-title class="font-weight-bold">Municipio / Provincia:</v-list-item-title>
                                <v-list-item-subtitle>{{ selectedStation.municipio }} ({{ selectedStation.provincia }})</v-list-item-subtitle>
                            </v-list-item>
                            
                            <v-list-item>
                                <v-list-item-title class="font-weight-bold">Horario:</v-list-item-title>
                                <v-list-item-subtitle>{{ selectedStation.horario || 'No especificado' }}</v-list-item-subtitle>
                            </v-list-item>

                            <v-list-item class="bg-primary mt-2 rounded text-white">
                                <v-list-item-title class="font-weight-black">Precio de {{ fuelKey }}:</v-list-item-title>
                                <v-list-item-subtitle class="text-h6 font-weight-bold">{{ selectedStation.price ? selectedStation.price.toFixed(3) : 'N/A' }} €</v-list-item-subtitle>
                            </v-list-item>
                            
                            <v-list-item>
                                <v-list-item-title class="font-weight-bold">Coordenadas:</v-list-item-title>
                                <v-list-item-subtitle>Lat: {{ selectedStation.lat.toFixed(4) }}, Lon: {{ selectedStation.lon.toFixed(4) }}</v-list-item-subtitle>
                            </v-list-item>
                        </v-list>
                        
                    </v-card-text>
                    
                    <v-card-actions>
                        <v-btn 
                            color="secondary" 
                            variant="flat" 
                            prepend-icon="mdi-google-maps"
                            @click="goToMaps(selectedStation.lat, selectedStation.lon, selectedStation.brand)"
                        >
                            Ver en Google Maps
                        </v-btn>
                        
                        <v-spacer></v-spacer>
                        
                        <v-btn color="primary" variant="tonal" @click="dialog = false">
                            Cerrar
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
            
        </v-main>
    </v-app>
</template>

<style scoped>
.chip-container {
    min-height: 50px;
}
.station-card {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    cursor: pointer; 
}
.station-card:hover {
    transform: translateY(-4px); 
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15) !important;
}
</style>