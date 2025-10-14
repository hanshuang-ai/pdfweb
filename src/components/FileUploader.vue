<template>
  <div class="container">
    <h1>📤 Vercel Blob 文件上传</h1>

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
import { ref } from 'vue'
import { put } from '@vercel/blob'

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
        // 创建一个带有时间戳的唯一文件名
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 15)
        const filename = `${timestamp}-${randomString}-${selectedFile.value.name}`

        // 模拟上传进度
        const progressInterval = setInterval(() => {
          if (uploadProgress.value < 90) {
            uploadProgress.value += Math.random() * 20
          }
        }, 300)

        // 上传文件到Vercel Blob
        const blob = await put(filename, selectedFile.value, {
          access: 'public',
          token: import.meta.env.VITE_BLOB_READ_WRITE_TOKEN,
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

    return {
      fileInput,
      selectedFile,
      uploading,
      uploadProgress,
      error,
      success,
      fileUrl,
      isDragOver,
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