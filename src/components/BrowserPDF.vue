<template>
  <div class="container">
    <div class="toolbar">
      <button @click="goBack" class="back-btn" title="返回文件列表">
        ← 返回
      </button>
      <div class="file-info" v-if="fileName">
        <span class="file-name">{{ fileName }}</span>
      </div>
      <input v-model="url" placeholder="输入或粘贴 PDF 链接" />
      <button @click="openNewTab">在新标签打开</button>
    </div>
    <div class="frameWrap">
      <iframe :src="url" class="frame" ref="iframeRef"></iframe>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export default {
  name: 'BrowserPDF',
  setup() {
    const route = useRoute()
    const router = useRouter()

    // 默认示例PDF
    const defaultUrl = 'https://fmatek5mfkum5gbd.public.blob.vercel-storage.com/1760506598654-5481ozc9d8m-1.JavaScript%E9%AB%98%E7%BA%A7%E7%A8%8B%E5%BA%8F%E8%AE%BE%E8%AE%A1%EF%BC%88%E7%AC%AC4%E7%89%88%EF%BC%89%5B%E5%89%8D%E7%AB%AF%E8%83%96%E5%A4%B4%E9%B1%BC%5D.pdf'

    // 从路由参数获取URL和文件名
    const initial = route.query.url || defaultUrl
    const fileName = route.query.fileName || ''

    const url = ref(initial)
    const iframeRef = ref(null)

    const openNewTab = () => {
      window.open(url.value, '_blank')
    }

    const goBack = () => {
      router.push('/')
    }

    // 更新页面标题
    onMounted(() => {
      if (fileName) {
        document.title = `${fileName} - PDF查看器`
      } else {
        document.title = 'PDF查看器 - 文件阅读管理'
      }
    })

    return { url, fileName, iframeRef, openNewTab, goBack }
  }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}
.toolbar {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  border-bottom: 1px solid #e0e0e0;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.back-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.back-btn:hover {
  background: #5a6268;
  transform: translateY(-1px);
}
.file-info {
  flex-shrink: 0;
  margin-right: 8px;
}
.file-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.toolbar input {
  flex: 1;
  height: 36px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}
.toolbar input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}
.toolbar button:not(.back-btn) {
  background: #6366f1;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.toolbar button:not(.back-btn):hover {
  background: #4f46e5;
  transform: translateY(-1px);
}
.frameWrap {
  position: relative;
  flex: 1;
  background: white;
}
.frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar {
    height: auto;
    min-height: 60px;
    padding: 12px;
    flex-wrap: wrap;
    gap: 8px;
  }
  .file-name {
    max-width: 150px;
    font-size: 12px;
  }
  .toolbar input {
    order: 3;
    flex-basis: 100%;
    margin-top: 4px;
  }
}
</style>
