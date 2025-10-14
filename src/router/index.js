import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PDFEditor from '../components/PDFEditor.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/editor',
    name: 'PDFEditor',
    component: PDFEditor
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router