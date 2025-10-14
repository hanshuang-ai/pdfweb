import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'
import PDFEditor from '../components/PDFEditor.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: App
  },
  {
    path: '/editor',
    name: 'PDFEditor',
    component: PDFEditor,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router