<template>
  <div class="file-list-card">
    <div class="card-header">
      <div class="header-content">
        <div class="header-icon">📁</div>
        <div class="header-text">
          <h2>文件管理</h2>
          <p>查看和管理您的文件</p>
        </div>
      </div>
      <button
        @click="refreshFileList"
        :disabled="loading"
        class="refresh-btn"
        :class="{ 'refreshing': loading }"
      >
        <span class="refresh-icon" :class="{ 'spin': loading }">🔄</span>
        <span>{{ loading ? '刷新中' : '刷新' }}</span>
      </button>
    </div>

    <!-- 统计信息 -->
    <div v-if="!loading && !error && files.length > 0" class="stats-panel">
      <div class="stat-item">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-number">{{ totalFiles }}</div>
          <div class="stat-label">总文件数</div>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon">💾</div>
        <div class="stat-content">
          <div class="stat-number">{{ getTotalSize() }}</div>
          <div class="stat-label">总大小</div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading && files.length === 0" class="loading-state">
      <div class="loading-icon">⏳</div>
      <p>正在加载文件列表...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">❌</div>
      <h4>加载失败</h4>
      <p>{{ error }}</p>
      <button @click="refreshFileList" class="retry-btn">
        🔄 重试
      </button>
    </div>

    <!-- 空状态 -->
    <div v-else-if="files.length === 0" class="empty-state">
      <div class="empty-icon">📭</div>
      <h4>还没有文件</h4>
      <p>上传您的第一个文件开始使用吧！</p>
    </div>

    <!-- 文件列表 -->
    <div v-else class="file-list">
      <div class="file-items">
        <div
          v-for="(file, index) in files"
          :key="file.pathname"
          class="file-item"
          :style="{ 'animation-delay': index * 0.1 + 's' }"
        >
          <div class="file-preview">
            <div class="file-type-icon">
              {{ getFileTypeIcon(file.contentType) }}
            </div>
          </div>

          <div class="file-content">
            <div class="file-header">
              <h4 class="file-name" :title="file.originalName">
                {{ file.originalName }}
              </h4>
              <div class="file-badge" :class="getFileTypeClass(file.contentType)">
                {{ getFileTypeLabel(file.contentType) }}
              </div>
            </div>

            <div class="file-meta">
              <span class="meta-item">
                <span class="meta-icon">📏</span>
                {{ file.formattedSize }}
              </span>
              <span class="meta-item">
                <span class="meta-icon">📅</span>
                {{ file.formattedDate }}
              </span>
            </div>
          </div>

          <div class="file-actions">
            <a
              :href="file.url"
              target="_blank"
              class="action-btn view-btn"
              title="查看文件"
            >
              <span class="btn-icon">👁️</span>
              <span class="btn-text">查看</span>
            </a>
            <button
              @click="copyUrl(file.url)"
              class="action-btn copy-btn"
              title="复制链接"
            >
              <span class="btn-icon">📋</span>
              <span class="btn-text">复制</span>
            </button>
            <button
              @click="deleteFile(file.pathname)"
              :disabled="deleting"
              class="action-btn delete-btn"
              title="删除文件"
            >
              <span class="btn-icon">🗑️</span>
              <span class="btn-text">删除</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'FileList',
  setup() {
    const files = ref([])
    const loading = ref(false)
    const deleting = ref(false)
    const error = ref('')
    const totalFiles = ref(0)

    const fetchFileList = async () => {
      loading.value = true
      error.value = ''

      try {
        console.log('Fetching file list...')
        const response = await fetch('/api/list-files')

        if (!response.ok) {
          throw new Error(`获取文件列表失败: ${response.statusText}`)
        }

        const data = await response.json()
        files.value = data.files || []
        totalFiles.value = data.total || 0
        console.log(`Fetched ${totalFiles.value} files`)

      } catch (err) {
        console.error('Failed to fetch file list:', err)
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    const refreshFileList = () => {
      fetchFileList()
    }

    const copyUrl = async (url) => {
      try {
        await navigator.clipboard.writeText(url)
        // 这里可以添加一个toast提示，现在简单alert
        alert('链接已复制到剪贴板！')
      } catch (err) {
        console.error('Failed to copy URL:', err)
        // 降级方案：选中文本
        const textArea = document.createElement('textarea')
        textArea.value = url
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        alert('链接已复制到剪贴板！')
      }
    }

    const deleteFile = async (pathname) => {
      if (!confirm('确定要删除这个文件吗？此操作不可撤销。')) {
        return
      }

      deleting.value = true

      try {
        console.log('Deleting file:', pathname)
        const response = await fetch('/api/delete-file', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pathname })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.details || `删除失败: ${response.statusText}`)
        }

        // 刷新文件列表
        await fetchFileList()
        alert('文件已成功删除！')

      } catch (err) {
        console.error('Failed to delete file:', err)
        alert(`删除失败: ${err.message}`)
      } finally {
        deleting.value = false
      }
    }

    // 获取文件总大小
    const getTotalSize = () => {
      if (files.value.length === 0) return '0 B'

      // 这里简化处理，实际应该解析所有文件大小并累加
      const total = files.value.length > 0 ? '多个文件' : '0 B'
      return total
    }

    // 获取文件类型图标
    const getFileTypeIcon = (contentType) => {
      if (!contentType) return '📄'

      const type = contentType.toLowerCase()
      if (type.includes('image')) return '🖼️'
      if (type.includes('video')) return '🎬'
      if (type.includes('audio')) return '🎵'
      if (type.includes('pdf')) return '📕'
      if (type.includes('text')) return '📝'
      if (type.includes('zip') || type.includes('rar')) return '📦'
      if (type.includes('word') || type.includes('document')) return '📘'
      if (type.includes('excel') || type.includes('spreadsheet')) return '📗'
      if (type.includes('powerpoint') || type.includes('presentation')) return '📙'

      return '📄'
    }

    // 获取文件类型标签
    const getFileTypeLabel = (contentType) => {
      if (!contentType) return '未知'

      const type = contentType.toLowerCase()
      if (type.includes('image')) return '图片'
      if (type.includes('video')) return '视频'
      if (type.includes('audio')) return '音频'
      if (type.includes('pdf')) return 'PDF'
      if (type.includes('text')) return '文本'
      if (type.includes('zip') || type.includes('rar')) return '压缩包'
      if (type.includes('word') || type.includes('document')) return '文档'
      if (type.includes('excel') || type.includes('spreadsheet')) return '表格'
      if (type.includes('powerpoint') || type.includes('presentation')) return '演示'

      return '其他'
    }

    // 获取文件类型样式类
    const getFileTypeClass = (contentType) => {
      if (!contentType) return 'type-default'

      const type = contentType.toLowerCase()
      if (type.includes('image')) return 'type-image'
      if (type.includes('video')) return 'type-video'
      if (type.includes('audio')) return 'type-audio'
      if (type.includes('pdf')) return 'type-pdf'
      if (type.includes('text')) return 'type-text'
      if (type.includes('zip') || type.includes('rar')) return 'type-archive'

      return 'type-default'
    }

    // 组件挂载时获取文件列表
    onMounted(() => {
      fetchFileList()
    })

    return {
      files,
      loading,
      deleting,
      error,
      totalFiles,
      refreshFileList,
      copyUrl,
      deleteFile,
      getTotalSize,
      getFileTypeIcon,
      getFileTypeLabel,
      getFileTypeClass
    }
  }
}
</script>

<style scoped>
.file-list-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
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

.refresh-btn {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.refresh-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
}

.refresh-btn:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.refresh-icon.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.stats-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.8);
  padding: 1rem;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2rem;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  flex: 1;
}

.loading-icon, .error-icon, .empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.loading-icon {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.error-state h4, .empty-state h4 {
  margin: 0 0 0.5rem;
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 600;
}

.error-state p, .empty-state p, .loading-state p {
  margin: 0 0 1.5rem;
  color: #64748b;
}

.retry-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);
}

.file-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.file-items {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.file-item {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
  animation: slideInUp 0.5s ease forwards;
  opacity: 0;
  transform: translateY(20px);
}

@keyframes slideInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.file-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 1);
}

.file-preview {
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
}

.file-type-icon {
  font-size: 3rem;
  text-align: center;
  padding: 1rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 12px;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-content {
  margin-bottom: 1rem;
}

.file-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.file-name {
  margin: 0;
  color: #1e293b;
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.4;
  word-break: break-all;
  flex: 1;
}

.file-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.type-image { background: #dbeafe; color: #1e40af; }
.type-video { background: #fef3c7; color: #92400e; }
.type-audio { background: #ede9fe; color: #6d28d9; }
.type-pdf { background: #fee2e2; color: #991b1b; }
.type-text { background: #f0fdf4; color: #166534; }
.type-archive { background: #f3e8ff; color: #7c3aed; }
.type-default { background: #f1f5f9; color: #475569; }

.file-meta {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
}

.meta-icon {
  font-size: 1rem;
}

.file-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.625rem 1rem;
  border: none;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 100px;
  justify-content: center;
}

.view-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.view-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
}

.copy-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.copy-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
}

.delete-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.delete-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.3);
}

.delete-btn:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-icon {
  font-size: 1rem;
}

.btn-text {
  font-size: 0.875rem;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .card-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .stats-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .file-list-card {
    border-radius: 16px;
  }

  .card-header {
    padding: 1.5rem;
  }

  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }

  .stats-panel {
    padding: 1rem 1.5rem;
  }

  .file-item {
    padding: 1rem;
    margin-bottom: 0.75rem;
  }

  .file-type-icon {
    width: 60px;
    height: 60px;
    font-size: 2rem;
  }

  .file-header {
    flex-direction: column;
    align-items: stretch;
  }

  .file-name {
    font-size: 1rem;
    text-align: center;
  }

  .file-badge {
    align-self: center;
  }

  .file-meta {
    justify-content: center;
    gap: 1rem;
  }

  .file-actions {
    gap: 0.5rem;
  }

  .action-btn {
    padding: 0.5rem 0.75rem;
    min-width: 80px;
    font-size: 0.75rem;
  }

  .btn-text {
    display: none;
  }
}

@media (max-width: 480px) {
  .card-header {
    padding: 1rem;
  }

  .header-icon {
    font-size: 2rem;
  }

  .header-text h2 {
    font-size: 1.25rem;
  }

  .file-item {
    padding: 0.75rem;
  }

  .file-actions {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
    min-width: auto;
  }
}
</style>