import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config: any) => ipcRenderer.invoke('save-config', config),
  apiRequest: (options: any) => ipcRenderer.invoke('api-request', options),
  updateTray: (sessionData: any) => ipcRenderer.send('update-tray', sessionData),
  showNotification: (notification: any) => ipcRenderer.send('show-notification', notification),
  onTimerAction: (callback: (action: string) => void) => {
    ipcRenderer.on('timer-action', (_: any, action: string) => callback(action));
  },
});
