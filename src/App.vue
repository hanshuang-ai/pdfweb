<template>
  <div id="app">
    <FileUploader />
  </div>
</template>

<script>
import FileUploader from './components/FileUploader.vue'

export default {
  name: 'App',
  components: {
    FileUploader
  }
}
</script>

<style>
#app {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>