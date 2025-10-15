<template>
  <div class="simple-pdf-viewer">
    <div v-if="loading" class="loading">
      加载中...
    </div>
    <div v-if="error" class="error">
      {{ error }}
    </div>
    <div class="pdf-container">
      <canvas ref="canvasRef" class="pdf-canvas"></canvas>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import * as pdfjsLib from 'pdfjs-dist'

// 配置PDF.js worker - 使用本地文件
pdfjsLib.GlobalWorkerOptions.workerSrc = '/src/static/pdf.worker.min.js'

export default {
  name: 'SimplePDFViewer',
  setup() {
    const route = useRoute()

    // 从路由参数获取URL，如果没有则使用默认URL
    const defaultUrl = 'https://www.pwithe.com/Public/Upload/download/20170211/589ebf8e5bb13.pdf'
    const pdfUrl = route.query.url || defaultUrl

    const canvasRef = ref(null)
    const loading = ref(true)
    const error = ref('')
    const pdfDocument = ref(null)

    const loadPDF = async () => {
      try {
        loading.value = true
        error.value = ''

        const loadingTask = pdfjsLib.getDocument(pdfUrl)
        pdfDocument.value = await loadingTask.promise

        await renderPage(1)
        loading.value = false
      } catch (err) {
        error.value = 'PDF加载失败: ' + err.message
        loading.value = false
        console.error('PDF加载错误:', err)
      }
    }

    const renderPage = async (pageNum) => {
      try {
        const page = await pdfDocument.value.getPage(pageNum)
        const viewport = page.getViewport({ scale: 1.5 })

        const canvas = canvasRef.value
        const context = canvas.getContext('2d')

        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        }

        await page.render(renderContext).promise
        console.log(`第 ${pageNum} 页渲染完成`)
      } catch (err) {
        console.error('页面渲染错误:', err)
        error.value = '页面渲染失败: ' + err.message
      }
    }

    onMounted(() => {
      loadPDF()
    })

    return {
      canvasRef,
      loading,
      error
    }
  }
}
</script>

<style scoped>
.simple-pdf-viewer {
  width: 100%;
  height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading {
  font-size: 18px;
  color: #666;
}

.error {
  color: red;
  font-size: 16px;
  text-align: center;
  max-width: 500px;
}

.pdf-container {
  max-width: 100%;
  max-height: 100vh;
  overflow: auto;
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.pdf-canvas {
  display: block;
  max-width: 100%;
  height: auto;
}
</style>