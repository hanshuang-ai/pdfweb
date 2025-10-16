<template>
  <div class="pdf-viewer-container">
    <!-- 顶部工具栏 -->
    <div class="pdf-toolbar">
      <div class="toolbar-left">
        <h3 class="document-title">{{ fileName }}</h3>
      </div>
      <div class="toolbar-right">
        <button
          v-if="isLoaded"
          @click="showSaveDialog"
          class="save-button"
          :disabled="saving"
          title="保存当前PDF文件"
        >
          <span class="save-icon">💾</span>
          <span class="save-text">{{ saving ? '保存中...' : '保存' }}</span>
        </button>
      </div>
    </div>

    <!-- PDF查看器 -->
    <div class="pdf-content">
      <iframe
        ref="pdfFrame"
        :src="viewerUrl"
        class="pdf-iframe"
        @load="onIframeLoad"
      ></iframe>
    </div>

    <!-- 确认对话框 -->
    <ConfirmDialog
      :visible="showDialog"
      title="确认保存"
      message="确定要保存当前PDF文件并覆盖线上文件吗？此操作不可撤销。"
      type="danger"
      @confirm="savePDF"
      @cancel="cancelSave"
      @update:visible="showDialog = $event"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import ConfirmDialog from './ConfirmDialog.vue'

const pdfFrame = ref(null)
const isLoaded = ref(false)
const saving = ref(false)
const showDialog = ref(false)

// 从路由参数中获取PDF URL和文件名
const route = useRoute()
const pdfUrl = computed(() => {
  return route.query.url || 'https://fmatek5mfkum5gbd.public.blob.vercel-storage.com/1760518485116-09vp3lkeeri-1.JavaScript%E9%AB%98%E7%BA%A7%E7%A8%8B%E5%BA%8F%E8%AE%BE%E8%AE%A1%EF%BC%88%E7%AC%AC4%E7%89%88%EF%BC%89%5B%E5%89%8D%E7%AB%AF%E8%83%96%E5%A4%B4%E9%B1%BC%5D.pdf'
})

const fileName = computed(() => {
  const url = new URL(pdfUrl.value)
  return url.pathname.split('/').pop() || 'document.pdf'
})

// 构建viewer URL，包含PDF文件参数
const viewerUrl = computed(() => {
  const encodedPdfUrl = encodeURIComponent(pdfUrl.value)
  return `/web/viewer.html?file=${encodedPdfUrl}#enableAnnotationAPI=true`
})

const onIframeLoad = () => {
  isLoaded.value = true
  console.log('PDF viewer loaded successfully')
}

// 显示保存确认对话框
const showSaveDialog = () => {
  showDialog.value = true
}

// 取消保存
const cancelSave = () => {
  showDialog.value = false
}

// 保存PDF文件
const savePDF = async () => {
  showDialog.value = false
  saving.value = true

  try {
    console.log('=== PDF SAVE START ===')
    console.log('PDF URL:', pdfUrl.value)
    console.log('File name:', fileName.value)

    // 获取编辑后的PDF数据
    const editedPdfData = await getEditedPDFData()

    if (!editedPdfData) {
      throw new Error('无法获取编辑后的PDF数据')
    }

    // 获取pathname（从URL中提取路径部分）
    const url = new URL(pdfUrl.value)
    const pathname = url.pathname + url.search

    console.log('Extracted pathname:', pathname)

    // 调用更新API
    const response = await fetch('/api/update-pdf', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pathname: pathname,
        newPdfData: editedPdfData,
        mimeType: 'application/pdf'
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.details || `保存失败: ${response.statusText}`)
    }

    const result = await response.json()
    console.log('PDF saved successfully:', result)

    // 可以在这里添加成功提示
    alert('PDF文件保存成功！')

  } catch (error) {
    console.error('保存PDF失败:', error)
    alert(`保存失败: ${error.message}`)
  } finally {
    saving.value = false
  }
}

// 从PDF.js iframe中获取编辑后的PDF数据
const getEditedPDFData = async () => {
  return new Promise((resolve, reject) => {
    try {
      const iframe = pdfFrame.value
      if (!iframe || !iframe.contentWindow) {
        reject(new Error('PDF查看器未加载完成'))
        return
      }

      // 尝试获取PDF.js实例
      const PDFViewerApplication = iframe.contentWindow.PDFViewerApplication

      if (!PDFViewerApplication) {
        console.error('无法访问PDF.js API')
        reject(new Error('PDF.js API不可用'))
        return
      }

      console.log('PDF.js API可用，尝试获取编辑后的数据...')

      // 方法1: 尝试保存编辑后的文档
      if (PDFViewerApplication.pdfDocument && PDFViewerApplication.pdfDocument.saveDocument) {
        PDFViewerApplication.pdfDocument.saveDocument().then(data => {
          if (data && data.length > 0) {
            console.log('成功获取编辑后的PDF数据，大小:', data.length, 'bytes')
            // 转换为base64
            const reader = new FileReader()
            reader.onload = () => {
              const base64Data = reader.result
              console.log('PDF数据已转换为base64，长度:', base64Data.length)
              resolve(base64Data)
            }
            reader.readAsDataURL(new Blob([data], { type: 'application/pdf' }))
          } else {
            console.log('文档没有编辑内容，尝试触发下载获取数据')
            triggerDownloadAndCapture(iframe, resolve, reject)
          }
        }).catch(error => {
          console.warn('saveDocument失败，尝试触发下载:', error)
          triggerDownloadAndCapture(iframe, resolve, reject)
        })
      } else {
        console.log('pdfDocument.saveDocument不可用，尝试触发下载')
        triggerDownloadAndCapture(iframe, resolve, reject)
      }

    } catch (error) {
      console.error('获取PDF数据时出错:', error)
      reject(error)
    }
  })
}

// 通过触发下载来捕获PDF数据
const triggerDownloadAndCapture = (iframe, resolve, reject) => {
  try {
    const PDFViewerApplication = iframe.contentWindow.PDFViewerApplication

    // 拦截下载事件
    const originalCreateObjectURL = iframe.contentWindow.URL.createObjectURL
    const originalRevokeObjectURL = iframe.contentWindow.URL.revokeObjectURL

    let capturedBlob = null

    iframe.contentWindow.URL.createObjectURL = function(blob) {
      console.log('捕获到下载的Blob:', blob.type, blob.size, 'bytes')
      capturedBlob = blob
      return originalCreateObjectURL.call(this, blob)
    }

    // 监听下载开始
    const downloadHandler = (event) => {
      console.log('检测到下载事件:', event)
      if (capturedBlob) {
        // 转换为base64
        const reader = new FileReader()
        reader.onload = () => {
          const base64Data = reader.result
          console.log('下载的PDF数据已转换为base64，长度:', base64Data.length)

          // 恢复原始函数
          iframe.contentWindow.URL.createObjectURL = originalCreateObjectURL
          iframe.contentWindow.URL.revokeObjectURL = originalRevokeObjectURL
          iframe.contentWindow.removeEventListener('download', downloadHandler)

          resolve(base64Data)
        }
        reader.readAsDataURL(capturedBlob)
      } else {
        // 恢复原始函数
        iframe.contentWindow.URL.createObjectURL = originalCreateObjectURL
        iframe.contentWindow.URL.revokeObjectURL = originalRevokeObjectURL
        iframe.contentWindow.removeEventListener('download', downloadHandler)

        // 如果没有捕获到数据，获取原始PDF
        console.log('未能捕获下载的PDF数据，获取原始PDF')
        fetchOriginalPDF()
          .then(resolve)
          .catch(reject)
      }
    }

    iframe.contentWindow.addEventListener('download', downloadHandler)

    // 触发保存/下载
    if (PDFViewerApplication.download) {
      console.log('触发PDF.js下载功能')
      PDFViewerApplication.download()
    } else if (PDFViewerApplication.pdfDocument && PDFViewerApplication.pdfDocument.download) {
      console.log('触发PDF文档下载')
      PDFViewerApplication.pdfDocument.download()
    } else {
      console.log('无法触发下载，获取原始PDF')
      // 恢复原始函数
      iframe.contentWindow.URL.createObjectURL = originalCreateObjectURL
      iframe.contentWindow.URL.revokeObjectURL = originalRevokeObjectURL
      iframe.contentWindow.removeEventListener('download', downloadHandler)

      fetchOriginalPDF()
        .then(resolve)
        .catch(reject)
    }

    // 设置超时，如果5秒内没有捕获到数据，则使用原始PDF
    setTimeout(() => {
      if (!capturedBlob) {
        console.log('下载捕获超时，使用原始PDF')
        // 恢复原始函数
        iframe.contentWindow.URL.createObjectURL = originalCreateObjectURL
        iframe.contentWindow.URL.revokeObjectURL = originalRevokeObjectURL
        iframe.contentWindow.removeEventListener('download', downloadHandler)

        fetchOriginalPDF()
          .then(resolve)
          .catch(reject)
      }
    }, 5000)

  } catch (error) {
    console.error('触发下载时出错:', error)
    reject(error)
  }
}

// 获取原始PDF数据
const fetchOriginalPDF = async () => {
  try {
    const response = await fetch(pdfUrl.value)
    if (!response.ok) {
      throw new Error(`获取原始PDF失败: ${response.statusText}`)
    }
    const blob = await response.blob()

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('获取原始PDF失败:', error)
    throw error
  }
}

onMounted(() => {
  console.log('PDFViewer component mounted')
})
</script>

<style scoped>
.pdf-viewer-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

/* 顶部工具栏 */
.pdf-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-bottom: 1px solid #e9ecef;
  padding: 16px 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.document-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* PDF内容区域 */
.pdf-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}

/* 保存按钮样式 */
.save-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
  min-width: 90px;
  justify-content: center;
}

.save-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

.save-button:active:not(:disabled) {
  transform: translateY(0);
}

.save-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.save-icon {
  font-size: 16px;
  animation: pulse 2s ease-in-out infinite;
}

.save-text {
  font-size: 14px;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

/* 保存中动画 */
.save-button:disabled .save-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pdf-toolbar {
    padding: 12px 16px;
  }

  .document-title {
    font-size: 16px;
    max-width: 200px;
  }

  .save-button {
    padding: 8px 14px;
    min-width: 80px;
  }

  .save-icon {
    font-size: 14px;
  }

  .save-text {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .pdf-toolbar {
    padding: 8px 12px;
    flex-direction: column;
    gap: 8px;
  }

  .toolbar-left {
    width: 100%;
    justify-content: center;
  }

  .toolbar-right {
    width: 100%;
    justify-content: center;
  }

  .document-title {
    font-size: 14px;
    max-width: 100%;
    text-align: center;
  }

  .save-button {
    padding: 8px 12px;
    min-width: 70px;
  }

  .save-text {
    font-size: 12px;
  }
}
</style>
