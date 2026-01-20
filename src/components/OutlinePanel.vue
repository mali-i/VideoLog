<template>
  <div class="outline-panel" :class="{ 'is-collapsed': isCollapsed }">
    <div class="outline-header">
      <div class="title-with-toggle">
        <button @click="isCollapsed = !isCollapsed" class="btn-toggle" :title="isCollapsed ? '展开大纲' : '折叠大纲'">
          {{ isCollapsed ? '▶' : '▼' }}
        </button>
        <h3 v-if="!isCollapsed">录制大纲</h3>
        <h3 v-else class="collapsed-title">大纲</h3>
      </div>
      <div v-if="!isCollapsed" class="outline-actions">
        <button @click="clearOutline" class="btn-clear" title="清空大纲">🗑️</button>
      </div>
    </div>
    <div v-if="!isCollapsed" class="outline-content">
      <textarea 
        v-model="outlineText" 
        placeholder="在这里输入你的录制大纲或脚本..."
        class="outline-textarea"
        @input="saveOutline"
      ></textarea>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const outlineText = ref('');
const isCollapsed = ref(false);

const saveOutline = () => {
  localStorage.setItem('recording_outline', outlineText.value);
};

const loadOutline = () => {
  const saved = localStorage.getItem('recording_outline');
  if (saved) {
    outlineText.value = saved;
  }
};

const clearOutline = () => {
  if (confirm('确定要清空录制大纲吗？')) {
    outlineText.value = '';
    saveOutline();
  }
};

onMounted(() => {
  loadOutline();
});
</script>

<style scoped>
.outline-panel {
  flex: 0 0 300px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  /* Remove fixed/min height to allow flex stretch from parent */
  max-height: 640px;
}

.outline-panel.is-collapsed {
  flex: 0 0 60px;
  padding: 16px 8px;
  align-items: center;
}

.outline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.is-collapsed .outline-header {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
  flex-direction: column;
  gap: 10px;
}

.title-with-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.is-collapsed .title-with-toggle {
  flex-direction: column;
}

.btn-toggle {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.btn-toggle:hover {
  background: #f0f0f0;
}

.outline-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
  white-space: nowrap;
}

.collapsed-title {
  writing-mode: vertical-lr;
  margin-top: 10px !important;
  letter-spacing: 4px;
  color: #999 !important;
}

.btn-clear {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.btn-clear:hover {
  opacity: 1;
}

.outline-content {
  background: #fff9f0; /* Slightly different background to distinguish from speech */
  border-radius: 6px;
  padding: 1px;
  border: 1px solid #fee2e2;
  transition: all 0.3s;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.outline-content:focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.outline-textarea {
  width: 100%;
  flex: 1;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  color: #333;
  padding: 12px;
  outline: none;
  display: block;
}
</style>
