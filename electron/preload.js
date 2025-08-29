const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
  onNavigateTo: (callback) => ipcRenderer.on('navigate-to', callback),
  onTestPrinter: (callback) => ipcRenderer.on('test-printer', callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// Platform detection
contextBridge.exposeInMainWorld('platform', {
  isElectron: true,
  isDesktop: true,
  isMobile: false
});