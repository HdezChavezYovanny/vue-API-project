import { createRouter, createWebHashHistory } from 'vue-router'
import ProfeView from '@/pages/ProfeView.vue'
import MyView from '@/pages/MyView.vue'
import Welcome from '@/pages/WelcomeView.vue'
import ModernVuetifyView from '@/pages/ModernVuetifyView.vue'

const routes = [
  { path: '/', component: Welcome},
  { path: '/profeView', component: ProfeView },
  { path: '/myView', component: MyView },
  { path: '/VuetifyView', component: ModernVuetifyView },
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})