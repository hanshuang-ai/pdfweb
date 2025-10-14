<template>
  <div class="file-list-container">
    <div class="file-list-header">
      <h3>📁 已上传文件</h3>
      <button @click="refreshFileList" :disabled="loading" class="refresh-btn">
        {{ loading ? '刷新中...' : '🔄 刷新' }}
      </button>
    </div>

    <div v-if="loading && files.length === 0" class="loading">
      <p>加载文件列表中...</p>
    </div>

    <div v-else-if="error" class="error">
      ❌ {{ error }}
    </div>

    <div v-else-if="files.length === 0" class="empty-state">
      <p>📭 还没有上传任何文件</p>
    </div>

    <div v-else class="file-list">
      <div class="file-list-summary">
        <span>共 {{ totalFiles }} 个文件</span>
      </div>

      <div class="file-items">
        <div
          v-for="file in files"
          :key="file.pathname"
          class="file-item"
        >
          <div class="file-info">
            <div class="file-name" :title="file.originalName">
              {{ file.originalName }}
            </div>
            <div class="file-meta">
              <span class="file-size">{{ file.formattedSize }}</span>
              <span class="file-date">{{ file.formattedDate }}</span>
              <span class="file-type">{{ file.contentType }}</span>
            </div>
          </div>

          <div class="file-actions">
            <a
              :href="file.url"
              target="_blank"
              class="action-btn view-btn"
              title="查看文件"
            >
              👁️ 查看
            </a>
            <button
              @click="copyUrl(file.url)"
              class="action-btn copy-btn"
              title="复制链接"
            >
              📋 复制
            </button>
            <button
              @click="deleteFile(file.pathname)"
              :disabled="deleting"
              class="action-btn delete-btn"
              title="删除文件"
            >
              🗑️ 删除
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
      deleteFile
    }
  }
}
</script>

<style scoped>
.file-list-container {
  margin-top: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.file-list-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.25rem;
}

.refresh-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.3s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: #5a67d8;
}

.refresh-btn:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
}

.loading, .error, .empty-state {
  padding: 2rem;
  text-align: center;
  color: #4a5568;
}

.error {
  color: #e53e3e;
  background: #fed7d7;
  border-radius: 0;
}

.file-list-summary {
  padding: 1rem 1.5rem;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.875rem;
  color: #64748b;
}

.file-items {
  max-height: 400px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.2s ease;
}

.file-item:hover {
  background: #f8fafc;
}

.file-item:last-child {
  border-bottom: none;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: #64748b;
}

.file-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.action-btn {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.view-btn {
  background: #10b981;
  color: white;
}

.view-btn:hover {
  background: #059669;
}

.copy-btn {
  background: #3b82f6;
  color: white;
}

.copy-btn:hover {
  background: #2563eb;
}

.delete-btn {
  background: #ef4444;
  color: white;
}

.delete-btn:hover:not(:disabled) {
  background: #dc2626;
}

.delete-btn:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .file-list-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .file-item {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .file-actions {
    justify-content: flex-end;
  }

  .file-meta {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
}
</style>