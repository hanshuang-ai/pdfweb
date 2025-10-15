<template>
  <div class="pdf-viewer" :class="{ 'fullscreen': isFullscreen }">
    <!-- 浮动工具栏 -->
    <div class="floating-toolbar" :class="{ 'toolbar-hidden': isFullscreen && !showToolbar }">
      <div class="toolbar-content">
        <!-- 左侧操作区 -->
        <div class="toolbar-left">
          <button @click="goBack" class="toolbar-btn back-btn" title="返回文件列表">
            <span class="btn-icon">←</span>
            <span class="btn-text">返回</span>
          </button>
          <div class="file-info" v-if="fileName">
            <span class="file-name">{{ fileName }}</span>
          </div>
        </div>

        <!-- 中间控制区 -->
        <div class="toolbar-center">
          <button @click="toggleFullscreen" class="toolbar-btn fullscreen-btn" :title="isFullscreen ? '退出全屏' : '进入全屏'">
            <span class="btn-icon">{{ isFullscreen ? '⛶' : '⛶' }}</span>
            <span class="btn-text">{{ isFullscreen ? '退出全屏' : '全屏' }}</span>
          </button>
          <button @click="refreshPDF" class="toolbar-btn refresh-btn" title="刷新PDF">
            <span class="btn-icon">↻</span>
            <span class="btn-text">刷新</span>
          </button>
          <button @click="openNewTab" class="toolbar-btn new-tab-btn" title="在新标签打开">
            <span class="btn-icon">⎘</span>
            <span class="btn-text">新标签</span>
          </button>
        </div>

        <!-- 右侧地址区 -->
        <div class="toolbar-right">
          <input
            v-model="url"
            @keyup.enter="loadNewURL"
            placeholder="输入PDF链接..."
            class="url-input"
          />
        </div>
      </div>
    </div>

    <!-- PDF显示区域 -->
    <div class="pdf-container" @click="handleContainerClick">
      <!-- 全屏模式下的工具栏触发区域 -->
      <div v-if="isFullscreen" class="fullscreen-trigger" @click="toggleToolbar">
        <div class="trigger-hint">点击显示/隐藏工具栏</div>
      </div>

      <!-- PDF iframe -->
      <div class="pdf-frame-wrapper" :class="{ 'fullscreen-frame': isFullscreen }">
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

    <!-- 快捷键提示 -->
    <div v-if="isFullscreen" class="shortcuts-hint">
      <div class="hint-item">
        <kbd>F11</kbd> 全屏/退出
      </div>
      <div class="hint-item">
        <kbd>Esc</kbd> 退出全屏
      </div>
      <div class="hint-item">
        <kbd>F5</kbd> 刷新
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export default {
  name: 'BrowserPDF',
  setup() {
    const route = useRoute()
    const router = useRouter()

    // 默认示例PDF
    const defaultUrl = 'https://fmatek5mfkum5gbd.public.blob.vercel-storage.com/1760506598654-5481ozc9d8m-1.JavaScript%E9%AB%98%E7%BA%A7%E7%A8%8B%E5%BA%8F%E8%AE%BE%E8%AE%A1%EF%BC%88%E7%AC%AC4%E7%89%88%EF%BC%89%5B%E5%89%8D%E7%AB%AF%E8%83%96%E5%A4%B4%E9%B1%BC%5D.pdf'

    // 从路由参数获取URL和文件名
    const initial = route.query.url || defaultUrl
    const fileName = route.query.fileName || ''

    // 响应式数据
    const url = ref(initial)
    const iframeRef = ref(null)
    const isFullscreen = ref(false)
    const showToolbar = ref(true)
    const loading = ref(false)
    const error = ref('')
    const toolbarTimer = ref(null)

    // 计算属性 - PDF URL (添加时间戳避免缓存)
    const pdfUrl = computed(() => {
      const timestamp = new Date().getTime()
      return `${url.value}#toolbar=0&navpanes=0&scrollbar=0&t=${timestamp}`
    })

    // 全屏切换
    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        enterFullscreen()
      } else {
        exitFullscreen()
      }
    }

    // 进入全屏
    const enterFullscreen = () => {
      const element = document.documentElement
      if (element.requestFullscreen) {
        element.requestFullscreen()
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen()
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen()
      }
    }

    // 退出全屏
    const exitFullscreen = () => {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen()
      }
    }

    // 切换工具栏显示
    const toggleToolbar = () => {
      showToolbar.value = !showToolbar.value

      // 自动隐藏工具栏
      if (showToolbar.value) {
        clearTimeout(toolbarTimer.value)
        toolbarTimer.value = setTimeout(() => {
          if (isFullscreen.value) {
            showToolbar.value = false
          }
        }, 5000)
      }
    }

    // 显示工具栏
    const showToolbarTemporarily = () => {
      if (isFullscreen.value) {
        showToolbar.value = true
        clearTimeout(toolbarTimer.value)
        toolbarTimer.value = setTimeout(() => {
          showToolbar.value = false
        }, 3000)
      }
    }

    // 处理容器点击
    const handleContainerClick = (event) => {
      if (isFullscreen.value) {
        // 如果点击的不是按钮或输入框，则切换工具栏
        if (!event.target.closest('.toolbar-btn') && !event.target.closest('.url-input')) {
          toggleToolbar()
        }
      }
    }

    // 刷新PDF
    const refreshPDF = () => {
      loading.value = true
      error.value = ''
      if (iframeRef.value) {
        // 强制重新加载iframe
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

    // 在新标签打开
    const openNewTab = () => {
      window.open(url.value, '_blank')
    }

    // 返回
    const goBack = () => {
      router.push('/')
    }

    // 重试加载
    const retryLoad = () => {
      error.value = ''
      refreshPDF()
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

    // 监听全屏变化
    const handleFullscreenChange = () => {
      isFullscreen.value = !!document.fullscreenElement
      if (!isFullscreen.value) {
        showToolbar.value = true
        clearTimeout(toolbarTimer.value)
      } else {
        // 进入全屏时，3秒后自动隐藏工具栏
        toolbarTimer.value = setTimeout(() => {
          showToolbar.value = false
        }, 3000)
      }
    }

    // 键盘快捷键
    const handleKeydown = (event) => {
      switch (event.key) {
        case 'F11':
          event.preventDefault()
          toggleFullscreen()
          break
        case 'Escape':
          if (isFullscreen.value) {
            exitFullscreen()
          }
          break
        case 'F5':
          event.preventDefault()
          refreshPDF()
          break
      }
    }

    // 组件挂载
    onMounted(() => {
      // 设置初始状态
      loading.value = true

      // 更新页面标题
      if (fileName) {
        document.title = `${fileName} - PDF查看器`
      } else {
        document.title = 'PDF查看器 - 文件阅读管理'
      }

      // 添加事件监听
      document.addEventListener('fullscreenchange', handleFullscreenChange)
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.addEventListener('keydown', handleKeydown)
      document.addEventListener('mousemove', showToolbarTemporarily)
    })

    // 组件卸载
    onUnmounted(() => {
      // 清理事件监听和定时器
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('keydown', handleKeydown)
      document.removeEventListener('mousemove', showToolbarTemporarily)
      clearTimeout(toolbarTimer.value)

      // 退出全屏模式
      if (document.fullscreenElement) {
        exitFullscreen()
      }
    })

    return {
      // 数据
      url,
      fileName,
      iframeRef,
      isFullscreen,
      showToolbar,
      loading,
      error,
      pdfUrl,

      // 方法
      toggleFullscreen,
      toggleToolbar,
      handleContainerClick,
      refreshPDF,
      loadNewURL,
      openNewTab,
      goBack,
      retryLoad,
      onIframeLoad,
      onIframeError
    }
  }
}
</script>

<style scoped>
/* 主容器 */
.pdf-viewer {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: #1a1a1a;
  overflow: hidden;
  transition: all 0.3s ease;
}

.pdf-viewer.fullscreen {
  background: #000;
}

/* 浮动工具栏 */
.floating-toolbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  transform: translateY(0);
}

.floating-toolbar.toolbar-hidden {
  transform: translateY(-100%);
}

.toolbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  gap: 20px;
  max-width: 100%;
}

/* 工具栏区域布局 */
.toolbar-left,
.toolbar-center,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-left {
  flex: 0 0 auto;
}

.toolbar-center {
  flex: 0 0 auto;
}

.toolbar-right {
  flex: 1;
  max-width: 400px;
}

/* 文件信息 */
.file-info {
  display: flex;
  align-items: center;
}

.file-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 工具栏按钮 */
.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  background: #f3f4f6;
  color: #374151;
}

.toolbar-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.back-btn {
  background: #6c757d;
  color: white;
}

.back-btn:hover {
  background: #5a6268;
}

.fullscreen-btn {
  background: #10b981;
  color: white;
}

.fullscreen-btn:hover {
  background: #059669;
}

.refresh-btn {
  background: #3b82f6;
  color: white;
}

.refresh-btn:hover {
  background: #2563eb;
}

.new-tab-btn {
  background: #8b5cf6;
  color: white;
}

.new-tab-btn:hover {
  background: #7c3aed;
}

.btn-icon {
  font-size: 16px;
}

.btn-text {
  font-size: 13px;
}

/* URL输入框 */
.url-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  color: #1f2937;
  transition: all 0.2s ease;
}

.url-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.url-input::placeholder {
  color: #9ca3af;
}

/* PDF容器 */
.pdf-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
}

/* 全屏触发区域 */
.fullscreen-trigger {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.pdf-container:hover .fullscreen-trigger {
  opacity: 1;
  pointer-events: auto;
}

.trigger-hint {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.trigger-hint:hover {
  background: rgba(0, 0, 0, 0.9);
}

/* PDF框架包装器 */
.pdf-frame-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pdf-frame-wrapper.fullscreen-frame {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
}

/* PDF iframe */
.pdf-frame {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
  border-radius: 0;
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
  color: #7f1d1d;
  font-size: 14px;
  margin-bottom: 20px;
  max-width: 400px;
  text-align: center;
}

.retry-btn {
  background: #dc2626;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: #b91c1c;
  transform: translateY(-1px);
}

/* 快捷键提示 */
.shortcuts-hint {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-size: 12px;
}

.hint-item kbd {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
  border: 1px solid rgba(255, 255, 255, 0.3);
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

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar-content {
    padding: 8px 12px;
    gap: 8px;
    flex-wrap: wrap;
  }

  .toolbar-left,
  .toolbar-center,
  .toolbar-right {
    gap: 8px;
  }

  .toolbar-right {
    order: 3;
    flex-basis: 100%;
    max-width: none;
    margin-top: 4px;
  }

  .file-name {
    max-width: 120px;
    font-size: 12px;
  }

  .btn-text {
    display: none;
  }

  .toolbar-btn {
    padding: 8px 10px;
  }

  .btn-icon {
    font-size: 14px;
  }

  .shortcuts-hint {
    bottom: 10px;
    right: 10px;
    padding: 12px;
  }

  .hint-item {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .toolbar-content {
    padding: 6px 8px;
  }

  .toolbar-left {
    order: 1;
  }

  .toolbar-center {
    order: 2;
    margin-left: auto;
  }

  .toolbar-right {
    order: 3;
    margin-top: 8px;
  }

  .url-input {
    font-size: 13px;
    padding: 6px 10px;
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

/* 全屏模式下的特殊样式 */
.pdf-viewer.fullscreen .floating-toolbar {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
}

.pdf-viewer.fullscreen .toolbar-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.pdf-viewer.fullscreen .toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.pdf-viewer.fullscreen .file-name {
  color: white;
}

.pdf-viewer.fullscreen .url-input {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
}

.pdf-viewer.fullscreen .url-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.pdf-viewer.fullscreen .url-input:focus {
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
}
</style>
