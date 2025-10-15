import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PDFEditor from '../components/PDFEditor.vue'
import SimplePDFTest from '../components/SimplePDFTest.vue'
import PDFViewerFull from '../components/PDFViewer.vue'

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
  },
  {
    path: '/test',
    name: 'SimplePDFTest',
    component: SimplePDFTest
  },
  {
    path: '/viewer',
    name: 'PDFViewerFull',
    component: PDFViewerFull
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