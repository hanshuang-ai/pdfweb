<template>
  <div class="simple-pdf-test">
    <h2>简单PDF测试</h2>
    <div class="test-controls">
      <input
        v-model="testUrl"
        placeholder="输入PDF URL进行测试"
        style="width: 400px; padding: 8px;"
      />
      <button @click="testPDF" :disabled="loading" style="margin-left: 10px; padding: 8px 16px;">
        {{ loading ? '加载中...' : '测试PDF' }}
      </button>
    </div>

    <div v-if="error" class="error" style="color: red; margin: 10px 0;">
      错误: {{ error }}
    </div>

    <div v-if="result" class="result" style="margin: 10px 0;">
      <h3>PDF信息:</h3>
      <p>页数: {{ result.numPages }}</p>
      <p>信息: {{ result.info }}</p>
      <p v-if="result.canvasSize">Canvas尺寸: {{ result.canvasSize }}</p>
    </div>

    <!-- Canvas始终存在于DOM中 -->
    <div class="pdf-canvas-container" style="margin-top: 20px;">
      <h3>第一页预览:</h3>
      <canvas ref="testCanvas" class="test-canvas" style="border: 1px solid #ccc; max-width: 100%; background: white;"></canvas>
      <p style="font-size: 12px; color: #666; margin-top: 5px;">
        如果看不到PDF内容，请查看浏览器控制台的详细日志
      </p>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'

// 设置 PDF.js worker - 添加版本号防止缓存问题（与PDFReader保持一致）
const workerUrl = `/pdf.worker.min.js?v=${pdfjsLib.version}`
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

console.log('SimplePDFTest - PDF.js 版本:', pdfjsLib.version)
console.log('SimplePDFTest - Worker 路径:', pdfjsLib.GlobalWorkerOptions.workerSrc)

export default {
  name: 'SimplePDFTest',
  setup() {
    // 设置默认PDF URL
    const defaultPdfUrl = 'https://fmatek5mfkum5gbd.public.blob.vercel-storage.com/1760506598654-5481ozc9d8m-1.JavaScript%E9%AB%98%E7%BA%A7%E7%A8%8B%E5%BA%8F%E8%AE%BE%E8%AE%A1%EF%BC%88%E7%AC%AC4%E7%89%88%EF%BC%89%5B%E5%89%8D%E7%AB%AF%E8%83%96%E5%A4%B4%E9%B1%BC%5D.pdf'

    const testUrl = ref(defaultPdfUrl)
    const loading = ref(false)
    const error = ref('')
    const result = ref(null)
    const pdfDocument = ref(null)
    const testCanvas = ref(null)

    const testPDF = async () => {
      if (!testUrl.value) {
        error.value = '请输入PDF URL'
        return
      }

      loading.value = true
      error.value = ''
      result.value = null
      pdfDocument.value = null

      try {
        console.log('开始测试PDF，URL:', testUrl.value)
        console.log('PDF.js版本:', pdfjsLib.version)

        // 最简单的PDF加载方式
        const loadingTask = pdfjsLib.getDocument(testUrl.value)

        loadingTask.onProgress = (progress) => {
          console.log('加载进度:', progress)
        }

        const pdf = await loadingTask.promise
        console.log('PDF加载成功，页数:', pdf.numPages)

        pdfDocument.value = pdf
        result.value = {
          numPages: pdf.numPages,
          info: 'PDF加载成功'
        }

        // 尝试渲染第一页
        console.log('开始渲染第一页...')

        const page = await pdf.getPage(1)
        console.log('获取到第1页对象')

        // 使用较小的缩放比例，避免Canvas过大
        const viewport = page.getViewport({ scale: 0.5 })
        console.log('视口尺寸:', viewport.width, 'x', viewport.height)

        // Canvas现在始终存在于DOM中，直接获取
        const canvas = document.querySelector('.test-canvas')
        console.log('获取Canvas:', canvas)

        if (!canvas) {
          console.error('Canvas元素不存在')
          error.value = 'Canvas元素不存在'
          return
        }

        console.log('Canvas设置前:', canvas.width, 'x', canvas.height)

        const context = canvas.getContext('2d')
        console.log('获取到2D上下文:', !!context)

        if (!context) {
          console.error('无法获取Canvas 2D上下文')
          error.value = '无法获取Canvas 2D上下文'
          return
        }

        // 清空Canvas并设置尺寸
        context.clearRect(0, 0, canvas.width, canvas.height)
        canvas.height = viewport.height
        canvas.width = viewport.width

        console.log('Canvas设置后:', canvas.width, 'x', canvas.height)

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        }

        console.log('开始渲染到Canvas...')
        await page.render(renderContext).promise
        console.log('Canvas渲染完成!')

        // 检查Canvas是否有内容
        const imageData = context.getImageData(0, 0, 1, 1)
        console.log('Canvas像素数据:', imageData.data)

        result.value.info += '，第一页渲染成功'
        result.value.canvasSize = `${canvas.width}x${canvas.height}`

      } catch (err) {
        console.error('PDF测试失败:', err)
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    return {
      testUrl,
      loading,
      error,
      result,
      testCanvas,
      testPDF
    }
  },
  mounted() {
    console.log('SimplePDFTest组件已挂载，自动开始PDF测试')
    // 自动测试默认PDF
    setTimeout(() => {
      this.testPDF()
    }, 500)
  }
}
</script>

<style scoped>
.simple-pdf-test {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-controls {
  margin: 20px 0;
  display: flex;
  align-items: center;
}
</style>