<template>
  <div id="app">
    <!-- 路由视图 -->
    <keep-alive include="HomeView">
      <router-view />
    </keep-alive>

    <!-- 全局组件（在所有页面都显示） -->
    <ToastNotification />
    <ConfirmDialog
      :visible="confirmDialog.visible"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :details="confirmDialog.details"
      :confirmText="confirmDialog.confirmText"
      :cancelText="confirmDialog.cancelText"
      :type="confirmDialog.type"
      :loading="confirmDialog.loading"
      @confirm="handleConfirm"
      @cancel="handleCancel"
      @update:visible="confirmDialog.visible = $event"
    />
  </div>
</template>

<script>
import ToastNotification from './components/ToastNotification.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'

export default {
  name: 'App',
  components: {
    ToastNotification,
    ConfirmDialog
  },
  data() {
    return {
      confirmDialog: {
        visible: false,
        title: '',
        message: '',
        details: '',
        confirmText: '确认',
        cancelText: '取消',
        type: 'warning',
        loading: false,
        resolve: null,
        reject: null
      }
    }
  },
  methods: {
    // 显示确认对话框
    showConfirm(options) {
      const {
        title = '确认操作',
        message,
        details = '',
        confirmText = '确认',
        cancelText = '取消',
        type = 'warning'
      } = options

      return new Promise((resolve, reject) => {
        this.confirmDialog = {
          visible: true,
          title,
          message,
          details,
          confirmText,
          cancelText,
          type,
          loading: false,
          resolve,
          reject
        }
      })
    },

    // 确认操作
    handleConfirm() {
      if (this.confirmDialog.resolve) {
        this.confirmDialog.resolve(true)
      }
      this.hideConfirmDialog()
    },

    // 取消操作
    handleCancel() {
      if (this.confirmDialog.reject) {
        this.confirmDialog.reject(false)
      }
      this.hideConfirmDialog()
    },

    // 隐藏对话框
    hideConfirmDialog() {
      this.confirmDialog.visible = false
      this.confirmDialog.loading = false
      this.confirmDialog.resolve = null
      this.confirmDialog.reject = null
    }
  },
  mounted() {
    // 全局暴露确认对话框方法
    window.$confirm = this.showConfirm
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
