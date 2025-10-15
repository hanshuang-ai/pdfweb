<template>
  <div class="pdf-viewer-wrapper">
    <div class="viewer-header">
      <div class="controls">
        <button @click="prevPage" :disabled="pageNumber <= 1">⬅️ 上一页</button>
        <span>第</span>
        <input type="number" v-model.number="pageInput" @keyup.enter="goToPage(pageInput)" :min="1" :max="numPages" />
        <span>/ {{ numPages }}</span>

        <button @click="nextPage" :disabled="pageNumber >= numPages">下一页 ➡️</button>

        <button @click="fitWidth">📐 适应宽度</button>
        <button @click="zoomOut">🔍-</button>
        <span>{{ Math.round(scale * 100) }}%</span>
        <button @click="zoomIn">🔍+</button>
      </div>
    </div>

    <div id="viewerContainer" class="viewerContainer">
      <div id="viewer" class="pdfViewer"></div>
    </div>
  </div>
</template>

<script>
import * as pdfjsLib from 'pdfjs-dist'
import { EventBus, PDFLinkService, PDFViewer } from 'pdfjs-dist/web/pdf_viewer'
import 'pdfjs-dist/web/pdf_viewer.css'

// 初始化 Worker（使用经典 JS Worker 并通过 workerPort 传入）
const worker = new Worker(new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url))
pdfjsLib.GlobalWorkerOptions.workerPort = worker

export default {
  name: 'PDFViewerFull',
  props: {
    pdfUrl: { type: String, default: '/test.pdf' }
  },
  data() {
    return {
      pageNumber: 1,
      pageInput: 1,
      numPages: 0,
      scale: 1
    }
  },
  methods: {
    async load() {
      // 使用本地非响应式实例，避免 Vue Proxy 破坏私有字段访问
      this._eventBus = new EventBus()
      this._linkService = new PDFLinkService({ eventBus: this._eventBus })
      const container = document.getElementById('viewerContainer')
      const viewerEl = document.getElementById('viewer')

      this._viewer = new PDFViewer({
        container,
        viewer: viewerEl,
        eventBus: this._eventBus,
        linkService: this._linkService,
        renderer: 'canvas'
      })

      this._linkService.setViewer(this._viewer)

      const loadingTask = pdfjsLib.getDocument({
        url: this.pdfUrl,
        cMapUrl: '/cmaps/',
        cMapPacked: true
      })

      this._pdfDocument = await loadingTask.promise
      this.numPages = this._pdfDocument.numPages

      this._linkService.setDocument(this._pdfDocument)
      this._viewer.setDocument(this._pdfDocument)

      // 页面初始化后适应宽度
      this._eventBus.on('pagesinit', () => {
        this.fitWidth()
      })

      // 同步当前页
      this._eventBus.on('pagechanging', (e) => {
        this.pageNumber = e.pageNumber
        this.pageInput = e.pageNumber
      })
    },
    prevPage() {
      if (this.pageNumber > 1) {
        this._viewer.currentPageNumber = this.pageNumber - 1
      }
    },
    nextPage() {
      if (this.pageNumber < this.numPages) {
        this._viewer.currentPageNumber = this.pageNumber + 1
      }
    },
    goToPage(n) {
      if (n >= 1 && n <= this.numPages) {
        this._viewer.currentPageNumber = n
      }
    },
    zoomIn() {
      this.scale = Math.min(this.scale + 0.25, 3)
      this._viewer.currentScale = this.scale
    },
    zoomOut() {
      this.scale = Math.max(this.scale - 0.25, 0.5)
      this._viewer.currentScale = this.scale
    },
    fitWidth() {
      this._viewer.currentScaleValue = 'page-width'
      this.scale = this._viewer.currentScale
    }
  },
  mounted() {
    this.load()
  }
}
</script>

<style scoped>
.pdf-viewer-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: relative;
}
.viewer-header {
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  padding: 8px 12px;
}
.controls { display: flex; align-items: center; gap: 8px; }
.viewerContainer {
  position: absolute;
  top: 48px; /* 与上方工具栏高度保持一致 */
  bottom: 0;
  left: 0;
  right: 0;
  overflow: auto;
}
.pdfViewer { /* 必须要这个类名，官方 viewer 用它承载页面 */ }
</style>