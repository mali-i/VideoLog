# 🎙️ MirroSpeak

**MirroSpeak** 是一款专为**即兴演讲练习**、**思维整理**与**视频日志**设计的桌面应用程序。它结合了视频录制与实时语音转写功能，帮助你面对镜头（Mirror）自信表达（Speak），记录每一个灵感瞬间。

## ✨ 核心特性

- **📹 沉浸式录制**：简洁的录制界面，让你专注于面对镜头的自我表达与叙述。
- **🎙️ 实时语音转写**：内置 **Vosk** 语音识别引擎，实时将你的口述转化为文字，支持后续编辑与整理。
- **📝 演讲大纲 (Outline)**：录制时可参考侧边大纲，辅助思维梳理，不再忘词。
- **🖼️ 视频回廊 (Gallery)**：内置视频管理库，轻松回顾与播放历史录像。
- **🔒 本地优先**：所有视频与文本数据存储在本地，充分保护你的隐私。

## 🛠️ 技术栈

本项目基于现代 Web 技术栈构建：

- **Core**: [Electron](https://www.electronjs.org/)
- **Frontend**: [Vue 3](https://vuejs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Speech AI**: [Vosk Browser](https://alphacephei.com/vosk/)
- **Data**: [Electron Store](https://github.com/sindresorhus/electron-store)

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run start
```

### 打包构建

```bash
npm run make
```
