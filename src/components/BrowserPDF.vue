<template>
  <div class="container">
    <div class="toolbar">
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
import { useRoute } from 'vue-router'

export default {
  name: 'BrowserPDF',
  setup() {
    const route = useRoute()
    // const defaultUrl = 'https://www.pwithe.com/Public/Upload/download/20170211/589ebf8e5bb13.pdf'
    const defaultUrl = 'https://fmatek5mfkum5gbd.public.blob.vercel-storage.com/1760506598654-5481ozc9d8m-1.JavaScript%E9%AB%98%E7%BA%A7%E7%A8%8B%E5%BA%8F%E8%AE%BE%E8%AE%A1%EF%BC%88%E7%AC%AC4%E7%89%88%EF%BC%89%5B%E5%89%8D%E7%AB%AF%E8%83%96%E5%A4%B4%E9%B1%BC%5D.pdf'
    const initial = route.query.url ? decodeURIComponent(route.query.url) : defaultUrl
    const url = ref(initial)
    const iframeRef = ref(null)

    const openNewTab = () => {
      window.open(url.value, '_blank')
    }

    onMounted(() => {
      // 如果目标站点禁止被内嵌（X-Frame-Options），用户可点击“在新标签打开”。
    })

    return { url, iframeRef, openNewTab }
  }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.toolbar {
  height: 48px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border-bottom: 1px solid #eee;
}
.toolbar input {
  flex: 1;
  height: 32px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.frameWrap {
  position: relative;
  flex: 1;
}
.frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}
</style>
