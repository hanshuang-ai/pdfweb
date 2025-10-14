<template>
  <teleport to="body">
    <div class="toast-container">
      <transition-group name="toast" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['toast', `toast-${toast.type}`]"
          @click="removeToast(toast.id)"
        >
          <div class="toast-icon">
            {{ getToastIcon(toast.type) }}
          </div>
          <div class="toast-content">
            <div class="toast-title">{{ toast.title }}</div>
            <div v-if="toast.message" class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close" @click.stop="removeToast(toast.id)">
            ✕
          </button>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'ToastNotification',
  setup() {
    const toasts = ref([])
    let toastIdCounter = 0

    const addToast = (toast) => {
      const id = ++toastIdCounter
      const newToast = {
        id,
        ...toast,
        duration: toast.duration || 3000
      }

      toasts.value.push(newToast)

      // 自动移除
      if (newToast.duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, newToast.duration)
      }

      return id
    }

    const removeToast = (id) => {
      const index = toasts.value.findIndex(toast => toast.id === id)
      if (index > -1) {
        toasts.value.splice(index, 1)
      }
    }

    const getToastIcon = (type) => {
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      }
      return icons[type] || icons.info
    }

    // 全局暴露方法
    onMounted(() => {
      window.$toast = {
        success: (title, message) => addToast({ type: 'success', title, message }),
        error: (title, message) => addToast({ type: 'error', title, message }),
        warning: (title, message) => addToast({ type: 'warning', title, message }),
        info: (title, message) => addToast({ type: 'info', title, message }),
        show: (toast) => addToast(toast)
      }
    })

    return {
      toasts,
      removeToast,
      getToastIcon
    }
  }
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  pointer-events: none;
}

.toast {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 320px;
  max-width: 400px;
  pointer-events: all;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid;
}

.toast:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.2);
}

.toast-success {
  border-left-color: #10b981;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
}

.toast-error {
  border-left-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.toast-warning {
  border-left-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.toast-info {
  border-left-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.toast-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: 600;
  font-size: 14px;
  color: #1f2937;
  margin-bottom: 2px;
  line-height: 1.4;
}

.toast-message {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
  word-wrap: break-word;
}

.toast-close {
  background: none;
  border: none;
  font-size: 16px;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.toast-close:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #6b7280;
}

/* 动画效果 */
.toast-enter-active {
  transition: all 0.3s ease;
}

.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.toast-move {
  transition: transform 0.3s ease;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .toast-container {
    top: 10px;
    right: 10px;
    left: 10px;
  }

  .toast {
    min-width: auto;
    max-width: none;
    padding: 14px;
  }

  .toast-title {
    font-size: 13px;
  }

  .toast-message {
    font-size: 12px;
  }

  .toast-icon {
    font-size: 18px;
  }
}

/* 深色主题支持 */
@media (prefers-color-scheme: dark) {
  .toast-success {
    background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
  }

  .toast-error {
    background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
  }

  .toast-warning {
    background: linear-gradient(135deg, #78350f 0%, #92400e 100%);
  }

  .toast-info {
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  }

  .toast-title {
    color: #f9fafb;
  }

  .toast-message {
    color: #d1d5db;
  }

  .toast-close {
    color: #9ca3af;
  }

  .toast-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #e5e7eb;
  }
}
</style>