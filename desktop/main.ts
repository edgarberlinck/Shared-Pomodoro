import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, shell, Notification } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

const isDev = process.env.NODE_ENV === 'development';
const API_URL = process.env.API_URL || (isDev ? 'http://localhost:3000' : 'https://shared-focus.vercel.app');

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;

const userDataPath = app.getPath('userData');
const configPath = path.join(userDataPath, 'config.json');

interface UserConfig {
  email?: string;
  token?: string;
  currentSessionId?: string;
}

function loadConfig(): UserConfig {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  return {};
}

function saveConfig(config: UserConfig) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

function createTray() {
  // Create tray with text if icon doesn't exist
  const iconPath = path.join(__dirname, isDev ? '../desktop/assets/tray-icon.png' : './assets/tray-icon.png');
  
  if (fs.existsSync(iconPath)) {
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon.resize({ width: 16, height: 16 }));
  } else {
    // Use empty icon template and set title
    tray = new Tray(nativeImage.createEmpty());
    tray.setTitle('🍅');
  }
  
  tray.setToolTip('Shared Pomodoro');
  
  updateTrayMenu();
  
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    } else {
      createMainWindow();
    }
  });
}

function updateTrayMenu(sessionData?: any) {
  if (!tray) return;
  
  const config = loadConfig();
  const contextMenu = Menu.buildFromTemplate([
    {
      label: sessionData 
        ? `🍅 ${formatTime(sessionData.timeLeft)} - ${sessionData.isBreak ? 'Break' : 'Focus'}`
        : 'No active session',
      enabled: false,
    },
    { type: 'separator' },
    ...(sessionData ? [
      {
        label: sessionData.status === 'RUNNING' || sessionData.status === 'BREAK' ? '⏸️ Pause' : '▶️ Start',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.send('timer-action', 
              sessionData.status === 'RUNNING' || sessionData.status === 'BREAK' ? 'pause' : 'start'
            );
          }
        },
      },
      {
        label: '🔄 Reset',
        click: () => {
          if (mainWindow) mainWindow.webContents.send('timer-action', 'reset');
        },
      },
      { type: 'separator' },
    ] as any[] : []),
    {
      label: config.token ? `Logged in as ${config.email}` : 'Not logged in',
      enabled: false,
    },
    {
      label: 'Open Dashboard',
      click: () => {
        shell.openExternal(`${API_URL}/dashboard`);
      },
    },
    { type: 'separator' },
    {
      label: mainWindow ? 'Hide Window' : 'Show Window',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow.show();
          }
        } else {
          createMainWindow();
        }
      },
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);
  
  tray.setContextMenu(contextMenu);
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    show: false,
    frame: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // In production, index.html is in Resources folder
  const indexPath = isDev 
    ? path.join(__dirname, '../desktop/index.html')
    : path.join(process.resourcesPath, 'index.html');
  
  mainWindow.loadFile(indexPath);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('close', (event: any) => {
    event.preventDefault();
    mainWindow?.hide();
  });
}

// IPC Handlers
ipcMain.handle('get-config', () => {
  return loadConfig();
});

ipcMain.handle('save-config', (_: any, config: UserConfig) => {
  saveConfig(config);
  return true;
});

ipcMain.handle('api-request', async (_: any, { method, endpoint, body, token }: any) => {
  try {
    const headers: any = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    const data = await response.json();
    
    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error: any) {
    return {
      ok: false,
      error: error.message,
    };
  }
});

ipcMain.on('update-tray', (_: any, sessionData: any) => {
  updateTrayMenu(sessionData);
  
  // Update tray icon based on state
  if (tray && sessionData) {
    const title = sessionData.isBreak ? '☕' : '🍅';
    tray.setTitle(title);
  }
});

ipcMain.on('show-notification', (_: any, { title, body }: any) => {
  const notification = new Notification({ title, body });
  notification.show();
});

app.whenReady().then(() => {
  createTray();
  createMainWindow();
});

app.on('window-all-closed', (e: Event) => {
  e.preventDefault();
});

app.on('activate', () => {
  if (!mainWindow) {
    createMainWindow();
  }
});

app.on('before-quit', () => {
  if (mainWindow) {
    mainWindow.removeAllListeners('close');
    mainWindow.close();
  }
});
