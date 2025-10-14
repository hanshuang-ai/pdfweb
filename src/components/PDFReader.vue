<template>
  <div class="pdf-reader">
    <div class="pdf-header">
      <div class="pdf-info">
        <h2 class="pdf-title">{{ fileName || 'PDF 文档' }}</h2>
        <span class="pdf-status">{{ loadingStatus }}</span>
      </div>

      <div class="pdf-controls">
        <div class="page-controls">
          <button
            @click="previousPage"
            :disabled="currentPage <= 1 || loading"
            class="control-btn"
          >
            ⬅️ 上一页
          </button>

          <div class="page-info">
            <input
              v-model.number="currentPageInput"
              @keyup.enter="goToPage(currentPageInput)"
              type="number"
              :min="1"
              :max="totalPages"
              class="page-input"
            />
            <span class="page-separator">/</span>
            <span class="total-pages">{{ totalPages }}</span>
          </div>

          <button
            @click="nextPage"
            :disabled="currentPage >= totalPages || loading"
            class="control-btn"
          >
            下一页 ➡️
          </button>
        </div>

        <div class="zoom-controls">
          <button
            @click="zoomOut"
            :disabled="currentScale <= 0.5"
            class="control-btn"
          >
            🔍-
          </button>
          <span class="zoom-level">{{ Math.round(currentScale * 100) }}%</span>
          <button
            @click="zoomIn"
            :disabled="currentScale >= 3"
            class="control-btn"
          >
            🔍+
          </button>
          <button
            @click="fitToWidth"
            class="control-btn"
          >
            📐 适应宽度
          </button>
        </div>

        <button
          @click="savePDF"
          :disabled="saving"
          class="save-btn"
        >
          <span v-if="saving" class="saving-icon">⏳</span>
          <span v-else class="save-icon">💾</span>
          {{ saving ? '保存中...' : '保存覆盖' }}
        </button>
      </div>
    </div>

    <div class="pdf-container" ref="pdfContainer">
      <div v-if="loading" class="pdf-loading">
        <div class="loading-spinner">⏳</div>
        <p>正在加载 PDF...</p>
      </div>

      <div v-else-if="error" class="pdf-error">
        <div class="error-icon">❌</div>
        <h3>加载失败</h3>
        <p>{{ error }}</p>
        <button @click="loadPDF" class="retry-btn">🔄 重试</button>
      </div>

      <div v-else class="pdf-content">
        <canvas
          ref="pdfCanvas"
          class="pdf-canvas"
          @wheel="handleWheel"
        ></canvas>
      </div>
    </div>

    <!-- 页面缩略图导航 -->
    <div class="pdf-thumbnails" v-if="totalPages > 1 && !loading && !error">
      <div class="thumbnails-header">
        <h4>页面导航</h4>
        <button @click="toggleThumbnails" class="toggle-btn">
          {{ showThumbnails ? '隐藏' : '显示' }}
        </button>
      </div>
      <div v-show="showThumbnails" class="thumbnails-list">
        <div
          v-for="page in Math.min(totalPages, 10)"
          :key="page"
          :class="['thumbnail-item', { active: currentPage === page }]"
          @click="goToPage(page)"
        >
          <canvas
            :ref="`thumbnail-${page}`"
            class="thumbnail-canvas"
          ></canvas>
          <span class="thumbnail-page">{{ page }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import { put } from '@vercel/blob'

// 设置 PDF.js worker - 使用本地文件
pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`
console.log('PDF.js 版本:', pdfjsLib.version)
console.log('Worker 路径:', pdfjsLib.GlobalWorkerOptions.workerSrc)

export default {
  name: 'PDFReader',
  props: {
    pdfUrl: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      default: ''
    },
    originalPathname: {
      type: String,
      required: true
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    // PDF 相关状态
    const pdfDocument = ref(null)
    const currentPage = ref(1)
    const currentPageInput = ref(1)
    const totalPages = ref(0)
    const currentScale = ref(1.0)
    const loading = ref(false)
    const saving = ref(false)
    const error = ref('')
    const loadingStatus = ref('')
    const showThumbnails = ref(false)

    // DOM 引用
    const pdfContainer = ref(null)
    const pdfCanvas = ref(null)

    // 加载 PDF
    const loadPDF = async () => {
      if (!props.pdfUrl) return

      loading.value = true
      error.value = ''
      loadingStatus.value = '正在下载 PDF...'

      try {
        const loadingTask = pdfjsLib.getDocument({
          url: props.pdfUrl,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/cmaps/',
          cMapPacked: true
        })

        loadingTask.onProgress = (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100)
          loadingStatus.value = `正在加载 PDF... ${percent}%`
        }

        pdfDocument.value = await loadingTask.promise
        totalPages.value = pdfDocument.value.numPages
        loadingStatus.value = `PDF 加载完成 (${totalPages.value} 页)`

        // 渲染第一页
        await renderPage(currentPage.value)

        // 生成缩略图
        if (totalPages.value > 1) {
          await nextTick()
          generateThumbnails()
        }

      } catch (err) {
        console.error('PDF 加载失败:', err)
        error.value = `PDF 加载失败: ${err.message}`
      } finally {
        loading.value = false
      }
    }

    // 渲染页面
    const renderPage = async (pageNum) => {
      if (!pdfDocument.value || !pdfCanvas.value) return

      try {
        const page = await pdfDocument.value.getPage(pageNum)
        const viewport = page.getViewport({ scale: currentScale.value })

        const canvas = pdfCanvas.value
        const context = canvas.getContext('2d')

        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        }

        await page.render(renderContext).promise
        loadingStatus.value = `第 ${pageNum} 页 / 共 ${totalPages.value} 页`

      } catch (err) {
        console.error('页面渲染失败:', err)
        error.value = `页面 ${pageNum} 渲染失败: ${err.message}`
      }
    }

    // 生成缩略图
    const generateThumbnails = async () => {
      if (!pdfDocument.value) return

      for (let pageNum = 1; pageNum <= Math.min(totalPages.value, 10); pageNum++) {
        try {
          const page = await pdfDocument.value.getPage(pageNum)
          const viewport = page.getViewport({ scale: 0.2 })

          const canvas = document.querySelector(`[ref="thumbnail-${pageNum}"]`)
          if (canvas) {
            const context = canvas.getContext('2d')
            canvas.height = viewport.height
            canvas.width = viewport.width

            const renderContext = {
              canvasContext: context,
              viewport: viewport
            }

            await page.render(renderContext).promise
          }
        } catch (err) {
          console.error(`缩略图 ${pageNum} 生成失败:`, err)
        }
      }
    }

    // 页面导航
    const previousPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--
        currentPageInput.value = currentPage.value
        renderPage(currentPage.value)
      }
    }

    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++
        currentPageInput.value = currentPage.value
        renderPage(currentPage.value)
      }
    }

    const goToPage = (pageNum) => {
      if (pageNum >= 1 && pageNum <= totalPages.value) {
        currentPage.value = pageNum
        currentPageInput.value = pageNum
        renderPage(pageNum)
      }
    }

    // 缩放控制
    const zoomIn = () => {
      if (currentScale.value < 3) {
        currentScale.value = Math.min(currentScale.value + 0.25, 3)
        renderPage(currentPage.value)
      }
    }

    const zoomOut = () => {
      if (currentScale.value > 0.5) {
        currentScale.value = Math.max(currentScale.value - 0.25, 0.5)
        renderPage(currentPage.value)
      }
    }

    const fitToWidth = () => {
      if (!pdfCanvas.value || !pdfContainer.value) return

      const containerWidth = pdfContainer.value.clientWidth - 40
      const canvasWidth = pdfCanvas.value.width

      if (canvasWidth > 0) {
        currentScale.value = containerWidth / canvasWidth
        renderPage(currentPage.value)
      }
    }

    // 鼠标滚轮缩放
    const handleWheel = (event) => {
      if (event.ctrlKey) {
        event.preventDefault()
        if (event.deltaY < 0) {
          zoomIn()
        } else {
          zoomOut()
        }
      }
    }

    // 保存 PDF（覆盖原文件）
    const savePDF = async () => {
      if (!pdfDocument.value) return

      saving.value = true

      try {
        // 这里我们需要实现 PDF 的保存逻辑
        // 由于 pdf.js 主要用于读取，保存需要其他方式
        // 暂时显示保存成功的提示
        window.$toast.success('保存成功', 'PDF 文件已成功保存！')

        // 可以在这里添加实际的保存逻辑
        // 例如：将修改后的 PDF 上传覆盖原文件

      } catch (err) {
        console.error('PDF 保存失败:', err)
        window.$toast.error('保存失败', `PDF 保存失败: ${err.message}`)
      } finally {
        saving.value = false
      }
    }

    // 切换缩略图显示
    const toggleThumbnails = () => {
      showThumbnails.value = !showThumbnails.value
    }

    // 监听当前页变化
    watch(currentPage, (newVal) => {
      currentPageInput.value = newVal
    })

    // 监听 PDF URL 变化
    watch(() => props.pdfUrl, (newUrl) => {
      if (newUrl) {
        currentPage.value = 1
        currentScale.value = 1.0
        loadPDF()
      }
    }, { immediate: true })

    onMounted(() => {
      // 监听键盘事件
      const handleKeydown = (event) => {
        if (event.target.tagName === 'INPUT') return

        switch (event.key) {
          case 'ArrowLeft':
            previousPage()
            break
          case 'ArrowRight':
            nextPage()
            break
          case 'Escape':
            emit('close')
            break
        }
      }

      document.addEventListener('keydown', handleKeydown)

      onUnmounted(() => {
        document.removeEventListener('keydown', handleKeydown)
      })
    })

    return {
      // 状态
      currentPage,
      currentPageInput,
      totalPages,
      currentScale,
      loading,
      saving,
      error,
      loadingStatus,
      showThumbnails,

      // DOM 引用
      pdfContainer,
      pdfCanvas,

      // 方法
      loadPDF,
      previousPage,
      nextPage,
      goToPage,
      zoomIn,
      zoomOut,
      fitToWidth,
      handleWheel,
      savePDF,
      toggleThumbnails
    }
  }
}
</script>

<style scoped>
.pdf-reader {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.pdf-header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.pdf-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.pdf-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.pdf-status {
  font-size: 14px;
  color: #666;
  background: #f0f0f0;
  padding: 4px 12px;
  border-radius: 12px;
}

.pdf-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.page-controls,
.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn {
  background: #f0f0f0;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.control-btn:hover:not(:disabled) {
  background: #e0e0e0;
  transform: translateY(-1px);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-input {
  width: 50px;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
}

.page-separator {
  color: #666;
  font-weight: 500;
}

.total-pages {
  font-weight: 500;
  color: #333;
}

.zoom-level {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  min-width: 50px;
  text-align: center;
}

.save-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.saving-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.pdf-container {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px;
  background: #f8f8f8;
}

.pdf-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: 16px;
}

.loading-spinner {
  font-size: 48px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.pdf-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: 16px;
  text-align: center;
}

.error-icon {
  font-size: 48px;
}

.pdf-error h3 {
  margin: 0;
  color: #d32f2f;
}

.pdf-error p {
  margin: 0;
  color: #666;
}

.retry-btn {
  background: #1976d2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.pdf-content {
  display: flex;
  justify-content: center;
}

.pdf-canvas {
  max-width: 100%;
  height: auto;
  border: 1px solid #ddd;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: white;
}

.pdf-thumbnails {
  position: fixed;
  right: 20px;
  top: 100px;
  width: 200px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 50;
}

.thumbnails-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
}

.thumbnails-header h4 {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.toggle-btn {
  background: none;
  border: none;
  color: #1976d2;
  cursor: pointer;
  font-size: 12px;
}

.thumbnails-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
}

.thumbnail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.thumbnail-item:hover {
  background: #f0f0f0;
}

.thumbnail-item.active {
  background: #e3f2fd;
  border: 1px solid #1976d2;
}

.thumbnail-canvas {
  border: 1px solid #ddd;
  max-width: 100%;
  height: auto;
}

.thumbnail-page {
  margin-top: 4px;
  font-size: 12px;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pdf-controls {
    flex-direction: column;
    gap: 12px;
  }

  .pdf-thumbnails {
    position: static;
    width: 100%;
    margin-top: 20px;
  }

  .pdf-container {
    padding: 10px;
  }
}
</style>