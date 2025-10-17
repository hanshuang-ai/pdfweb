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
import { blobConfig } from '../utils/blobConfig.js'

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
  // 添加时间戳参数防止缓存
  const timestamp = Date.now()
  const cacheBuster = `&_t=${timestamp}`
  return `/web/viewer.html?file=${encodedPdfUrl}${cacheBuster}#enableAnnotationAPI=true`
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
    const pathname = url.pathname

    console.log('Extracted pathname:', pathname)

    // 将base64转换为Blob
    const pdfBlob = await fetch(editedPdfData).then(res => res.blob())
    console.log('PDF blob size:', pdfBlob.size, 'bytes')

    // 使用SDK方式保存
    await saveDirectly(pathname, pdfBlob)

    // 显示成功提示
    if (window.$toast) {
      window.$toast.success('保存成功', 'PDF文件已成功保存并覆盖线上文件')
    }

  } catch (error) {
    console.error('保存PDF失败:', error)
    if (window.$toast) {
      window.$toast.error('保存失败', `保存PDF时出错: ${error.message}`)
    }
  } finally {
    saving.value = false
  }
}


// 直接上传到Vercel Blob (使用官方推荐的SDK方式)
const saveDirectly = async (pathname, pdfBlob) => {
  console.log('Using Vercel Blob SDK for PDF upload...')

  // 导入Vercel Blob客户端SDK
  const { put } = await import('@vercel/blob')

  console.log('Uploading PDF directly to Vercel Blob...')
  console.log('Original pathname:', pathname)
  console.log('File size:', pdfBlob.size, 'bytes')

  try {
    // 使用SDK方式，添加随机后缀避免覆盖问题，同时避免CORS问题
    const blob = await put(pathname, pdfBlob, {
      access: 'public',
      token: blobConfig.token,
      contentType: 'application/pdf',
      addRandomSuffix: true  // 使用官方推荐的方式避免文件名冲突
    })

    console.log('PDF saved successfully:', blob.url)
    return { url: blob.url }
  } catch (error) {
    console.error('SDK upload failed:', error)

    // 如果SDK方式失败，尝试生成唯一文件名的方式
    console.log('Attempting with unique filename...')
    const timestamp = Date.now()
    const uniquePathname = pathname.replace(/\.pdf$/, `_edited_${timestamp}.pdf`)

    const blob = await put(uniquePathname, pdfBlob, {
      access: 'public',
      token: blobConfig.token,
      contentType: 'application/pdf'
    })

    console.log('PDF saved with unique filename:', blob.url)
    return { url: blob.url }
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

      console.log('尝试触发PDF.js内部保存按钮...')

      // 尝试找到并点击PDF.js的保存按钮
      const saveButton = iframe.contentWindow.document.querySelector('#download, .download, [title*="download"], [title*="保存"]')

      if (saveButton) {
        console.log('找到PDF.js保存按钮，触发点击事件')

        // 设置下载拦截
        setupDownloadInterception(iframe, resolve, reject)

        // 触发点击事件
        saveButton.click()

        // 设置超时
        // setTimeout(() => {
        //   console.log('保存超时，使用原始PDF')
        //   fetchOriginalPDF()
        //     .then(resolve)
        //     .catch(reject)
        // }, 5000)

      } else {
        console.log('未找到PDF.js保存按钮，尝试其他方法')
        // 备用方案：调用PDF.js API
        tryPDFViewerAPI(iframe, resolve, reject)
      }

    } catch (error) {
      console.error('获取PDF数据时出错:', error)
      reject(error)
    }
  })
}

// 设置下载拦截
const setupDownloadInterception = (iframe, resolve, reject) => {
  try {
    const originalCreateObjectURL = iframe.contentWindow.URL.createObjectURL

    iframe.contentWindow.URL.createObjectURL = function(blob) {
      console.log('捕获到下载的Blob:', blob.type, blob.size, 'bytes')

      // 恢复原始函数
      iframe.contentWindow.URL.createObjectURL = originalCreateObjectURL

      // 转换为base64
      const reader = new FileReader()
      reader.onload = () => {
        const base64Data = reader.result
        console.log('PDF数据已转换为base64，长度:', base64Data.length)
        resolve(base64Data)
      }
      reader.readAsDataURL(blob)

      return originalCreateObjectURL.call(this, blob)
    }
  } catch (error) {
    console.error('设置下载拦截失败:', error)
  }
}

// 备用方案：调用PDF.js API
const tryPDFViewerAPI = (iframe, resolve, reject) => {
  try {
    const PDFViewerApplication = iframe.contentWindow.PDFViewerApplication

    if (PDFViewerApplication && PDFViewerApplication.download) {
      console.log('调用PDFViewerApplication.download()')
      setupDownloadInterception(iframe, resolve, reject)
      PDFViewerApplication.download()
    } else {
      console.log('PDF.js API不可用，获取原始PDF')
      fetchOriginalPDF()
        .then(resolve)
        .catch(reject)
    }
  } catch (error) {
    console.error('调用PDF.js API失败:', error)
    fetchOriginalPDF()
      .then(resolve)
      .catch(reject)
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
