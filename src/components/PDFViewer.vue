<template>
  <div class="pdf-viewer-container">
    <iframe
      ref="pdfFrame"
      :src="viewerUrl"
      class="pdf-iframe"
      @load="onIframeLoad"
    ></iframe>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'

const pdfFrame = ref(null)
const isLoaded = ref(false)

// 从路由参数中获取PDF URL和文件名
const route = useRoute()
const pdfUrl = computed(() => {
  return route.query.url || 'https://fmatek5mfkum5gbd.public.blob.vercel-storage.com/1760518485116-09vp3lkeeri-1.JavaScript%E9%AB%98%E7%BA%A7%E7%A8%8B%E5%BA%8F%E8%AE%BE%E8%AE%A1%EF%BC%88%E7%AC%AC4%E7%89%88%EF%BC%89%5B%E5%89%8D%E7%AB%AF%E8%83%96%E5%A4%B4%E9%B1%BC%5D.pdf'
})

// 构建viewer URL，包含PDF文件参数
const viewerUrl = computed(() => {
  const encodedPdfUrl = encodeURIComponent(pdfUrl.value)
  return `/web/viewer.html?file=${encodedPdfUrl}`
})

const onIframeLoad = () => {
  isLoaded.value = true
  console.log('PDF viewer loaded successfully')
}

onMounted(() => {
  console.log('PDFViewer component mounted')
})
</script>

<style scoped>
.pdf-viewer-container {
  width: 100%;
  height: 100vh;
  position: relative;
}

.pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
