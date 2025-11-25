import { createRouter, createWebHistory } from 'vue-router'
import ProfeView from '@/pages/ProfeView.vue'
import MyView from '@/pages/MyView.vue'
import Welcome from '@/pages/WelcomeView.vue'
// Eliminar: import ModernEleView from '@/pages/ModernEleView.vue' // <-- Eliminado
import ModernVuetifyView from '@/pages/ModernVuetifyView.vue'

const routes = [
  { path: '/', component: Welcome},
  { path: '/profeView', component: ProfeView },
  { path: '/myView', component: MyView },
  // Eliminar: { path: '/ElementsView', component: ModernEleView }, // <-- Eliminado
  { path: '/VuetifyView', component: ModernVuetifyView },
]

export default createRouter({
  history: createWebHistory(),
  routes
})