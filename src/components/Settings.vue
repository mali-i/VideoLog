<template>
  <div class="settings-container">
    <div class="settings-header">
      <h1>⚙️ 应用设置</h1>
      <button @click="$emit('close')" class="close-btn">✕</button>
    </div>

    <div class="settings-content">
      <div class="settings-section">
        <h2>豆包 API 配置</h2>
        <p class="section-description">配置豆包语音识别 API 凭证。凭证将安全地保存在本地。</p>

        <div class="form-group">
          <label for="apiKey">Access Token</label>
          <input
            id="apiKey"
            v-model="form.apiKey"
            type="password"
            placeholder="输入豆包 Access Token"
            class="form-input"
          />
          <small>从豆包控制台获取</small>
        </div>

        <div class="form-group">
          <label for="appId">App ID</label>
          <input
            id="appId"
            v-model="form.appId"
            type="text"
            placeholder="输入 App ID"
            class="form-input"
          />
          <small>火山引擎控制台获取的应用 ID</small>
        </div>

        <div class="button-group">
          <button @click="saveSettings" class="btn btn-primary">
            💾 保存配置
          </button>
          <button @click="testConnection" :disabled="!isFormValid" class="btn btn-secondary">
            🔗 测试连接
          </button>
        </div>

        <div v-if="status.message" :class="['status-message', status.type]">
          {{ status.message }}
        </div>
      </div>

      <div class="settings-section">
        <h2>关于</h2>
        <p>Video Log - 视频转录应用</p>
        <p class="text-muted">版本 1.0.0</p>
        <p class="text-muted">使用豆包大模型语音识别</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const form = ref({
  apiKey: '',
  appId: '',
});

const status = ref({
  type: '', // 'success' | 'error' | 'info'
  message: '',
});

const isFormValid = computed(() => {
  return form.value.apiKey && form.value.appId;
});

onMounted(async () => {
  // 从主进程加载已保存的设置
  if (window.electronAPI?.getSettings) {
    try {
      const settings = await window.electronAPI.getSettings();
      console.log('Loaded settings from main process:', {
        apiKey: settings.apiKey ? '***' : '',
        appId: settings.appId,
      });
      form.value = {
        apiKey: settings.apiKey || '',
        appId: settings.appId || '',
      };
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }
});

const saveSettings = async () => {
  if (!isFormValid.value) {
    showStatus('error', '请填写所有必需字段');
    return;
  }

  try {
    if (window.electronAPI?.saveSettings) {
      console.log('Saving settings:', form.value);
      const result = await window.electronAPI.saveSettings(form.value);
      console.log('Save result:', result);
      if (result.success) {
        showStatus('success', '✅ 配置已保存');
      } else {
        showStatus('error', `❌ 保存失败: ${result.error || '未知错误'}`);
      }
    }
  } catch (error) {
    console.error('Save settings error:', error);
    showStatus('error', `❌ 保存失败: ${error.message}`);
  }
};

const testConnection = async () => {
  if (!isFormValid.value) {
    showStatus('error', '请先填写配置');
    return;
  }

  try {
    showStatus('info', '🔄 正在测试连接...');
    if (window.electronAPI?.testAsrConnection) {
      const result = await window.electronAPI.testAsrConnection(form.value);
      if (result.success) {
        showStatus('success', '✅ 连接成功！API 凭证有效');
      } else {
        showStatus('error', `❌ 连接失败: ${result.error}`);
      }
    }
  } catch (error) {
    showStatus('error', `❌ 测试失败: ${error.message}`);
  }
};

const showStatus = (type, message) => {
  status.value = { type, message };
  if (type === 'success') {
    setTimeout(() => {
      status.value = { type: '', message: '' };
    }, 3000);
  }
};
</script>

<style scoped>
.settings-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f5;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border-bottom: 1px solid #ddd;
}

.settings-header h1 {
  margin: 0;
  font-size: 24px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.close-btn:hover {
  color: #000;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.settings-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.settings-section h2 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #333;
}

.section-description {
  color: #666;
  font-size: 14px;
  margin: 0 0 20px 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 4px rgba(76, 175, 80, 0.2);
}

.form-group small {
  display: block;
  margin-top: 4px;
  color: #999;
  font-size: 12px;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-primary:hover {
  background: #45a049;
}

.btn-secondary {
  background: #2196F3;
  color: white;
}

.btn-secondary:hover {
  background: #0b7dda;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status-message {
  margin-top: 15px;
  padding: 12px;
  border-radius: 4px;
  font-size: 14px;
}

.status-message.success {
  background: #c8e6c9;
  color: #2e7d32;
  border: 1px solid #81c784;
}

.status-message.error {
  background: #ffcdd2;
  color: #c62828;
  border: 1px solid #ef5350;
}

.status-message.info {
  background: #bbdefb;
  color: #1565c0;
  border: 1px solid #64b5f6;
}

.text-muted {
  color: #999;
  margin: 5px 0;
}
</style>
