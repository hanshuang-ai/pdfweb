<template>
  <div class="pdf-editor">
    <div class="editor-header">
      <button @click="goBack" class="back-btn">
        ⬅️ 返回列表
      </button>
      <h1 class="editor-title">PDF 编辑器</h1>
      <div class="header-actions">
        <button @click="downloadPDF" class="download-btn">
          📥 下载副本
        </button>
        <button @click="saveToServer" :disabled="saving" class="save-btn">
          <span v-if="saving" class="saving-icon">⏳</span>
          <span v-else class="save-icon">💾</span>
          {{ saving ? '保存中...' : '覆盖保存' }}
        </button>
      </div>
    </div>

    <PDFReader
      :pdf-url="pdfUrl"
      :file-name="fileName"
      :original-pathname="originalPathname"
      ref="pdfReader"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PDFReader from './PDFReader.vue'
import { put } from '@vercel/blob'
import { blobConfig } from '../utils/blobConfig.js'

export default {
  name: 'PDFEditor',
  components: {
    PDFReader
  },
  setup() {
    const router = useRouter();

    return {
      router
    };
  },
  data() {
    return {
      pdfUrl: '',
      fileName: '',
      originalPathname: '',
      saving: false
    }
  },
  methods: {
    // 初始化页面参数
    initPage() {
      const urlParams = new URLSearchParams(window.location.search)
      const file = urlParams.get('file')

      if (file) {
        try {
          const fileData = JSON.parse(decodeURIComponent(file))
          this.pdfUrl = fileData.url
          this.fileName = fileData.name
          this.originalPathname = fileData.pathname

          // 更新页面标题
          document.title = `编辑 ${this.fileName} - 文件阅读管理`
        } catch (err) {
          console.error('解析文件参数失败:', err)
          window.$toast.error('参数错误', '无法解析文件信息')
          this.router.push('/')
        }
      } else {
        window.$toast.error('参数缺失', '未找到文件信息')
        this.router.push('/')
      }
    },

    // 返回文件列表
    goBack() {
      this.router.push('/')
    },

    // 下载 PDF 副本
    downloadPDF() {
      if (!this.pdfUrl) return

      const link = document.createElement('a')
      link.href = this.pdfUrl
      link.download = this.fileName
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      window.$toast.success('下载成功', 'PDF 副本已开始下载')
    },

    // 保存到服务器（覆盖原文件）
    async saveToServer() {
      if (!this.originalPathname) {
        window.$toast.error('保存失败', '文件路径信息缺失')
        return
      }

      this.saving = true

      try {
        // 显示确认对话框
        const confirmed = await window.$confirm({
          title: '确认覆盖保存',
          message: `确定要覆盖保存文件 "${this.fileName}" 吗？`,
          details: '此操作将用当前版本覆盖原文件，无法撤销。建议先下载备份。',
          confirmText: '确认覆盖',
          cancelText: '取消',
          type: 'danger'
        })

        if (!confirmed) {
          this.saving = false
          return
        }

        // 获取当前 PDF 数据（这里我们简单地重新下载原文件）
        // 在实际应用中，这里应该是编辑后的 PDF 数据
        const response = await fetch(this.pdfUrl)
        if (!response.ok) {
          throw new Error('无法获取当前 PDF 数据')
        }

        const pdfData = await response.blob()
        const base64Data = await this.blobToBase64(pdfData)

        // 调用 API 保存到服务器
        const saveResponse = await fetch('/api/update-pdf', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pathname: this.originalPathname,
            newPdfData: base64Data,
            mimeType: 'application/pdf'
          })
        })

        if (!saveResponse.ok) {
          const errorData = await saveResponse.json()
          throw new Error(errorData.details || `保存失败: ${saveResponse.statusText}`)
        }

        const result = await saveResponse.json()
        console.log('PDF 保存成功:', result)

        window.$toast.success('保存成功', '文件已成功保存到服务器')

        // 可以在这里添加更多保存后的操作
        // 例如：刷新缓存、更新文件信息等

      } catch (err) {
        console.error('保存失败:', err)
        window.$toast.error('保存失败', `保存过程中出错: ${err.message}`)
      } finally {
        this.saving = false
      }
    },

    // 将 Blob 转换为 Base64
    blobToBase64(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    }
  },
  mounted() {
    this.initPage()
  },
  beforeRouteUpdate(to, from, next) {
    this.initPage()
    next()
  }
}
</script>

<style scoped>
.pdf-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.editor-header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.back-btn {
  background: #f0f0f0;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.back-btn:hover {
  background: #e0e0e0;
  transform: translateY(-1px);
}

.editor-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.download-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.download-btn:hover {
  background: #5a6268;
  transform: translateY(-1px);
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

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }

  .header-actions {
    width: 100%;
    justify-content: center;
  }

  .editor-title {
    font-size: 18px;
  }
}
</style>