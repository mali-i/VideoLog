<template>
  <div class="recorder">
    <div class="video-container">
      <video ref="videoPreview" autoplay muted playsinline></video>
      <div v-if="isRecording" class="recording-indicator">🔴 Recording</div>
      <div v-if="statusMessage" class="status-message" :class="statusType">{{ statusMessage }}</div>
    </div>
    <div class="controls">
      <button 
        v-if="!isRecording" 
        @click="startRecording" 
        :disabled="!stream" 
        class="btn-start"
      >
        <span class="btn-icon">🎥</span>
        Start Recording
      </button>
      <button 
        v-else 
        @click="stopRecording" 
        class="btn-stop"
      >
        <span class="btn-icon">⏹</span>
        Stop Recording
      </button>
    </div>
    
    <!-- Speech Recognition Display -->
    <div class="speech-recognition-panel">
      <div class="speech-header">
        <h3>Real-time Speech Recognition</h3>
        <div class="speech-status" :class="{ 'listening': isListening }">
          {{ isListening ? 'Listening...' : 'Standby' }}
        </div>
      </div>
      <div class="speech-content">
        <textarea 
          class="final-text-input" 
          v-model="recognizedText" 
          placeholder="Speak to see text here... (You can edit this text)"
        ></textarea>
        <div class="interim-text" v-if="interimText">{{ interimText }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import dayjs from 'dayjs';
import { createModel } from 'vosk-browser';

const props = defineProps({
  saveDirectory: String
});

const emit = defineEmits(['video-saved']);

const videoPreview = ref(null);
const stream = ref(null);
const mediaRecorder = ref(null);
const isRecording = ref(false);
const recordedChunks = ref([]);
const isSaving = ref(false);
const statusMessage = ref('');
const statusType = ref('info');

// Devices
const selectedVideoDeviceId = ref('');
const selectedAudioDeviceId = ref('');

// Vosk Speech Recognition
const recognizer = ref(null);
const model = ref(null);
const isListening = ref(false);
const recognizedText = ref('');
const interimText = ref('');
const audioContext = ref(null);
const mediaSource = ref(null);
const processor = ref(null);

const showStatus = (message, type = 'info', duration = 3000) => {
  statusMessage.value = message;
  statusType.value = type;
  if (duration > 0) {
    setTimeout(() => {
      statusMessage.value = '';
    }, duration);
  }
};

const initVosk = async () => {
  try {
    if (model.value) return true;
    
    console.log('Initializing Vosk...');
    showStatus('Loading speech model...', 'info', 0);
    
    // Initialize Vosk with Chinese model
    // Using a small Chinese model
    const modelUrl = 'https://alphacephei.com/vosk/models/vosk-model-small-cn-0.22.zip';
    
    model.value = await createModel(modelUrl);
    
    // Create recognizer
    const sampleRate = 16000; // Vosk prefers 16kHz
    recognizer.value = new model.value.KaldiRecognizer(sampleRate);
    
    recognizer.value.on("result", (message) => {
      const text = message.result.text;
      if (text && text.trim()) {
        recognizedText.value = (recognizedText.value + ' ' + text).trim();
        interimText.value = '';
      }
    });

    recognizer.value.on("partialresult", (message) => {
      const text = message.result.partial;
      if (text) {
        interimText.value = text;
      }
    });
    
    console.log('Vosk initialized successfully');
    showStatus('Voice recognition ready', 'success', 2000);
    
    isListening.value = false;
    return true;
  } catch (err) {
    console.error('Failed to initialize Vosk:', err);
    showStatus('Failed to initialize voice recognition', 'error', 3000);
    return false;
  }
};

const startSpeechRecognition = async () => {
  if (!stream.value) {
    console.log('No audio stream available');
    return;
  }

  try {
    const initialized = await initVosk();
    if (!initialized) return;

    // Set up audio processing
    if (!audioContext.value) {
      audioContext.value = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000, // Force 16kHz if possible
      });
    }

    if (audioContext.value.state === 'suspended') {
      await audioContext.value.resume();
    }

    const source = audioContext.value.createMediaStreamSource(stream.value);
    mediaSource.value = source;

    // Use ScriptProcessor for audio capture (deprecated but works widely)
    // Buffer size 4096 provides good balance
    const bufferSize = 4096;
    const scriptProcessor = audioContext.value.createScriptProcessor(bufferSize, 1, 1);
    processor.value = scriptProcessor;
    
    scriptProcessor.onaudioprocess = (event) => {
      if (!isRecording.value) return;
      
      const inputData = event.inputBuffer.getChannelData(0);
      
      if (recognizer.value) {
        try {
          // Send float data directly to Vosk
          recognizer.value.acceptWaveformFloat(inputData, audioContext.value.sampleRate);
        } catch (err) {
          console.error('Error processing audio:', err);
        }
      }
    };

    source.connect(scriptProcessor);
    scriptProcessor.connect(audioContext.value.destination);
    
    recognizedText.value = '';
    interimText.value = '';
    isListening.value = true;
    
    console.log('Speech recognition started');
  } catch (err) {
    console.error('Failed to start speech recognition:', err);
    showStatus('Failed to start voice recognition', 'error', 3000);
  }
};

const stopSpeechRecognition = () => {
  if (processor.value && mediaSource.value) {
    try {
      processor.value.disconnect();
      mediaSource.value.disconnect();
      isListening.value = false;
      console.log('Speech recognition stopped');
    } catch (err) {
      console.log('Error stopping speech recognition:', err);
    }
  }
};

const wordCount = computed(() => {
  return recognizedText.value.trim().split(/\s+/).filter(w => w.length > 0).length;
});

const charCount = computed(() => {
  return recognizedText.value.length;
});

const startCamera = async () => {
  try {
    if (stream.value) {
      stream.value.getTracks().forEach(track => track.stop());
    }

    // Load settings from localStorage
    selectedVideoDeviceId.value = localStorage.getItem('selectedVideoDeviceId') || '';
    selectedAudioDeviceId.value = localStorage.getItem('selectedAudioDeviceId') || '';

    const constraints = {
      video: selectedVideoDeviceId.value ? { deviceId: { exact: selectedVideoDeviceId.value } } : true,
      audio: selectedAudioDeviceId.value ? { deviceId: { exact: selectedAudioDeviceId.value } } : true
    };

    stream.value = await navigator.mediaDevices.getUserMedia(constraints);
    if (videoPreview.value) {
      videoPreview.value.srcObject = stream.value;
    }
  } catch (err) {
    console.error("Error accessing camera:", err);
    showStatus('Failed to access camera/microphone', 'error');
  }
};

const startRecording = () => {
  if (!props.saveDirectory) {
      alert("Please select a storage directory first.");
      return;
  }

  recordedChunks.value = [];
  
  // Try to use MP4 format, fallback to WebM if not supported
  let mimeType = 'video/webm;codecs=vp9';
  let fileExtension = 'webm';
  
  if (MediaRecorder.isTypeSupported('video/mp4')) {
    mimeType = 'video/mp4';
    fileExtension = 'mp4';
  } else if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
    mimeType = 'video/mp4;codecs=avc1';
    fileExtension = 'mp4';
  } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
    // Some systems support H.264 in WebM container
    mimeType = 'video/webm;codecs=h264';
    fileExtension = 'webm';
  }
  
  console.log('Recording with mimeType:', mimeType);
  mediaRecorder.value = new MediaRecorder(stream.value, { mimeType });
  
  mediaRecorder.value.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.value.push(event.data);
    }
  };

  mediaRecorder.value.onstop = async () => {
    if (isSaving.value) {
      console.log('Already saving, skipping duplicate save');
      return;
    }
    
    if (recordedChunks.value.length === 0) {
      console.error('No recorded chunks available');
      alert('Failed to save video: No data recorded');
      isRecording.value = false;
      return;
    }

    isSaving.value = true;
    
    try {
      const blob = new Blob(recordedChunks.value, { type: mimeType });
      const buffer = await blob.arrayBuffer();
      const filename = `video_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.${fileExtension}`;
      
      const result = await window.electronAPI.saveVideo({
        buffer,
        filename,
        directory: props.saveDirectory
      });
      
      if (result.success) {
        showStatus('Video saved successfully! ✅', 'success', 3000);
        emit('video-saved');
      } else {
        showStatus(`Failed to save video: ${result.error}`, 'error', 5000);
      }
    } finally {
      recordedChunks.value = [];
      isRecording.value = false;
      isSaving.value = false;
    }
  };

  mediaRecorder.value.start();
  isRecording.value = true;
  showStatus('Recording started! 🎬', 'success', 2000);
  
  // Start speech recognition when video recording starts
  startSpeechRecognition();
};

const stopRecording = () => {
  if (mediaRecorder.value && isRecording.value) {
    showStatus('Processing video...', 'info', 0);
    mediaRecorder.value.stop();
    
    // Stop speech recognition when video recording stops
    stopSpeechRecognition();
  }
};

onMounted(async () => {
  await startCamera();
  // Initialize Vosk on component mount (in background, don't block camera)
  initVosk();
});

onUnmounted(() => {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop());
  }
  
  // Clean up speech recognition
  stopSpeechRecognition();
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

.device-selectors {
  display: flex;
  gap: 20px;
  width: 100%;
  max-width: 640px;
  margin-bottom: 10px;
}

.selector-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.selector-group label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.selector-group select {
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #ddd;
  background: white;
  font-size: 14px;
  outline: none;
}

.selector-group select:disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.btn-refresh {
  align-self: flex-end;
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 2px;
  font-size: 16px;
  transition: background 0.2s;
}

.btn-refresh:hover {
  background: #f0f0f0;
}

.btn-refresh.spinning {
  animation: spin 1s linear infinite;
  pointer-events: none;
  opacity: 0.7;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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

.status-message {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  animation: slideUp 0.3s ease;
  max-width: 90%;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.status-message.info {
  background: rgba(52, 152, 219, 0.9);
  color: white;
}

.status-message.success {
  background: rgba(46, 204, 113, 0.9);
  color: white;
}

.status-message.error {
  background: rgba(231, 76, 60, 0.9);
  color: white;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
.controls button {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  color: white;
  border: none;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn-start {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.btn-start:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-stop {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  animation: pulse 2s infinite;
}

.btn-stop:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 2px 8px rgba(245, 87, 108, 0.3);
  }
  50% {
    box-shadow: 0 2px 16px rgba(245, 87, 108, 0.6);
  }
}

.controls button:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-icon {
  font-size: 18px;
}

/* Speech Recognition Panel */
.speech-recognition-panel {
  width: 100%;
  max-width: 640px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-top: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.speech-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.speech-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.speech-status {
  font-size: 12px;
  color: #bbb;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  background: #f5f5f5;
}

.speech-status.listening {
  color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
  animation: blink 1s infinite;
}

.speech-content {
  background: #f9f9f9;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid transparent;
  transition: all 0.3s;
}

.speech-content:focus-within {
  background: #fff;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.final-text-input {
  width: 100%;
  min-height: 80px;
  max-height: 200px;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  color: #333;
  outline: none;
  display: block;
}

.interim-text {
  margin-top: 8px;
  color: #666;
  font-style: italic;
  font-size: 13px;
  border-top: 1px dashed #eee;
  padding-top: 4px;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}


.speech-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
  justify-content: flex-end;
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
