<template>
  <div id="app">
    <div class="app-background">
      <div class="background-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>
    </div>

    <div class="app-header">
      <div class="header-content">
        <h1 class="app-title">
          <span class="icon">☁️</span>
          Vercel Blob 文件管理
        </h1>
        <p class="app-subtitle">安全、快速的文件上传与管理平台</p>
      </div>
    </div>

    <div class="app-container">
      <div class="main-content">
        <!-- 左侧：上传区域 -->
        <div class="upload-section">
          <FileUploader @upload-success="refreshFileList" />
        </div>

        <!-- 右侧：文件列表 -->
        <div class="file-list-section">
          <FileList ref="fileListRef" />
        </div>
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="app-footer">
      <div class="footer-content">
        <p>💖 基于 Vue 3 + Vercel Blob 构建</p>
      </div>
    </div>
  </div>
</template>

<script>
import FileUploader from './components/FileUploader.vue'
import FileList from './components/FileList.vue'

export default {
  name: 'App',
  components: {
    FileUploader,
    FileList
  },
  methods: {
    refreshFileList() {
      // 当文件上传成功后，刷新文件列表
      if (this.$refs.fileListRef) {
        this.$refs.fileListRef.refreshFileList()
      }
    }
  }
}
</script>

<style>
#app {
  width: 100%;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

.app-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: -1;
}

.background-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 300px;
  height: 300px;
  top: -150px;
  right: -100px;
  animation-delay: 0s;
}

.shape-2 {
  width: 200px;
  height: 200px;
  bottom: -100px;
  left: -50px;
  animation-delay: 2s;
}

.shape-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  left: -75px;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(10deg); }
}

.app-header {
  text-align: center;
  padding: 3rem 2rem 2rem;
  position: relative;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
}

.app-title {
  font-size: 3rem;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.app-title .icon {
  font-size: 2.5rem;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.app-subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 1rem 0 0;
  font-weight: 300;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.app-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem 2rem;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  min-height: 600px;
}

.upload-section {
  display: flex;
  flex-direction: column;
}

.file-list-section {
  display: flex;
  flex-direction: column;
}

.app-footer {
  text-align: center;
  padding: 2rem;
  margin-top: auto;
}

.footer-content {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .app-container {
    padding: 0 1.5rem 1.5rem;
  }

  .main-content {
    gap: 1.5rem;
  }
}

@media (max-width: 768px) {
  .app-header {
    padding: 2rem 1rem 1rem;
  }

  .app-title {
    font-size: 2rem;
    flex-direction: column;
    gap: 0.5rem;
  }

  .app-title .icon {
    font-size: 2rem;
  }

  .app-subtitle {
    font-size: 1rem;
  }

  .app-container {
    padding: 0 1rem 1rem;
  }

  .main-content {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: 1.5rem 0.75rem 0.75rem;
  }

  .app-title {
    font-size: 1.75rem;
  }

  .app-container {
    padding: 0 0.75rem 0.75rem;
  }
}

/* 全局动画 */
* {
  transition: all 0.3s ease;
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>