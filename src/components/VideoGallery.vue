<template>
  <div class="gallery">
    <h2>Recorded Videos</h2>
    <div v-if="videos.length === 0" class="no-videos">No videos found in {{ directory }}</div>
    <div class="video-grid">
      <div v-for="video in videos" :key="video.name" class="video-item" @click="playVideo(video)">
        <div class="video-thumbnail">
            <img 
              :src="getThumbnailUrl(video.path)" 
              loading="lazy" 
              alt="Video thumbnail" 
              @error="handleThumbnailError"
            />
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
            <video 
              :src="getVideoUrl(selectedVideo.path)" 
              controls 
              autoplay
              @error="handleVideoError"
            ></video>
            <div class="modal-footer">
                <span>{{ selectedVideo.name }}</span>
                <div class="modal-actions">
                  <button class="close-btn" @click="closeModal">Close</button>
                </div>
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

const getThumbnailUrl = (path) => {
  // Use custom thumbnail:// protocol
  return `thumbnail://local${path}`;
};

const getVideoUrl = (path) => {
  // Use custom media:// protocol for secure and reliable playback
  // Using 'local' as a dummy host to ensure standard URL parsing works correctly
  try {
    return `media://local${path}`;
  } catch (e) {
    console.error('Failed to create media URL:', e);
    return '';
  }
};

const playVideo = (video) => {
    selectedVideo.value = video;
};

const closeModal = () => {
    selectedVideo.value = null;
};

const handleThumbnailError = (e) => {
    // Fallback to a generic video icon if thumbnail generation fails
    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMCA4djhsNi00LTYtNHptOS01SDVjLTEuMSAwLTIgLjktMiAydjE0YzAgMS4xLjkgMiAyIDJoMTRjMS4xIDAgMi0uOSAyLTJWNWMwLTEuMS0uOS0yLTItMnptMCAxNkg1VjVoMTR2MTR6Ii8+PC9zdmc+';
    e.target.style.objectFit = 'scale-down';
    e.target.style.padding = '20px';
    e.target.style.backgroundColor = '#333';
};

const handleVideoError = (e) => {
    console.error('Video playback error:', e.target.error, e.target.src);
    alert(`Failed to play video. Error code: ${e.target.error ? e.target.error.code : 'unknown'}`);
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

@media (max-width: 600px) {
    .video-grid {
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 10px;
    }
    
    .video-thumbnail {
        height: 100px;
    }
    
    .play-icon {
        font-size: 24px;
    }
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
.video-thumbnail video,
.video-thumbnail img {
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
    margin-bottom: 8px;
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

@media (max-width: 600px) {
    .modal-content {
        width: 95%;
    }
    
    .modal-footer {
        flex-direction: column;
        gap: 10px;
        align-items: stretch;
        text-align: center;
    }
    
    .close-btn {
        width: 100%;
    }
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
.modal-actions {
    display: flex;
    gap: 10px;
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
