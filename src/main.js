import { app, BrowserWindow, ipcMain, dialog, protocol, net, nativeImage } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import url from 'node:url';
import crypto from 'node:crypto';
import Store from 'electron-store';
import started from 'electron-squirrel-startup';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: {
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      stream: true
    }
  },
  {
    scheme: 'thumbnail',
    privileges: {
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true
    }
  }
]);

const store = new Store();

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false, // Allow access to local files
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// IPC Handlers
ipcMain.handle('dialog:openDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  if (canceled) {
    return;
  } else {
    return filePaths[0];
  }
});

ipcMain.handle('config:get', (event, key) => {
  return store.get(key);
});

ipcMain.handle('config:set', (event, key, value) => {
  store.set(key, value);
});

ipcMain.handle('video:save', async (event, { buffer, filename, directory }) => {
  try {
    const filePath = path.join(directory, filename);
    await fs.promises.writeFile(filePath, Buffer.from(buffer));
    return { success: true, filePath };
  } catch (error) {
    console.error('Failed to save video:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('video:list', async (event, directory) => {
  try {
    if (!fs.existsSync(directory)) return [];
    const files = await fs.promises.readdir(directory);
    const videoFiles = files.filter(file => {
      // Filter out hidden files (starting with . or ._) and only include video files
      if (file.startsWith('.') || file.startsWith('._')) return false;
      return file.endsWith('.webm') || file.endsWith('.mp4');
    });
    
    const videos = await Promise.all(videoFiles.map(async (file) => {
        const filePath = path.join(directory, file);
        const stats = await fs.promises.stat(filePath);
        return {
            name: file,
            path: filePath,
            createdAt: stats.birthtime,
            size: stats.size
        };
    }));
    
    return videos.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Failed to list videos:', error);
    return [];
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  const thumbnailsDir = path.join(app.getPath('userData'), 'thumbnails');
  if (!fs.existsSync(thumbnailsDir)) {
    fs.mkdirSync(thumbnailsDir, { recursive: true });
  }

  protocol.handle('thumbnail', async (request) => {
    const decodedPath = decodeURIComponent(request.url.slice('thumbnail://'.length));
    
    const hash = crypto.createHash('md5').update(decodedPath).digest('hex');
    const thumbPath = path.join(thumbnailsDir, `${hash}.jpg`);

    try {
      try {
        await fs.promises.access(thumbPath);
      } catch {
        const image = await nativeImage.createThumbnailFromPath(decodedPath, { width: 320, height: 180 });
        const buffer = image.toJPEG(80);
        await fs.promises.writeFile(thumbPath, buffer);
      }
      return net.fetch(url.pathToFileURL(thumbPath).toString());
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      return new Response('Error generating thumbnail', { status: 500 });
    }
  });



  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
