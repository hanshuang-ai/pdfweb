<template>
  <div id="app">
    <div class="app-container">
      <FileUploader @upload-success="refreshFileList" />
      <FileList ref="fileListRef" />
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 1rem;
  box-sizing: border-box;
}

.app-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (max-width: 768px) {
  #app {
    padding: 1rem 0.5rem;
  }

  .app-container {
    gap: 0.5rem;
  }
}
</style>