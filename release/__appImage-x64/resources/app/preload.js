const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
});

contextBridge.exposeInMainWorld('platform', {
  isElectron: true,
  isDesktop: true,
  isMobile: false,
});
