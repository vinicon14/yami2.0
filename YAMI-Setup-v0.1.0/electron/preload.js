const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('yami', {
  // Config management
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  
  // Gateway
  getGatewayUrl: () => ipcRenderer.invoke('get-gateway-url'),
  
  // Events
  onOpenSettings: (callback) => ipcRenderer.on('open-settings', callback),
  
  // Voice
  startListening: () => ipcRenderer.invoke('start-voice-listening'),
  stopListening: () => ipcRenderer.invoke('stop-voice-listening'),
  
  // System
  getVersion: () => '0.1.0',
  getPlatform: () => process.platform
});
