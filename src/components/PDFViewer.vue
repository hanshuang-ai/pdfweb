<template>
  <div class="pdf-viewer-component" ref="viewerContainer">
    <!-- PDF工具栏 -->
    <div class="pdf-toolbar" v-if="!isLoading">
      <div class="toolbar-left">
        <button @click="previousPage" :disabled="currentPage <= 1" class="toolbar-btn" title="上一页">
          <span class="btn-icon">⬅️</span>
          <span class="btn-text">上一页</span>
        </button>

        <div class="page-control">
          <input
            v-model.number="currentPageInput"
            @keyup.enter="goToPage(currentPageInput)"
            @blur="validatePageInput"
            type="number"
            :min="1"
            :max="totalPages"
            class="page-input"
          />
          <span class="page-separator">/</span>
          <span class="total-pages">{{ totalPages }}</span>
        </div>

        <button @click="nextPage" :disabled="currentPage >= totalPages" class="toolbar-btn" title="下一页">
          <span class="btn-text">下一页</span>
          <span class="btn-icon">➡️</span>
        </button>
      </div>

      <div class="toolbar-center">
        <button @click="zoomOut" :disabled="currentScale <= minScale" class="toolbar-btn" title="缩小">
          <span class="btn-icon">🔍➖</span>
          <span class="btn-text">缩小</span>
        </button>

        <select v-model="currentScale" @change="setScale(currentScale)" class="zoom-select">
          <option value="auto">自动</option>
          <option value="page-fit">适合页面</option>
          <option value="page-width">适合宽度</option>
          <option :value="0.5">50%</option>
          <option :value="0.75">75%</option>
          <option :value="1">100%</option>
          <option :value="1.25">125%</option>
          <option :value="1.5">150%</option>
          <option :value="2">200%</option>
          <option :value="3">300%</option>
        </select>

        <button @click="zoomIn" :disabled="currentScale >= maxScale" class="toolbar-btn" title="放大">
          <span class="btn-icon">🔍➕</span>
          <span class="btn-text">放大</span>
        </button>
      </div>

      <div class="toolbar-right">
        <button @click="rotateLeft" class="toolbar-btn" title="向左旋转">
          <span class="btn-icon">↺</span>
          <span class="btn-text">向左旋转</span>
        </button>

        <button @click="rotateRight" class="toolbar-btn" title="向右旋转">
          <span class="btn-icon">↻</span>
          <span class="btn-text">向右旋转</span>
        </button>

        <button @click="downloadPDF" class="toolbar-btn" title="下载PDF">
          <span class="btn-icon">📥</span>
          <span class="btn-text">下载</span>
        </button>

        <button @click="toggleFullscreen" class="toolbar-btn" :title="isFullscreen ? '退出全屏' : '进入全屏'">
          <span class="btn-icon">{{ isFullscreen ? '⛶' : '⛶' }}</span>
          <span class="btn-text">{{ isFullscreen ? '退出全屏' : '全屏' }}</span>
        </button>
      </div>
    </div>

    <!-- PDF渲染区域 -->
    <div class="pdf-container" ref="pdfContainer">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner">⏳</div>
        <div class="loading-text">正在加载PDF...</div>
        <div class="loading-progress" v-if="loadingProgress > 0">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: loadingProgress + '%' }"></div>
          </div>
          <div class="progress-text">{{ loadingProgress }}%</div>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">❌</div>
        <div class="error-title">PDF加载失败</div>
        <div class="error-message">{{ error }}</div>
        <button @click="retryLoad" class="retry-btn">重试</button>
      </div>

      <!-- PDF画布 -->
      <div v-else class="pdf-canvas-container">
        <canvas
          ref="pdfCanvas"
          class="pdf-canvas"
          @wheel="handleWheel"
          @click="handleCanvasClick"
        ></canvas>

        <!-- PDF文本层（用于文本选择和搜索） -->
        <div
          ref="textLayer"
          class="text-layer"
          @click="handleCanvasClick"
        ></div>
      </div>

      <!-- 页面导航（全屏模式下的提示） -->
      <div v-if="isFullscreen && !isLoading && !error" class="fullscreen-hints">
        <div class="hint-item">点击左侧 → 上一页</div>
        <div class="hint-item">点击右侧 → 下一页</div>
        <div class="hint-item">按ESC退出全屏</div>
      </div>
    </div>

    <!-- 缩略图侧边栏（可选） -->
    <div class="thumbnail-sidebar" v-if="showThumbnails && totalPages > 1">
      <div class="sidebar-header">
        <h3>页面缩略图</h3>
        <button @click="toggleThumbnails" class="close-sidebar">×</button>
      </div>
      <div class="thumbnails-list">
        <div
          v-for="page in totalPages"
          :key="page"
          :class="['thumbnail-item', { active: page === currentPage }]"
          @click="goToPage(page)"
        >
          <canvas
            :ref="`thumbnail-${page}`"
            class="thumbnail-canvas"
          ></canvas>
          <div class="thumbnail-page-num">第 {{ page }} 页</div>
        </div>
      </div>
    </div>

    <!-- 缩略图切换按钮 -->
    <button
      v-if="totalPages > 1"
      @click="toggleThumbnails"
      class="thumbnail-toggle"
      title="显示/隐藏缩略图"
    >
      <span class="btn-icon">📄</span>
    </button>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'

// 配置PDF.js worker - 使用CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

export default {
  name: 'PDFViewer',
  props: {
    pdfUrl: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      default: ''
    },
    initialScale: {
      type: [String, Number],
      default: 'auto'
    }
  },
  emits: ['pdf-loaded', 'page-changed', 'scale-changed', 'error'],
  setup(props, { emit }) {
    // PDF相关数据
    const pdfDocument = ref(null)
    const currentPage = ref(1)
    const totalPages = ref(0)
    const currentScale = ref(props.initialScale)
    const rotation = ref(0)

    // UI状态
    const isLoading = ref(true)
    const loadingProgress = ref(0)
    const error = ref('')
    const isFullscreen = ref(false)
    const showThumbnails = ref(false)

    // DOM引用
    const viewerContainer = ref(null)
    const pdfContainer = ref(null)
    const pdfCanvas = ref(null)
    const textLayer = ref(null)

    // 页面输入验证
    const currentPageInput = ref(1)

    // 缩放范围
    const minScale = 0.25
    const maxScale = 4.0
    const scaleStep = 0.25

    // 加载PDF文档
    const loadPDF = async () => {
      if (!props.pdfUrl) {
        error.value = 'PDF URL为空'
        isLoading.value = false
        return
      }

      try {
        isLoading.value = true
        error.value = ''
        loadingProgress.value = 0

        console.log('开始加载PDF:', props.pdfUrl)

        // 配置PDF加载选项，支持CORS
        const loadingTask = pdfjsLib.getDocument({
          url: props.pdfUrl,
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/',
          disableAutoFetch: false,
          enableXfa: true,
          onProgress: (progress) => {
            if (progress.total) {
              loadingProgress.value = Math.round((progress.loaded / progress.total) * 100)
              console.log('加载进度:', loadingProgress.value + '%')
            }
          },
          onPassword: (callback, reason) => {
            // 如果PDF有密码保护
            console.warn('PDF需要密码:', reason)
            error.value = '该PDF文件需要密码保护，暂不支持'
            isLoading.value = false
          },
          onProgress: (progress) => {
            if (progress.total) {
              loadingProgress.value = Math.round((progress.loaded / progress.total) * 100)
            }
          }
        })

        // 等待PDF文档加载
        pdfDocument.value = await loadingTask.promise
        console.log('PDF加载成功，总页数:', pdfDocument.value.numPages)

        totalPages.value = pdfDocument.value.numPages
        currentPage.value = 1
        currentPageInput.value = 1

        emit('pdf-loaded', {
          document: pdfDocument.value,
          totalPages: totalPages.value
        })

        // 渲染第一页
        await renderPage(currentPage.value)

      } catch (err) {
        console.error('PDF加载失败:', err)
        let errorMessage = 'PDF加载失败'

        if (err.name === 'InvalidPDFException') {
          errorMessage = '无效的PDF文件'
        } else if (err.name === 'MissingPDFException') {
          errorMessage = 'PDF文件未找到或无法访问'
        } else if (err.name === 'UnexpectedResponseException') {
          errorMessage = '服务器返回错误响应，请检查PDF链接'
        } else if (err.message && err.message.includes('CORS')) {
          errorMessage = '跨域访问被阻止，请检查服务器CORS配置'
        } else if (err.message) {
          errorMessage = `PDF加载失败: ${err.message}`
        }

        error.value = errorMessage
        emit('error', error.value)
      } finally {
        isLoading.value = false
        loadingProgress.value = 0
      }
    }

    // 渲染指定页面
    const renderPage = async (pageNum) => {
      if (!pdfDocument.value || !pdfCanvas.value) {
        console.error('PDF文档或Canvas未准备就绪')
        return
      }

      try {
        console.log(`开始渲染第 ${pageNum} 页`)

        // 获取页面
        const page = await pdfDocument.value.getPage(pageNum)
        console.log(`成功获取第 ${pageNum} 页`)

        // 计算缩放比例
        let scale = currentScale.value
        if (scale === 'auto') {
          const containerWidth = pdfContainer.value ? pdfContainer.value.clientWidth - 40 : 800
          const viewport = page.getViewport({ scale: 1.0 })
          scale = containerWidth / viewport.width
          currentScale.value = scale
          console.log(`自动缩放比例: ${scale}`)
        } else if (scale === 'page-fit') {
          const containerHeight = pdfContainer.value ? pdfContainer.value.clientHeight - 100 : 600
          const containerWidth = pdfContainer.value ? pdfContainer.value.clientWidth - 40 : 800
          const viewport = page.getViewport({ scale: 1.0 })
          const scaleX = containerWidth / viewport.width
          const scaleY = containerHeight / viewport.height
          scale = Math.min(scaleX, scaleY)
          currentScale.value = scale
          console.log(`适合页面缩放比例: ${scale}`)
        } else if (scale === 'page-width') {
          const containerWidth = pdfContainer.value ? pdfContainer.value.clientWidth - 40 : 800
          const viewport = page.getViewport({ scale: 1.0 })
          scale = containerWidth / viewport.width
          currentScale.value = scale
          console.log(`适合宽度缩放比例: ${scale}`)
        } else {
          console.log(`使用固定缩放比例: ${scale}`)
        }

        // 创建视口
        const viewport = page.getViewport({
          scale: scale,
          rotation: rotation.value
        })

        console.log(`视口尺寸: ${viewport.width} x ${viewport.height}`)

        // 设置canvas尺寸
        const canvas = pdfCanvas.value
        const context = canvas.getContext('2d')

        // 设置canvas实际尺寸
        const devicePixelRatio = window.devicePixelRatio || 1
        canvas.style.width = viewport.width + 'px'
        canvas.style.height = viewport.height + 'px'
        canvas.width = viewport.width * devicePixelRatio
        canvas.height = viewport.height * devicePixelRatio

        // 缩放context以适应设备像素比
        context.scale(devicePixelRatio, devicePixelRatio)

        console.log(`Canvas尺寸设置完成`)

        // 渲染PDF页面
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          enableWebGL: false
        }

        console.log(`开始渲染页面...`)
        await page.render(renderContext).promise
        console.log(`第 ${pageNum} 页渲染完成`)

        // 渲染文本层
        await renderTextLayer(page, viewport)

        emit('page-changed', {
          pageNum,
          totalPages: totalPages.value,
          scale: currentScale.value
        })

      } catch (err) {
        console.error('页面渲染失败:', err)
        let errorMessage = `页面渲染失败`

        if (err.message) {
          errorMessage += `: ${err.message}`
        }

        error.value = errorMessage
        emit('error', error.value)
      }
    }

    // 渲染文本层
    const renderTextLayer = async (page, viewport) => {
      if (!textLayer.value) return

      try {
        const textContent = await page.getTextContent()

        // 清空现有文本层
        textLayer.value.innerHTML = ''

        // 设置文本层样式
        textLayer.value.style.left = '0'
        textLayer.value.style.top = '0'
        textLayer.value.style.width = viewport.width + 'px'
        textLayer.value.style.height = viewport.height + 'px'

        // 简化的文本层渲染
        // 创建文本片段
        const textItems = textContent.items
        textItems.forEach((item) => {
          const textDiv = document.createElement('div')
          textDiv.style.position = 'absolute'
          textDiv.style.left = item.transform[4] + 'px'
          textDiv.style.top = (viewport.height - item.transform[5] - item.height) + 'px'
          textDiv.style.fontSize = item.height + 'px'
          textDiv.style.fontFamily = item.fontName
          textDiv.style.color = 'transparent'
          textDiv.textContent = item.str
          textLayer.value.appendChild(textDiv)
        })

      } catch (err) {
        console.warn('文本层渲染失败:', err)
        // 文本层渲染失败不影响主要功能
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
      if (pageNum >= 1 && pageNum <= totalPages.value && pageNum !== currentPage.value) {
        currentPage.value = pageNum
        currentPageInput.value = pageNum
        renderPage(currentPage.value)
      }
    }

    const validatePageInput = () => {
      const page = parseInt(currentPageInput.value)
      if (isNaN(page) || page < 1) {
        currentPageInput.value = 1
      } else if (page > totalPages.value) {
        currentPageInput.value = totalPages.value
      }
      goToPage(parseInt(currentPageInput.value))
    }

    // 缩放控制
    const zoomIn = () => {
      const newScale = Math.min(currentScale.value + scaleStep, maxScale)
      setScale(newScale)
    }

    const zoomOut = () => {
      const newScale = Math.max(currentScale.value - scaleStep, minScale)
      setScale(newScale)
    }

    const setScale = (scale) => {
      currentScale.value = scale
      renderPage(currentPage.value)
      emit('scale-changed', scale)
    }

    // 旋转控制
    const rotateLeft = () => {
      rotation.value = (rotation.value - 90) % 360
      renderPage(currentPage.value)
    }

    const rotateRight = () => {
      rotation.value = (rotation.value + 90) % 360
      renderPage(currentPage.value)
    }

    // 下载PDF
    const downloadPDF = () => {
      const link = document.createElement('a')
      link.href = props.pdfUrl
      link.download = props.fileName || 'document.pdf'
      link.target = '_blank'
      link.click()
    }

    // 全屏控制
    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        viewerContainer.value.requestFullscreen()
      } else {
        document.exitFullscreen()
      }
    }

    const handleFullscreenChange = () => {
      isFullscreen.value = !!document.fullscreenElement
    }

    // 缩略图控制
    const toggleThumbnails = () => {
      showThumbnails.value = !showThumbnails.value
    }

    // 事件处理
    const handleWheel = (event) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        if (event.deltaY < 0) {
          zoomIn()
        } else {
          zoomOut()
        }
      }
    }

    const handleCanvasClick = (event) => {
      if (isFullscreen.value) {
        const rect = pdfCanvas.value.getBoundingClientRect()
        const x = event.clientX - rect.left
        const canvasWidth = rect.width

        if (x < canvasWidth * 0.3) {
          previousPage()
        } else if (x > canvasWidth * 0.7) {
          nextPage()
        }
      }
    }

    // 重试加载
    const retryLoad = () => {
      error.value = ''
      loadPDF()
    }

    // 键盘快捷键
    const handleKeydown = (event) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          previousPage()
          break
        case 'ArrowRight':
          event.preventDefault()
          nextPage()
          break
        case 'ArrowUp':
          event.preventDefault()
          if (event.ctrlKey || event.metaKey) {
            previousPage()
          }
          break
        case 'ArrowDown':
          event.preventDefault()
          if (event.ctrlKey || event.metaKey) {
            nextPage()
          }
          break
        case '+':
        case '=':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            zoomIn()
          }
          break
        case '-':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            zoomOut()
          }
          break
        case 'Escape':
          if (isFullscreen.value) {
            document.exitFullscreen()
          }
          break
      }
    }

    // 监听器
    const addEventListeners = () => {
      document.addEventListener('fullscreenchange', handleFullscreenChange)
      document.addEventListener('keydown', handleKeydown)
    }

    const removeEventListeners = () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('keydown', handleKeydown)
    }

    // 监听props变化
    watch(() => props.pdfUrl, (newUrl) => {
      if (newUrl) {
        loadPDF()
      }
    }, { immediate: true })

    // 组件挂载
    onMounted(() => {
      addEventListeners()
    })

    // 组件卸载
    onUnmounted(() => {
      removeEventListeners()
      if (document.fullscreenElement) {
        document.exitFullscreen()
      }
    })

    return {
      // 数据
      pdfDocument,
      currentPage,
      totalPages,
      currentScale,
      rotation,
      isLoading,
      loadingProgress,
      error,
      isFullscreen,
      showThumbnails,
      currentPageInput,

      // DOM引用
      viewerContainer,
      pdfContainer,
      pdfCanvas,
      textLayer,

      // 方法
      previousPage,
      nextPage,
      goToPage,
      validatePageInput,
      zoomIn,
      zoomOut,
      setScale,
      rotateLeft,
      rotateRight,
      downloadPDF,
      toggleFullscreen,
      toggleThumbnails,
      handleWheel,
      handleCanvasClick,
      retryLoad
    }
  }
}
</script>

<style scoped>
.pdf-viewer-component {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 工具栏 */
.pdf-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
  z-index: 100;
}

.toolbar-left,
.toolbar-center,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.toolbar-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.toolbar-btn .btn-icon {
  font-size: 14px;
}

.toolbar-btn .btn-text {
  font-size: 12px;
}

/* 页面控制 */
.page-control {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.page-input {
  width: 50px;
  padding: 4px 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  text-align: center;
  font-size: 13px;
}

.page-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.page-separator {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.total-pages {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  min-width: 30px;
}

/* 缩放选择器 */
.zoom-select {
  padding: 6px 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 13px;
  cursor: pointer;
}

.zoom-select:focus {
  outline: none;
  border-color: #3b82f6;
}

.zoom-select option {
  background: #2a2a2a;
  color: white;
}

/* PDF容器 */
.pdf-container {
  flex: 1;
  position: relative;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 20px;
}

.loading-spinner {
  font-size: 48px;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
}

.loading-progress {
  width: 200px;
  text-align: center;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

/* 错误状态 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  text-align: center;
}

.error-icon {
  font-size: 64px;
}

.error-title {
  font-size: 18px;
  font-weight: 600;
  color: #ef4444;
}

.error-message {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  max-width: 400px;
}

.retry-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background: #ef4444;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

/* PDF画布 */
.pdf-canvas-container {
  position: relative;
  display: inline-block;
  margin: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  overflow: hidden;
}

.pdf-canvas {
  display: block;
  background: white;
  cursor: pointer;
}

.text-layer {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  opacity: 0.2;
  line-height: 1;
}

.text-layer :link {
  color: #069;
}

/* 全屏提示 */
.fullscreen-hints {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 20px;
  background: rgba(0, 0, 0, 0.8);
  padding: 12px 20px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 缩略图侧边栏 */
.thumbnail-sidebar {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 200px;
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(10px);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 200;
  display: flex;
  flex-direction: column;
  transform: translateX(0);
  transition: transform 0.3s ease;
}

.thumbnail-sidebar.hidden {
  transform: translateX(100%);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.close-sidebar {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-sidebar:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.thumbnails-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.thumbnail-item {
  cursor: pointer;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.thumbnail-item:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.thumbnail-item.active {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.thumbnail-canvas {
  width: 100%;
  height: auto;
  display: block;
  background: white;
}

.thumbnail-page-num {
  text-align: center;
  padding: 8px 0;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}

/* 缩略图切换按钮 */
.thumbnail-toggle {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(30, 30, 30, 0.9);
  color: white;
  font-size: 16px;
  cursor: pointer;
  z-index: 150;
  transition: all 0.2s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.thumbnail-toggle:hover {
  background: rgba(59, 130, 246, 0.9);
  transform: translateY(-50%) scale(1.1);
}

/* 动画 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pdf-toolbar {
    flex-direction: column;
    gap: 12px;
    padding: 12px;
  }

  .toolbar-left,
  .toolbar-center,
  .toolbar-right {
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }

  .toolbar-btn .btn-text {
    display: none;
  }

  .thumbnail-sidebar {
    width: 160px;
  }

  .fullscreen-hints {
    flex-direction: column;
    gap: 8px;
    bottom: 10px;
    padding: 8px 12px;
  }
}

@media (max-width: 480px) {
  .toolbar-btn {
    padding: 6px 8px;
    font-size: 12px;
  }

  .page-input {
    width: 40px;
    font-size: 12px;
  }

  .zoom-select {
    font-size: 12px;
    padding: 4px 6px;
  }

  .thumbnail-sidebar {
    width: 120px;
  }
}
</style>