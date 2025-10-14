<template>
  <div class="upload-card">
    <div class="card-header">
      <div class="header-icon">📤</div>
      <div class="header-text">
        <h2>文件上传</h2>
        <p>安全快速的上传体验</p>
      </div>
    </div>

    <!-- 状态信息 -->
    <div class="status-panel">
      <div class="status-item">
        <div class="status-icon">☁️</div>
        <div class="status-text">
          <span class="status-label">存储模式</span>
          <span class="status-value">{{ blobInfo.mode }}</span>
        </div>
      </div>
      <div class="status-item">
        <div class="status-icon">🌍</div>
        <div class="status-text">
          <span class="status-label">存储地区</span>
          <span class="status-value">{{ blobInfo.region }}</span>
        </div>
      </div>
      <div class="status-item">
        <div class="status-icon">⚡</div>
        <div class="status-text">
          <span class="status-label">连接状态</span>
          <span class="status-value" :class="{ 'status-good': blobInfo.status.includes('已配置') }">
            {{ blobInfo.status }}
          </span>
        </div>
      </div>
    </div>

    <!-- 上传区域 -->
    <div
      class="upload-zone"
      :class="{
        'dragover': isDragOver,
        'has-file': selectedFile,
        'uploading': uploading
      }"
      @click="triggerFileInput"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <div class="upload-zone-content">
        <div class="upload-icon" :class="{ 'icon-animate': uploading }">
          <div v-if="!selectedFile" class="icon-idle">📁</div>
          <div v-else-if="uploading" class="icon-uploading">⏳</div>
          <div v-else class="icon-ready">✅</div>
        </div>

        <div class="upload-text">
          <h3 v-if="!selectedFile">
            拖拽文件到这里
          </h3>
          <h3 v-else-if="uploading">
            正在上传...
          </h3>
          <h3 v-else>
            准备就绪
          </h3>

          <p v-if="!selectedFile" class="upload-hint">
            或者 <span class="link-text">点击选择文件</span>
            <br><small style="color: #94a3b8;">支持最大 100MB 文件上传</small>
          </p>
          <p v-else-if="uploading" class="upload-hint">
            请稍候，文件正在处理中
          </p>
          <p v-else class="upload-hint">
            {{ selectedFile.name }}
          </p>
        </div>

        <input
          ref="fileInput"
          type="file"
          class="upload-input"
          @change="handleFileSelect"
        />
      </div>
    </div>

    <!-- 文件信息卡片 -->
    <div v-if="selectedFile" class="file-card">
      <div class="file-header">
        <div class="file-icon">📄</div>
        <div class="file-details">
          <h4>{{ selectedFile.name }}</h4>
          <div class="file-meta">
            <span class="meta-item">{{ formatFileSize(selectedFile.size) }}</span>
            <span class="meta-item">{{ selectedFile.type || '未知类型' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 上传按钮 -->
    <button
      v-if="selectedFile && !uploading"
      @click="uploadFile"
      :disabled="!selectedFile"
      class="upload-btn"
    >
      <span class="btn-icon">🚀</span>
      开始上传
    </button>

    <!-- 进度条 -->
    <div v-if="uploading" class="progress-section">
      <div class="progress-header">
        <span>上传进度</span>
        <span class="progress-percentage">{{ uploadProgress }}%</span>
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: uploadProgress + '%' }"
        ></div>
      </div>
    </div>

    <!-- 状态消息 -->
    <div v-if="error" class="message error-message">
      <div class="message-icon">❌</div>
      <div class="message-text">
        <strong>上传失败</strong>
        <p>{{ error }}</p>
      </div>
    </div>

    <div v-if="success" class="message success-message">
      <div class="message-icon">✅</div>
      <div class="message-text">
        <strong>上传成功！</strong>
        <p>文件已成功保存到云端存储</p>
        <a :href="fileUrl" target="_blank" class="file-link">
          查看文件 →
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { put } from '@vercel/blob'
import { blobConfig, generateUniqueFilename, validateConfig, getBlobInfo } from '../utils/blobConfig.js'

export default {
  name: 'FileUploader',
  emits: ['upload-success'],
  setup(props, { emit }) {
    const fileInput = ref(null)
    const selectedFile = ref(null)
    const uploading = ref(false)
    const uploadProgress = ref(0)
    const error = ref('')
    const success = ref(false)
    const fileUrl = ref('')
    const isDragOver = ref(false)
    const blobInfo = ref({ storeId: '', region: '', status: '未配置' })

    // 初始化时检查配置
    onMounted(() => {
      try {
        validateConfig()
        blobInfo.value = getBlobInfo()
      } catch (err) {
        error.value = `配置错误: ${err.message}`
        blobInfo.value = getBlobInfo()
      }
    })

    const triggerFileInput = () => {
      fileInput.value.click()
    }

    const handleFileSelect = (event) => {
      const file = event.target.files[0]
      if (file) {
        selectedFile.value = file
        resetStatus()
      }
    }

    const handleDragOver = () => {
      isDragOver.value = true
    }

    const handleDragLeave = () => {
      isDragOver.value = false
    }

    const handleDrop = (event) => {
      isDragOver.value = false
      const file = event.dataTransfer.files[0]
      if (file) {
        selectedFile.value = file
        resetStatus()
      }
    }

    const resetStatus = () => {
      error.value = ''
      success.value = false
      uploadProgress.value = 0
      fileUrl.value = ''
    }

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const uploadFile = async () => {
      if (!selectedFile.value) return

      uploading.value = true
      error.value = ''
      success.value = false
      uploadProgress.value = 0

      try {
        // 生成唯一文件名
        const filename = generateUniqueFilename(selectedFile.value)

        console.log('=== FRONTEND UPLOAD START ===');
        console.log('Selected file:', selectedFile.value.name);
        console.log('File size:', selectedFile.value.size);
        console.log('File type:', selectedFile.value.type);
        console.log('Generated filename:', filename);

        uploadProgress.value = 10

        // 检查文件大小决定上传方式
        const maxApiSize = 4.5 * 1024 * 1024 // 4.5MB (API限制)
        const maxDirectSize = 100 * 1024 * 1024 // 100MB (Vercel Blob限制)

        if (selectedFile.value.size > maxDirectSize) {
          error.value = `文件太大！最大支持 ${formatFileSize(maxDirectSize)}，当前文件 ${formatFileSize(selectedFile.value.size)}`
          return
        }

        let uploadResult

        if (selectedFile.value.size <= maxApiSize) {
          // 小文件：通过API上传 (更安全)
          console.log('Using API upload for small file');
          uploadResult = await uploadViaAPI(filename)
        } else {
          // 大文件：直接上传到Vercel Blob (绕过API限制)
          console.log('Using direct upload for large file');
          uploadResult = await uploadDirectly(filename)
        }

        fileUrl.value = uploadResult.url
        success.value = true

        // 触发上传成功事件，通知父组件刷新文件列表
        emit('upload-success')

        // 重置表单
        setTimeout(() => {
          selectedFile.value = null
          if (fileInput.value) {
            fileInput.value.value = ''
          }
        }, 2000)

      } catch (err) {
        console.error('上传错误:', err)
        error.value = `上传失败: ${err.message || '未知错误'}`
      } finally {
        uploading.value = false
      }
    }

    // 通过API上传 (小文件，更安全)
    const uploadViaAPI = async (filename) => {
      uploadProgress.value = 30

      const fileReader = new FileReader()
      const base64Promise = new Promise((resolve, reject) => {
        fileReader.onload = () => resolve(fileReader.result)
        fileReader.onerror = reject
      })
      fileReader.readAsDataURL(selectedFile.value)

      const base64Data = await base64Promise
      console.log('File converted to base64, length:', base64Data.length);

      uploadProgress.value = 60

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: base64Data,
          filename: filename,
          originalName: selectedFile.value.name,
          mimeType: selectedFile.value.type
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || `API上传失败: ${response.statusText}`)
      }

      uploadProgress.value = 100
      return await response.json()
    }

    // 直接上传到Vercel Blob (大文件，绕过API限制)
    const uploadDirectly = async (filename) => {
      uploadProgress.value = 30

      console.log('Direct uploading to Vercel Blob...');

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        if (uploadProgress.value < 90) {
          uploadProgress.value += Math.random() * 15
        }
      }, 500)

      try {
        // 直接使用客户端SDK上传
        const { put } = await import('@vercel/blob')

        const blob = await put(filename, selectedFile.value, {
          access: 'public',
          token: blobConfig.token,
          contentType: selectedFile.value.type || 'application/octet-stream'
        })

        clearInterval(progressInterval)
        uploadProgress.value = 100

        console.log('Direct upload successful:', blob.url);
        return { url: blob.url }

      } catch (directError) {
        clearInterval(progressInterval)
        console.error('Direct upload failed:', directError);
        throw new Error(`直接上传失败: ${directError.message}`)
      }
    }

    // === 原有客户端直传代码 (已注释) ===
    /*
    const uploadFileOld = async () => {
      if (!selectedFile.value) return

      // 验证配置
      try {
        validateConfig()
      } catch (err) {
        error.value = `配置错误: ${err.message}`
        return
      }

      uploading.value = true
      error.value = ''
      success.value = false
      uploadProgress.value = 0

      try {
        // 生成唯一文件名
        const filename = generateUniqueFilename(selectedFile.value)

        // 模拟上传进度
        const progressInterval = setInterval(() => {
          if (uploadProgress.value < 90) {
            uploadProgress.value += Math.random() * 20
          }
        }, 300)

        // 上传文件到Vercel Blob (客户端直传 - 可能遇到CORS问题)
        const blob = await put(filename, selectedFile.value, {
          ...blobConfig.uploadOptions,
          token: blobConfig.token,
        })

        clearInterval(progressInterval)
        uploadProgress.value = 100

        fileUrl.value = blob.url
        success.value = true

        // 重置表单
        setTimeout(() => {
          selectedFile.value = null
          if (fileInput.value) {
            fileInput.value.value = ''
          }
        }, 2000)

      } catch (err) {
        console.error('上传错误:', err)
        error.value = `上传失败: ${err.message || '未知错误'}`
      } finally {
        uploading.value = false
      }
    }
    */

    return {
      fileInput,
      selectedFile,
      uploading,
      uploadProgress,
      error,
      success,
      fileUrl,
      isDragOver,
      blobInfo,
      triggerFileInput,
      handleFileSelect,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      uploadFile,
      uploadViaAPI,
      uploadDirectly,
      formatFileSize
    }
  }
}
</script>

<style scoped>
.upload-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  transition: all 0.3s ease;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.header-icon {
  font-size: 2.5rem;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
}

.header-text h2 {
  margin: 0;
  color: #1e293b;
  font-size: 1.5rem;
  font-weight: 700;
}

.header-text p {
  margin: 0.25rem 0 0;
  color: #64748b;
  font-size: 0.875rem;
}

.status-panel {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.status-item {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 1rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
}

.status-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.status-icon {
  font-size: 1.5rem;
}

.status-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.status-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

.status-value {
  font-size: 0.875rem;
  color: #1e293b;
  font-weight: 600;
}

.status-good {
  color: #10b981 !important;
}

.upload-zone {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.upload-zone::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.upload-zone:hover::before,
.upload-zone.dragover::before {
  opacity: 1;
}

.upload-zone:hover,
.upload-zone.dragover {
  border-color: #6366f1;
  background: linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%);
  transform: translateY(-2px);
}

.upload-zone.has-file {
  border-color: #10b981;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.upload-zone.uploading {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.upload-zone-content {
  position: relative;
  z-index: 1;
}

.upload-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
}

.upload-icon.icon-animate {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.upload-text h3 {
  margin: 0 0 0.5rem;
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 600;
}

.upload-hint {
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
}

.link-text {
  color: #6366f1;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}

.upload-input {
  display: none;
}

.file-card {
  background: linear-gradient(135deg, #fafafa 0%, #f3f4f6 100%);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  border: 1px solid #e5e7eb;
}

.file-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.file-icon {
  font-size: 2rem;
}

.file-details h4 {
  margin: 0 0 0.5rem;
  color: #1e293b;
  font-size: 1rem;
  font-weight: 600;
  word-break: break-all;
}

.file-meta {
  display: flex;
  gap: 1rem;
}

.meta-item {
  font-size: 0.75rem;
  color: #64748b;
  background: white;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.upload-btn {
  width: 100%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.upload-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
}

.upload-btn:active {
  transform: translateY(0);
}

.btn-icon {
  font-size: 1.25rem;
}

.progress-section {
  margin-top: 1.5rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-percentage {
  font-weight: 600;
  color: #6366f1;
}

.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  border-radius: 999px;
  transition: width 0.3s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.message {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 12px;
  margin-top: 1.5rem;
  animation: slideInUp 0.3s ease;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-message {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 1px solid #fecaca;
  color: #991b1b;
}

.success-message {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid #bbf7d0;
  color: #166534;
}

.message-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.message-text strong {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 1rem;
}

.message-text p {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
}

.file-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: inherit;
  text-decoration: none;
  font-weight: 600;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.file-link:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .upload-card {
    padding: 1.5rem;
  }

  .card-header {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }

  .status-panel {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .upload-zone {
    padding: 2rem 1rem;
  }

  .upload-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .upload-text h3 {
    font-size: 1.125rem;
  }

  .file-header {
    flex-direction: column;
    text-align: center;
  }

  .file-meta {
    justify-content: center;
  }

  .message {
    flex-direction: column;
    text-align: center;
  }
}
</style>