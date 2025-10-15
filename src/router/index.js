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
    name: 'SimplePDFViewer',
    component: () => import('../components/PDFViewer.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
