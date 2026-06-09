const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('yami', {
  // ─── App config ────────────────────────────────────────────────────────────
  getConfig: () => ipcRenderer.invoke('app:getConfig'),
  saveConfig: (cfg) => ipcRenderer.invoke('app:saveConfig', cfg),
  getYamiConfig: () => ipcRenderer.invoke('yami:getConfig'),

  // ─── Gateway ───────────────────────────────────────────────────────────────
  gateway: {
    url: () => ipcRenderer.invoke('gateway:url'),
    wsUrl: () => ipcRenderer.invoke('gateway:wsUrl'),
    token: () => ipcRenderer.invoke('gateway:token'),
    status: () => ipcRenderer.invoke('gateway:status'),
    request: (method, path, body) => ipcRenderer.invoke('gateway:request', { method, path, body }),
    openDashboard: () => ipcRenderer.invoke('shell:openDashboard')
  },

  // ─── Database – messages ───────────────────────────────────────────────────
  messages: {
    get: (session, limit) => ipcRenderer.invoke('db:getMessages', session, limit),
    add: (msg) => ipcRenderer.invoke('db:addMessage', msg),
    clear: (session) => ipcRenderer.invoke('db:clearMessages', session)
  },

  // ─── Database – events ─────────────────────────────────────────────────────
  events: {
    get: (range) => ipcRenderer.invoke('db:getEvents', range),
    add: (evt) => ipcRenderer.invoke('db:addEvent', evt),
    update: (evt) => ipcRenderer.invoke('db:updateEvent', evt),
    delete: (id) => ipcRenderer.invoke('db:deleteEvent', id)
  },

  // ─── Database – settings ───────────────────────────────────────────────────
  settings: {
    get: (key) => ipcRenderer.invoke('db:getSetting', key),
    set: (key, val) => ipcRenderer.invoke('db:setSetting', key, val)
  },

  // ─── TTS / Voice ──────────────────────────────────────────────────────────
  tts: {
    speak: (text) => ipcRenderer.invoke('tts:speak', text)
  },
  voice: {
    start: () => ipcRenderer.invoke('voice:start'),
    stop: () => ipcRenderer.invoke('voice:stop'),
    onCommand: (cb) => ipcRenderer.on('voice-command', (_, cmd) => cb(cmd))
  },

  // ─── Notifications ────────────────────────────────────────────────────────
  notify: (title, body) => ipcRenderer.invoke('notify', { title, body }),

  // ─── Shell ────────────────────────────────────────────────────────────────
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),

  // ─── System ───────────────────────────────────────────────────────────────
  system: () => ipcRenderer.invoke('system:info'),
  version: () => '0.1.0',

  // ─── IPC Events ──────────────────────────────────────────────────────────
  onNavigate: (cb) => ipcRenderer.on('nav', (_, page) => cb(page)),
  onOpenSettings: (cb) => ipcRenderer.on('nav', (_, page) => { if (page === 'settings') cb(); })
});
