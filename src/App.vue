<template>
  <div class="app-container">
    <header>
      <div class="brand">
        <h1>📹 Video Log</h1>
      </div>
      <div class="settings">
        <div class="path-display" :title="saveDirectory">
            <span class="label">Storage:</span>
            <span class="value">{{ saveDirectory || 'Not selected' }}</span>
        </div>
        <button @click="selectDirectory" class="btn-secondary">Change Folder</button>
      </div>
    </header>
    
    <main>
      <div class="recorder-section">
        <Recorder :saveDirectory="saveDirectory" @video-saved="refreshGallery" />
      </div>
      <div class="gallery-section">
        <VideoGallery ref="galleryRef" :directory="saveDirectory" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Recorder from './components/Recorder.vue';
import VideoGallery from './components/VideoGallery.vue';

const saveDirectory = ref('');
const galleryRef = ref(null);

const selectDirectory = async () => {
  const path = await window.electronAPI.selectDirectory();
  if (path) {
    saveDirectory.value = path;
    await window.electronAPI.setConfig('saveDirectory', path);
  }
};

const refreshGallery = () => {
    if (galleryRef.value) {
        galleryRef.value.refresh();
    }
};

onMounted(async () => {
  const savedPath = await window.electronAPI.getConfig('saveDirectory');
  if (savedPath) {
    saveDirectory.value = savedPath;
  }
});
</script>

<style>
body {
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: #f5f7fa;
    color: #2c3e50;
}

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: white;
  padding: 15px 25px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

h1 {
    margin: 0;
    font-size: 1.5rem;
    color: #333;
}

.settings {
  display: flex;
  gap: 15px;
  align-items: center;
}

.path-display {
    display: flex;
    flex-direction: column;
    font-size: 0.85rem;
    text-align: right;
}

.path-display .label {
    color: #888;
    font-size: 0.75rem;
}

.path-display .value {
    font-weight: 500;
    max-width: 300px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

button {
    cursor: pointer;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.2s;
}

.btn-secondary {
    background-color: #eef2f7;
    color: #5b6b79;
    padding: 8px 16px;
}

.btn-secondary:hover {
    background-color: #dfe6ed;
    color: #333;
}

.recorder-section {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    margin-bottom: 30px;
}

.gallery-section {
    /* Gallery has its own styling */
}
</style>
