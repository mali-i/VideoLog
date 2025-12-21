<template>
  <div class="gallery">
    <h2>Recorded Videos</h2>
    <div v-if="videos.length === 0" class="no-videos">No videos found in {{ directory }}</div>
    <div class="video-grid">
      <div v-for="video in videos" :key="video.name" class="video-item" @click="playVideo(video)">
        <div class="video-thumbnail">
            <!-- Using video tag as thumbnail for simplicity -->
            <video :src="`media://${video.path}`" preload="metadata" muted></video>
            <div class="play-icon">▶</div>
        </div>
        <div class="video-info">
          <div class="video-name" :title="video.name">{{ video.name }}</div>
          <div class="video-date">{{ formatDate(video.createdAt) }}</div>
        </div>
      </div>
    </div>
    
    <div v-if="selectedVideo" class="video-modal" @click.self="closeModal">
        <div class="modal-content">
            <video :src="`media://${selectedVideo.path}`" controls autoplay></video>
            <div class="modal-footer">
                <span>{{ selectedVideo.name }}</span>
                <button class="close-btn" @click="closeModal">Close</button>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import dayjs from 'dayjs';

const props = defineProps({
  directory: String
});

const videos = ref([]);
const selectedVideo = ref(null);

const loadVideos = async () => {
  if (props.directory) {
    videos.value = await window.electronAPI.getVideos(props.directory);
  } else {
    videos.value = [];
  }
};

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

const playVideo = (video) => {
    selectedVideo.value = video;
};

const closeModal = () => {
    selectedVideo.value = null;
};

watch(() => props.directory, loadVideos);
onMounted(loadVideos);

defineExpose({ refresh: loadVideos });
</script>

<style scoped>
.gallery {
    margin-top: 40px;
    width: 100%;
}
.no-videos {
    color: #666;
    font-style: italic;
    text-align: center;
    margin: 20px 0;
}
.video-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
}
.video-item {
    background: #fff;
    border: 1px solid #eee;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}
.video-item:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}
.video-thumbnail {
    position: relative;
    height: 150px;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
}
.video-thumbnail video {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.play-icon {
    position: absolute;
    font-size: 30px;
    color: white;
    opacity: 0.8;
    text-shadow: 0 0 10px rgba(0,0,0,0.5);
}
.video-info {
    padding: 12px;
}
.video-name {
    font-weight: 600;
    font-size: 0.9em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 5px;
}
.video-date {
    font-size: 0.8em;
    color: #888;
}
.video-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(5px);
}
.modal-content {
    background: white;
    padding: 0;
    border-radius: 8px;
    width: 90%;
    max-width: 1000px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}
.modal-content video {
    width: 100%;
    max-height: 70vh;
    background: black;
}
.modal-footer {
    padding: 15px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #eee;
}
.close-btn {
    padding: 8px 16px;
    background: #e74c3c;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
</style>
