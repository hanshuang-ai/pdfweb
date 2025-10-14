<template>
  <div class="container">
    <h1>📤 Vercel Blob 文件上传</h1>

    <!-- Blob 配置信息 -->
    <div style="background: #f0f4f8; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.875rem;">
      <p style="margin: 0; color: #4a5568;">
        <strong>存储信息:</strong>
        Store ID: {{ blobInfo.storeId }} |
        地区: {{ blobInfo.region }} |
        模式: <span style="color: #667eea;">{{ blobInfo.mode }}</span> |
        状态: <span :style="{ color: blobInfo.status.includes('已配置') ? '#38a169' : '#e53e3e' }">{{ blobInfo.status }}</span>
      </p>
    </div>

    <div
      class="upload-area"
      :class="{ 'dragover': isDragOver }"
      @click="triggerFileInput"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <div class="upload-icon">📁</div>
      <div class="upload-text">
        <p>点击选择文件或拖拽文件到此处</p>
        <p style="font-size: 0.875rem; margin-top: 0.5rem;">支持所有文件类型</p>
      </div>
      <input
        ref="fileInput"
        type="file"
        class="upload-input"
        @change="handleFileSelect"
      />
    </div>

    <div v-if="selectedFile" class="file-info">
      <p><strong>已选择文件:</strong> {{ selectedFile.name }}</p>
      <p><strong>文件大小:</strong> {{ formatFileSize(selectedFile.size) }}</p>
      <p><strong>文件类型:</strong> {{ selectedFile.type || '未知' }}</p>
    </div>

    <button
      v-if="selectedFile && !uploading"
      @click="uploadFile"
      :disabled="!selectedFile"
    >
      开始上传
    </button>

    <button
      v-if="uploading"
      disabled
    >
      上传中... {{ uploadProgress }}%
    </button>

    <div v-if="uploading" class="progress">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: uploadProgress + '%' }"
        ></div>
      </div>
    </div>

    <div v-if="error" class="error">
      ❌ {{ error }}
    </div>

    <div v-if="success" class="success">
      ✅ 文件上传成功！
      <p style="margin-top: 0.5rem; font-size: 0.875rem;">
        文件URL: <a :href="fileUrl" target="_blank" style="color: #667eea;">{{ fileUrl }}</a>
      </p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { put } from '@vercel/blob'
import { blobConfig, generateUniqueFilename, validateConfig, getBlobInfo } from '../utils/blobConfig.js'

export default {
  name: 'FileUploader',
  setup() {
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

        // 模拟上传进度
        const progressInterval = setInterval(() => {
          if (uploadProgress.value < 90) {
            uploadProgress.value += Math.random() * 20
          }
        }, 300)

        // 直接上传文件到API端点 (方案1: 完全服务端处理)
        uploadProgress.value = 20
        const formData = new FormData()
        formData.append('file', selectedFile.value)
        formData.append('filename', filename)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.details || `上传失败: ${response.statusText}`)
        }

        const { url } = await response.json()

        clearInterval(progressInterval)
        uploadProgress.value = 100

        fileUrl.value = url
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
      formatFileSize
    }
  }
}
</script>