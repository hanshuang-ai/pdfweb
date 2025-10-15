import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
    {
    path: '/browser-viewer',
    name: 'BrowserPDF',
    component: () => import('../components/BrowserPDF.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
