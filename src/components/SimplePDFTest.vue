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
    </div>

    <div v-if="pdfDocument" class="pdf-canvas-container" style="margin-top: 20px;">
      <h3>第一页预览:</h3>
      <canvas ref="testCanvas" style="border: 1px solid #ccc;"></canvas>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'

export default {
  name: 'SimplePDFTest',
  setup() {
    const testUrl = ref('')
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
        if (testCanvas.value) {
          const page = await pdf.getPage(1)
          const viewport = page.getViewport({ scale: 1.0 })

          const canvas = testCanvas.value
          const context = canvas.getContext('2d')
          canvas.height = viewport.height
          canvas.width = viewport.width

          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise

          console.log('第一页渲染成功')
          result.value.info += '，第一页渲染成功'
        }

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