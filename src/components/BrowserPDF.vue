<template>
  <div class="pdf-viewer-wrapper">
    <!-- 简化的顶部工具栏 -->
    <div class="top-toolbar" v-if="!isUsingPDFJS">
      <button @click="goBack" class="back-btn" title="返回文件列表">
        <span class="btn-icon">←</span>
        <span class="btn-text">返回</span>
      </button>
      <div class="file-info" v-if="fileName">
        <span class="file-name">{{ fileName }}</span>
      </div>
      <div class="toolbar-spacer"></div>
      <button @click="toggleViewer" class="toggle-viewer-btn" :title="isUsingPDFJS ? '切换到浏览器模式' : '切换到PDF.js模式'">
        <span class="btn-icon">{{ isUsingPDFJS ? '🌐' : '📄' }}</span>
        <span class="btn-text">{{ isUsingPDFJS ? '浏览器模式' : 'PDF.js模式' }}</span>
      </button>
      <input
        v-if="!isUsingPDFJS"
        v-model="url"
        @keyup.enter="loadNewURL"
        placeholder="输入PDF链接..."
        class="url-input"
      />
    </div>

    <!-- PDF.js查看器 -->
    <PDFViewer
      v-if="isUsingPDFJS"
      :pdf-url="url"
      :file-name="fileName"
      :initial-scale="initialScale"
      @pdf-loaded="onPDFLoaded"
      @page-changed="onPageChanged"
      @scale-changed="onScaleChanged"
      @error="onPDFError"
    />

    <!-- 浏览器iframe查看器 -->
    <div v-else class="browser-viewer">
      <div class="pdf-container" @click="handleContainerClick">
        <!-- PDF iframe -->
        <div class="pdf-frame-wrapper">
          <iframe
            :src="pdfUrl"
            class="pdf-frame"
            ref="iframeRef"
            @load="onIframeLoad"
            @error="onIframeError"
          ></iframe>

          <!-- 加载状态 -->
          <div v-if="loading" class="loading-overlay">
            <div class="loading-spinner">⏳</div>
            <div class="loading-text">正在加载PDF...</div>
          </div>

          <!-- 错误状态 -->
          <div v-if="error" class="error-overlay">
            <div class="error-icon">❌</div>
            <div class="error-text">PDF加载失败</div>
            <div class="error-message">{{ error }}</div>
            <button @click="retryLoad" class="retry-btn">重试</button>
          </div>
        </div>
      </div>
    </div>

    <!-- PDF.js模式下的状态栏 -->
    <div class="status-bar" v-if="isUsingPDFJS && pdfStatus.pageNum">
      <div class="status-left">
        <span>第 {{ pdfStatus.pageNum }} 页 / 共 {{ pdfStatus.totalPages }} 页</span>
        <span class="separator">|</span>
        <span>缩放: {{ Math.round(pdfStatus.scale * 100) }}%</span>
      </div>
      <div class="status-right">
        <span v-if="fileName">{{ fileName }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PDFViewer from './PDFViewer.vue'

export default {
  name: 'BrowserPDF',
  components: {
    PDFViewer
  },
  setup() {
    const route = useRoute()
    const router = useRouter()

    // 默认示例PDF - 使用用户提供的链接
    const defaultUrl = 'https://www.pwithe.com/Public/Upload/download/20170211/589ebf8e5bb13.pdf'

    // 从路由参数获取URL和文件名
    const initial = route.query.url || defaultUrl
    const fileName = route.query.fileName || ''

    // 响应式数据
    const url = ref(initial)
    const iframeRef = ref(null)
    const loading = ref(false)
    const error = ref('')
    const isUsingPDFJS = ref(true) // 默认使用PDF.js
    const initialScale = ref('page-width')

    // PDF.js状态
    const pdfStatus = ref({
      pageNum: 0,
      totalPages: 0,
      scale: 1
    })

    // 计算属性 - PDF URL (用于iframe模式)
    const pdfUrl = computed(() => {
      const timestamp = new Date().getTime()
      return `${url.value}#toolbar=0&navpanes=0&scrollbar=0&t=${timestamp}`
    })

    // 切换查看器
    const toggleViewer = () => {
      isUsingPDFJS.value = !isUsingPDFJS.value
      if (!isUsingPDFJS.value) {
        loading.value = true
      }
    }

    // 处理容器点击（浏览器模式）
    const handleContainerClick = (event) => {
      // 在浏览器模式下可以添加一些交互逻辑
    }

    // 刷新PDF（浏览器模式）
    const refreshPDF = () => {
      loading.value = true
      error.value = ''
      if (iframeRef.value) {
        const currentSrc = iframeRef.value.src
        iframeRef.value.src = ''
        setTimeout(() => {
          iframeRef.value.src = currentSrc
        }, 100)
      }
    }

    // 加载新URL
    const loadNewURL = () => {
      if (url.value.trim()) {
        loading.value = true
        error.value = ''
        // iframe会自动重新加载，因为使用了计算属性pdfUrl
      }
    }

    // 返回
    const goBack = () => {
      router.push('/')
    }

    // 重试加载
    const retryLoad = () => {
      error.value = ''
      if (isUsingPDFJS.value) {
        // PDF.js模式会自动重试
      } else {
        refreshPDF()
      }
    }

    // iframe加载完成
    const onIframeLoad = () => {
      loading.value = false
      error.value = ''
    }

    // iframe加载错误
    const onIframeError = () => {
      loading.value = false
      error.value = '无法加载PDF文件，请检查链接是否正确'
    }

    // PDF.js事件处理
    const onPDFLoaded = (data) => {
      console.log('PDF加载完成:', data)
      pdfStatus.value.totalPages = data.totalPages
    }

    const onPageChanged = (data) => {
      pdfStatus.value.pageNum = data.pageNum
      pdfStatus.value.totalPages = data.totalPages
    }

    const onScaleChanged = (scale) => {
      pdfStatus.value.scale = scale
    }

    const onPDFError = (errorMessage) => {
      error.value = errorMessage
    }

    // 组件挂载
    onMounted(() => {
      // 设置初始状态
      if (!isUsingPDFJS.value) {
        loading.value = true
      }

      // 更新页面标题
      if (fileName) {
        document.title = `${fileName} - PDF查看器`
      } else {
        document.title = 'PDF查看器 - 文件阅读管理'
      }
    })

    return {
      // 数据
      url,
      fileName,
      iframeRef,
      loading,
      error,
      isUsingPDFJS,
      initialScale,
      pdfStatus,
      pdfUrl,

      // 方法
      toggleViewer,
      handleContainerClick,
      refreshPDF,
      loadNewURL,
      goBack,
      retryLoad,
      onIframeLoad,
      onIframeError,
      onPDFLoaded,
      onPageChanged,
      onScaleChanged,
      onPDFError
    }
  }
}
</script>

<style scoped>
/* 主容器 */
.pdf-viewer-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
}

/* 顶部工具栏 */
.top-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
  z-index: 100;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 16px;
}

.btn-text {
  font-size: 13px;
}

/* 文件信息 */
.file-info {
  flex-shrink: 0;
}

.file-name {
  font-weight: 600;
  color: white;
  font-size: 14px;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toolbar-spacer {
  flex: 1;
}

/* 切换查看器按钮 */
.toggle-viewer-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: #10b981;
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.toggle-viewer-btn:hover {
  background: #059669;
  transform: translateY(-1px);
}

/* URL输入框 */
.url-input {
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 14px;
  width: 300px;
  transition: all 0.2s ease;
}

.url-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.url-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

/* 浏览器查看器 */
.browser-viewer {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
}

.pdf-container {
  flex: 1;
  position: relative;
  background: #000;
}

.pdf-frame-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pdf-frame {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}

/* 加载状态 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.loading-spinner {
  font-size: 48px;
  margin-bottom: 16px;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: white;
  font-size: 16px;
  font-weight: 500;
}

/* 错误状态 */
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(220, 38, 38, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.error-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.error-text {
  color: #dc2626;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.error-message {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin-bottom: 20px;
  max-width: 400px;
  text-align: center;
}

.retry-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background: #dc2626;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: #b91c1c;
  transform: translateY(-1px);
}

/* 状态栏 */
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 20px;
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
}

.status-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.separator {
  color: rgba(255, 255, 255, 0.5);
}

.status-right {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .top-toolbar {
    flex-wrap: wrap;
    gap: 12px;
    padding: 8px 12px;
  }

  .back-btn .btn-text,
  .toggle-viewer-btn .btn-text {
    display: none;
  }

  .file-name {
    max-width: 150px;
    font-size: 12px;
  }

  .url-input {
    width: 200px;
    font-size: 13px;
  }

  .status-bar {
    flex-direction: column;
    gap: 4px;
    padding: 6px 12px;
    font-size: 11px;
  }

  .status-left {
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .top-toolbar {
    gap: 8px;
  }

  .back-btn,
  .toggle-viewer-btn {
    padding: 6px 10px;
  }

  .file-name {
    max-width: 100px;
    font-size: 11px;
  }

  .url-input {
    width: 100%;
    order: 3;
    flex-basis: 100%;
    margin-top: 4px;
  }

  .loading-spinner {
    font-size: 36px;
  }

  .loading-text {
    font-size: 14px;
  }

  .error-icon {
    font-size: 48px;
  }

  .error-text {
    font-size: 16px;
  }

  .error-message {
    font-size: 12px;
  }
}
</style>
