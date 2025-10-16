<template>
  <div class="pdf-viewer-container">
    <!-- 保存按钮 -->
    <div class="save-button-container" v-if="isLoaded">
      <button
        @click="showSaveDialog"
        class="save-button"
        :disabled="saving"
        title="保存当前PDF文件"
      >
        <span class="save-icon">💾</span>
        <span class="save-text">{{ saving ? '保存中...' : '保存' }}</span>
      </button>
    </div>

    <!-- PDF查看器 -->
    <iframe
      ref="pdfFrame"
      :src="viewerUrl"
      class="pdf-iframe"
      @load="onIframeLoad"
    ></iframe>

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
        console.warn('无法访问PDF.js API，返回原始PDF URL')
        // 如果无法获取编辑数据，则返回原始PDF
        fetchOriginalPDF()
          .then(resolve)
          .catch(reject)
        return
      }

      // 尝试序列化PDF
      PDFViewerApplication.pdfDocument.saveDocument().then(data => {
        if (data) {
          // 转换为base64
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.readAsDataURL(new Blob([data], { type: 'application/pdf' }))
        } else {
          // 如果没有编辑内容，获取原始PDF
          fetchOriginalPDF()
            .then(resolve)
            .catch(reject)
        }
      }).catch(error => {
        console.warn('无法保存编辑的PDF，尝试获取原始PDF:', error)
        fetchOriginalPDF()
          .then(resolve)
          .catch(reject)
      })

    } catch (error) {
      console.error('获取PDF数据时出错:', error)
      reject(error)
    }
  })
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
  position: relative;
}

.pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 保存按钮样式 */
.save-button-container {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.save-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  min-width: 100px;
  justify-content: center;
}

.save-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
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
  .save-button-container {
    top: 10px;
    right: 10px;
  }

  .save-button {
    padding: 10px 16px;
    min-width: 80px;
  }

  .save-icon {
    font-size: 14px;
  }

  .save-text {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .save-button-container {
    top: 8px;
    right: 8px;
  }

  .save-button {
    padding: 8px 12px;
    min-width: 70px;
    flex-direction: column;
    gap: 4px;
  }
}
</style>
