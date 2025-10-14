<template>
  <teleport to="body">
    <transition name="modal">
      <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <div class="modal-icon">
              {{ getIcon() }}
            </div>
            <h3 class="modal-title">{{ title || '确认操作' }}</h3>
          </div>

          <div class="modal-body">
            <p class="modal-message">{{ message }}</p>
            <div v-if="details" class="modal-details">
              <small>{{ details }}</small>
            </div>
          </div>

          <div class="modal-footer">
            <button
              @click="handleCancel"
              class="modal-btn modal-btn-cancel"
              :disabled="loading"
            >
              {{ cancelText || '取消' }}
            </button>
            <button
              @click="handleConfirm"
              class="modal-btn modal-btn-confirm"
              :disabled="loading"
              :class="{ 'loading': loading }"
            >
              <span v-if="loading" class="loading-spinner">⏳</span>
              <span v-else>{{ confirmText || '确认' }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'ConfirmDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    message: {
      type: String,
      required: true
    },
    details: {
      type: String,
      default: ''
    },
    confirmText: {
      type: String,
      default: '确认'
    },
    cancelText: {
      type: String,
      default: '取消'
    },
    type: {
      type: String,
      default: 'warning', // 'warning', 'danger', 'info', 'success'
      validator: (value) => ['warning', 'danger', 'info', 'success'].includes(value)
    },
    loading: {
      type: Boolean,
      default: false
    },
    closeOnOverlay: {
      type: Boolean,
      default: false
    }
  },
  emits: ['confirm', 'cancel', 'update:visible'],
  setup(props, { emit }) {
    const handleConfirm = () => {
      if (!props.loading) {
        emit('confirm')
      }
    }

    const handleCancel = () => {
      if (!props.loading) {
        emit('cancel')
        emit('update:visible', false)
      }
    }

    const handleOverlayClick = () => {
      if (props.closeOnOverlay && !props.loading) {
        handleCancel()
      }
    }

    const getIcon = () => {
      const icons = {
        warning: '⚠️',
        danger: '🗑️',
        info: 'ℹ️',
        success: '✅'
      }
      return icons[props.type] || icons.warning
    }

    // 监听 visible 变化，处理 ESC 键
    watch(() => props.visible, (newVal) => {
      if (newVal) {
        document.addEventListener('keydown', handleKeyDown)
      } else {
        document.removeEventListener('keydown', handleKeyDown)
      }
    })

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !props.loading) {
        handleCancel()
      }
    }

    return {
      handleConfirm,
      handleCancel,
      handleOverlayClick,
      getIcon
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  max-width: 400px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  transform: scale(1);
  transition: all 0.3s ease;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 24px 16px;
  border-bottom: 1px solid #f3f4f6;
}

.modal-icon {
  font-size: 24px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.4;
}

.modal-body {
  padding: 16px 24px;
}

.modal-message {
  margin: 0 0 8px;
  font-size: 14px;
  color: #4b5563;
  line-height: 1.5;
}

.modal-details {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid #f59e0b;
}

.modal-details small {
  color: #6b7280;
  font-size: 12px;
  line-height: 1.4;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px 24px;
  background: #f9fafb;
  border-top: 1px solid #f3f4f6;
}

.modal-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 80px;
  justify-content: center;
}

.modal-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.modal-btn-cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.modal-btn-cancel:hover:not(:disabled) {
  background: #e5e7eb;
  color: #4b5563;
}

.modal-btn-confirm {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.modal-btn-confirm:hover:not(:disabled) {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
}

.modal-btn-confirm.loading {
  background: #9ca3af;
  cursor: not-allowed;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 类型特定样式 */
.modal-container.danger {
  border-top: 4px solid #ef4444;
}

.modal-container.danger .modal-btn-confirm {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.modal-container.danger .modal-btn-confirm:hover:not(:disabled) {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.modal-container.danger .modal-details {
  border-left-color: #ef4444;
}

.modal-container.info {
  border-top: 4px solid #3b82f6;
}

.modal-container.info .modal-btn-confirm {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.modal-container.info .modal-btn-confirm:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.modal-container.info .modal-details {
  border-left-color: #3b82f6;
}

.modal-container.success {
  border-top: 4px solid #10b981;
}

.modal-container.success .modal-btn-confirm {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.modal-container.success .modal-btn-confirm:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.modal-container.success .modal-details {
  border-left-color: #10b981;
}

/* 动画效果 */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9) translateY(-20px);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .modal-overlay {
    padding: 16px;
  }

  .modal-container {
    max-width: none;
    width: 100%;
  }

  .modal-header {
    padding: 20px 20px 16px;
  }

  .modal-title {
    font-size: 16px;
  }

  .modal-body {
    padding: 16px 20px;
  }

  .modal-footer {
    padding: 16px 20px 20px;
    flex-direction: column-reverse;
  }

  .modal-btn {
    width: 100%;
    padding: 12px 20px;
  }
}

/* 深色主题支持 */
@media (prefers-color-scheme: dark) {
  .modal-container {
    background: #1f2937;
    color: #f9fafb;
  }

  .modal-title {
    color: #f9fafb;
  }

  .modal-message {
    color: #d1d5db;
  }

  .modal-header {
    border-bottom-color: #374151;
  }

  .modal-footer {
    background: #111827;
    border-top-color: #374151;
  }

  .modal-btn-cancel {
    background: #374151;
    color: #d1d5db;
  }

  .modal-btn-cancel:hover:not(:disabled) {
    background: #4b5563;
    color: #f9fafb;
  }

  .modal-details {
    background: #374151;
    color: #9ca3af;
  }
}
</style>