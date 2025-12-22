<template>
  <div class="recorder">
    <div class="video-container">
      <video ref="videoPreview" autoplay muted></video>
      <div v-if="isRecording" class="recording-indicator">🔴 Recording</div>
    </div>
    <div class="controls">
      <button v-if="!isRecording" @click="startRecording" :disabled="!stream">Start Recording</button>
      <button v-else @click="stopRecording">Stop Recording</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import dayjs from 'dayjs';

const props = defineProps({
  saveDirectory: String
});

const emit = defineEmits(['video-saved']);

const videoPreview = ref(null);
const stream = ref(null);
const mediaRecorder = ref(null);
const isRecording = ref(false);
const recordedChunks = ref([]);

const startCamera = async () => {
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (videoPreview.value) {
      videoPreview.value.srcObject = stream.value;
    }
  } catch (err) {
    console.error("Error accessing camera:", err);
  }
};

const startRecording = () => {
  if (!props.saveDirectory) {
      alert("Please select a storage directory first.");
      return;
  }

  recordedChunks.value = [];
  mediaRecorder.value = new MediaRecorder(stream.value, { mimeType: 'video/webm;codecs=vp9' });
  
  mediaRecorder.value.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.value.push(event.data);
    }
  };

  mediaRecorder.value.onstop = async () => {
    const blob = new Blob(recordedChunks.value, { type: 'video/webm' });
    const buffer = await blob.arrayBuffer();
    const filename = `video_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.webm`;
    
    const result = await window.electronAPI.saveVideo({
      buffer,
      filename,
      directory: props.saveDirectory
    });
    
    if (result.success) {
      // alert(`Video saved to ${result.filePath}`);
      emit('video-saved');
    } else {
      alert(`Failed to save video: ${result.error}`);
    }
    isRecording.value = false;
  };

  mediaRecorder.value.start();
  isRecording.value = true;
};

const stopRecording = () => {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop();
  }
};

onMounted(() => {
  startCamera();
});

onUnmounted(() => {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop());
  }
});
</script>

<style scoped>
.recorder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
}
.video-container {
  position: relative;
  width: 100%;
  max-width: 640px;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 16/9;
}
video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.recording-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  color: white;
  background: rgba(255, 0, 0, 0.7);
  padding: 5px 10px;
  border-radius: 4px;
  font-weight: bold;
  animation: blink 1s infinite;
}
@keyframes blink {
  50% { opacity: 0.5; }
}
.controls button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
}
.controls button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
.controls button:last-child {
    background-color: #e74c3c;
}

@media (max-width: 600px) {
    .controls {
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: 10px;
    }
    
    .controls button {
        width: 100%;
    }
}
</style>
