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
    <!-- <div class="status-panel">
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
    </div> -->

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
          <div v-if="!selectedFiles || selectedFiles.length === 0" class="icon-idle">📁</div>
          <div v-else-if="uploading" class="icon-uploading">⏳</div>
          <div v-else class="icon-ready">✅</div>
        </div>

        <div class="upload-text">
          <h3 v-if="!selectedFiles || selectedFiles.length === 0">
            拖拽文件到这里
          </h3>
          <h3 v-else-if="uploading">
            正在上传 {{ selectedFiles.length }} 个文件...
          </h3>
          <h3 v-else>
            准备就绪
          </h3>

          <p v-if="!selectedFiles || selectedFiles.length === 0" class="upload-hint">
            或者 <span class="link-text">点击选择文件</span>
            <br><small style="color: #94a3b8;">支持选择多个文件，每个最大 100MB</small>
          </p>
          <p v-else-if="uploading" class="upload-hint">
            请稍候，{{ selectedFiles.length }} 个文件正在处理中
          </p>
          <p v-else class="upload-hint">
            已选择 {{ selectedFiles.length }} 个文件
          </p>
        </div>

        <input
          ref="fileInput"
          type="file"
          multiple
          class="upload-input"
          @change="handleFileSelect"
        />
      </div>
    </div>

    <!-- 文件信息卡片 -->
    <div v-if="selectedFiles && selectedFiles.length > 0" class="file-list">
      <div class="file-list-header">
        <h4>已选择的文件 ({{ selectedFiles.length }})</h4>
        <button @click="clearFiles" class="clear-btn">清空</button>
      </div>
      <div class="file-cards-container">
        <div v-for="(file, index) in selectedFiles" :key="index" class="file-card">
          <div class="file-header">
            <div class="file-icon">📄</div>
            <div class="file-details">
              <h4>{{ file.name }}</h4>
              <div class="file-meta">
                <span class="meta-item">{{ formatFileSize(file.size) }}</span>
                <span class="meta-item">{{ file.type || '未知类型' }}</span>
              </div>
            </div>
            <button @click="removeFile(index)" class="remove-file-btn">×</button>
          </div>
        </div>
      </div>
      <div class="total-info">
        <span>总大小: {{ formatFileSize(selectedFiles.reduce((total, file) => total + file.size, 0)) }}</span>
      </div>
    </div>

    <!-- 上传按钮 -->
    <button
      v-if="selectedFiles && selectedFiles.length > 0 && !uploading"
      @click="uploadFile"
      :disabled="!selectedFiles || selectedFiles.length === 0"
      class="upload-btn"
    >
      <span class="btn-icon">🚀</span>
      上传 {{ selectedFiles.length }} 个文件
    </button>

    <!-- 进度条 -->
    <div v-if="uploading" class="progress-section">
      <div class="progress-header">
        <span>上传进度 - {{ selectedFiles.length }} 个文件</span>
        <span class="progress-percentage">{{ uploadProgress }}%</span>
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: uploadProgress + '%' }"
        ></div>
      </div>
      <div class="progress-status">
        <span>正在并行上传文件...</span>
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
import { blobConfig, generateUniqueFilename, validateConfig, getBlobInfo } from '../utils/blobConfig.js'

export default {
  name: 'FileUploader',
  emits: ['upload-success'],
  setup(_, { emit }) {
    const fileInput = ref(null)
    const selectedFile = ref(null)
    const selectedFiles = ref([])
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
      const files = Array.from(event.target.files)
      if (files.length > 0) {
        selectedFiles.value = files
        // For backward compatibility, keep the first file as selectedFile
        selectedFile.value = files[0]
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
      const files = Array.from(event.dataTransfer.files)
      if (files.length > 0) {
        selectedFiles.value = files
        // For backward compatibility, keep the first file as selectedFile
        selectedFile.value = files[0]
        resetStatus()
      }
    }

    const resetStatus = () => {
      error.value = ''
      success.value = false
      uploadProgress.value = 0
      fileUrl.value = ''
    }

    const clearFiles = () => {
      selectedFiles.value = []
      selectedFile.value = null
      if (fileInput.value) {
        fileInput.value.value = ''
      }
      resetStatus()
    }

    const removeFile = (index) => {
      selectedFiles.value.splice(index, 1)
      if (selectedFiles.value.length === 0) {
        selectedFile.value = null
      } else {
        selectedFile.value = selectedFiles.value[0] // Keep the first file for backward compatibility
      }
      if (selectedFiles.value.length === 0 && fileInput.value) {
        fileInput.value.value = ''
      }
    }

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const uploadFile = async () => {
      if (!selectedFiles.value || selectedFiles.value.length === 0) return

      uploading.value = true
      error.value = ''
      success.value = false
      uploadProgress.value = 0

      try {
        console.log('=== MULTI-FILE UPLOAD START ===');
        console.log('Files to upload:', selectedFiles.value.length);

        const uploadPromises = []
        const maxApiSize = 4.5 * 1024 * 1024 // 4.5MB (API限制)
        const maxDirectSize = 100 * 1024 * 1024 // 100MB (Vercel Blob限制)

        // 检查所有文件大小
        for (const file of selectedFiles.value) {
          if (file.size > maxDirectSize) {
            error.value = `文件 "${file.name}" 太大！最大支持 ${formatFileSize(maxDirectSize)}，当前文件 ${formatFileSize(file.size)}`
            return
          }
        }

        uploadProgress.value = 20

        // 为每个文件创建上传任务
        for (let i = 0; i < selectedFiles.value.length; i++) {
          const file = selectedFiles.value[i]
          const filename = generateUniqueFilename(file)

          console.log(`Processing file ${i + 1}/${selectedFiles.value.length}:`, file.name);

          if (file.size <= maxApiSize) {
            console.log(`Using API upload for small file: ${file.name}`);
            uploadPromises.push(uploadViaAPI(file, filename))
          } else {
            console.log(`Using direct upload for large file: ${file.name}`);
            uploadPromises.push(uploadDirectly(file, filename))
          }
        }

        uploadProgress.value = 60

        // 等待所有文件上传完成
        const results = await Promise.all(uploadPromises)

        uploadProgress.value = 100
        success.value = true
        fileUrl.value = results.length > 0 ? results[0].url : ''

        // 触发上传成功事件，通知父组件刷新文件列表
        emit('upload-success')

        // 重置表单
        setTimeout(() => {
          selectedFiles.value = []
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
    const uploadViaAPI = async (file, filename) => {
      const fileReader = new FileReader()
      const base64Promise = new Promise((resolve, reject) => {
        fileReader.onload = () => resolve(fileReader.result)
        fileReader.onerror = reject
      })
      fileReader.readAsDataURL(file)

      const base64Data = await base64Promise
      console.log(`File ${file.name} converted to base64, length:`, base64Data.length);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: base64Data,
          filename: filename,
          originalName: file.name,
          mimeType: file.type
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || `API上传失败: ${response.statusText}`)
      }

      return await response.json()
    }

    // 直接上传到Vercel Blob (大文件，绕过API限制)
    const uploadDirectly = async (file, filename) => {
      console.log(`Direct uploading ${file.name} to Vercel Blob...`);

      try {
        // 直接使用客户端SDK上传
        const { put } = await import('@vercel/blob')

        const blob = await put(filename, file, {
          access: 'public',
          token: blobConfig.token,
          contentType: file.type || 'application/octet-stream'
        })

        console.log(`Direct upload successful for ${file.name}:`, blob.url);
        return { url: blob.url }

      } catch (directError) {
        console.error(`Direct upload failed for ${file.name}:`, directError);
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
      selectedFiles,
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
      formatFileSize,
      clearFiles,
      removeFile
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

.file-list {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  border: 1px solid #e5e7eb;
  backdrop-filter: blur(10px);
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.file-list-header h4 {
  margin: 0;
  color: #1e293b;
  font-size: 1.1rem;
  font-weight: 600;
}

.clear-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-btn:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.file-cards-container {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.file-card {
  background: linear-gradient(135deg, #fafafa 0%, #f3f4f6 100%);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  border: 1px solid #e5e7eb;
  position: relative;
  transition: all 0.3s ease;
}

.file-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.remove-file-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #ef4444;
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.remove-file-btn:hover {
  background: #dc2626;
  transform: scale(1.1);
}

.total-info {
  text-align: center;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 600;
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

.progress-status {
  margin-top: 0.5rem;
  text-align: center;
  color: #64748b;
  font-size: 0.875rem;
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
