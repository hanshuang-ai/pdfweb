<template>
  <div class="upload-card">
    <div class="card-header">
      <div class="header-icon">📤</div>
      <div class="header-text">
        <h2>文件上传</h2>
        <p>安全快速的上传体验</p>
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
      <!-- 当前文件进度 -->
      <div class="current-file-progress">
        <div class="progress-header">
          <span>正在上传: {{ currentFileName || '准备中...' }} ({{ currentFileIndex }}/{{ selectedFiles.length }})</span>
          <span class="progress-percentage">{{ currentFileProgress }}%</span>
        </div>
        <div class="progress-bar current-file-bar">
          <div
            class="progress-fill current-file-fill"
            :style="{ width: currentFileProgress + '%' }"
          ></div>
        </div>
      </div>

      <!-- 总体进度 -->
      <div class="total-progress">
        <div class="progress-header">
          <span>总体进度 - {{ selectedFiles.length }} 个文件</span>
          <span class="progress-percentage">{{ uploadProgress }}%</span>
        </div>
        <div class="progress-bar total-progress-bar">
          <div
            class="progress-fill total-progress-fill"
            :style="{ width: uploadProgress + '%' }"
          ></div>
        </div>
        <div class="progress-status">
          <span v-if="currentFileName">正在依次上传文件...</span>
        </div>
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
        <!-- <a :href="fileUrl" target="_blank" class="file-link">
          查看文件 →
        </a> -->
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
    const currentFileProgress = ref(0)
    const currentFileIndex = ref(0)
    const currentFileName = ref('')
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
        selectedFile.value = files[0]
        resetStatus()
      }
    }

    const resetStatus = () => {
      error.value = ''
      success.value = false
      uploadProgress.value = 0
      currentFileProgress.value = 0
      currentFileIndex.value = 0
      currentFileName.value = ''
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
      currentFileProgress.value = 0
      currentFileIndex.value = 0
      currentFileName.value = ''

      try {
        console.log('=== MULTI-FILE UPLOAD START ===');
        console.log('Files to upload:', selectedFiles.value.length);

        const maxDirectSize = 100 * 1024 * 1024 // 100MB (Vercel Blob限制)

        // 检查所有文件大小
        for (const file of selectedFiles.value) {
          if (file.size > maxDirectSize) {
            error.value = `文件 "${file.name}" 太大！最大支持 ${formatFileSize(maxDirectSize)}，当前文件 ${formatFileSize(file.size)}`
            return
          }
        }

        // 设置串行上传，一个接一个上传
        const results = []
        let totalSize = selectedFiles.value.reduce((sum, file) => sum + file.size, 0)
        let uploadedSize = 0
        let successCount = 0
        let failCount = 0

        // 逐个上传文件
        for (let i = 0; i < selectedFiles.value.length; i++) {
          const file = selectedFiles.value[i]
          const filename = generateUniqueFilename(file)

          // 更新当前文件状态
          currentFileIndex.value = i + 1
          currentFileName.value = file.name
          currentFileProgress.value = 0

          try {
            console.log(`正在上传 ${i + 1}/${selectedFiles.value.length}:`, file.name);

            // 上传单个文件，更新进度
            const result = await uploadDirectlyWithProgress(file, filename, (progress) => {
              // 更新当前文件进度
              currentFileProgress.value = progress
              // 计算该文件已上传的大小
              const fileUploadedSize = (progress / 100) * file.size
              // 计算总体进度
              const totalProgress = ((uploadedSize + fileUploadedSize) / totalSize) * 100
              uploadProgress.value = parseFloat(totalProgress.toFixed(2))
            })

            results.push(result)
            uploadedSize += file.size
            currentFileProgress.value = 100
            successCount++
            console.log(`✅ ${file.name} 上传成功`)

          } catch (fileError) {
            console.error(`❌ ${file.name} 上传失败:`, fileError.message)
            failCount++
            currentFileProgress.value = 0
            // 即使失败也继续上传下一个文件
            continue
          }
        }

        uploadProgress.value = 100.00
        currentFileProgress.value = 100

        // 根据上传结果设置状态
        if (failCount === 0) {
          // 全部成功
          success.value = true
        } else if (successCount === 0) {
          // 全部失败
          error.value = '所有文件上传失败'
        } else {
          // 部分成功
          error.value = `${successCount} 个文件上传成功，${failCount} 个文件上传失败`
          success.value = true
        }

        fileUrl.value = results.length > 0 ? results[0].url : ''


        emit('upload-success')

        // 重置表单
        setTimeout(() => {
          selectedFiles.value = []
          selectedFile.value = null
          if (fileInput.value) {
            fileInput.value.value = ''
          }
        }, 1000)

      } catch (err) {
        console.error('上传错误:', err)
        error.value = `上传失败: ${err.message || '未知错误'}`
      } finally {
        uploading.value = false
      }
    }


    const uploadDirectlyWithProgress = async (file, filename, onProgress) => {
      return new Promise((resolve, reject) => {
        // 使用XMLHttpRequest实现真正的进度追踪
        const xhr = new XMLHttpRequest()

        // 监听上传进度
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const percentComplete = (event.loaded / event.total) * 100
            onProgress(parseFloat(percentComplete.toFixed(2)))
          }
        })

        // 监听完成事件
        xhr.addEventListener('load', async () => {
          if (xhr.status === 200) {
            try {
              const result = JSON.parse(xhr.responseText)
              resolve({ url: result.url })
            } catch (parseError) {
              reject(new Error(`上传响应解析失败: ${parseError.message}`))
            }
          } else {
            reject(new Error(`上传失败，状态码: ${xhr.status}`))
          }
        })

        // 监听错误事件
        xhr.addEventListener('error', () => {
          reject(new Error('网络错误'))
        })

        // 监听中止事件
        xhr.addEventListener('abort', () => {
          reject(new Error('上传被中止'))
        })

        // 打开并发送请求
        xhr.open('PUT', `https://blob.vercel-storage.com/${filename}`, true)
        xhr.setRequestHeader('Authorization', `Bearer ${blobConfig.token}`)
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
        xhr.send(file)
      })
    }



    return {
      fileInput,
      selectedFile,
      selectedFiles,
      uploading,
      uploadProgress,
      currentFileProgress,
      currentFileIndex,
      currentFileName,
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

      uploadDirectlyWithProgress,
      formatFileSize,
      clearFiles,
      removeFile
    }
  }
}
</script>

<style scoped>
@import './FileUploader.css'
</style>
