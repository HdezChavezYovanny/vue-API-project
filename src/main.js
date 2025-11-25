// src/main.js

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// ------------------------------------------------------------------
// 1. CONFIGURACIÓN DE VUETIFY
// ------------------------------------------------------------------
import 'vuetify/styles' // Estilos base de Vuetify
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components,
  directives,
  // Manteniendo los colores primario y secundario, y uno para acentuar de ser necesario
  theme: {
    themes: {
      light: {
        colors: {
          primary: '#2D6CDF',
          secondary: '#F85A3E',
          accent: '#4FC3F7',
        },
      },
    },
  },
})

// ------------------------------------------------------------------
// 2. INICIALIZACIÓN DE LA APLICACIÓN
// ------------------------------------------------------------------
const app = createApp(App)

app.use(createPinia())
app.use(router)

app.use(vuetify) // Solo Vuetify

app.mount('#app')