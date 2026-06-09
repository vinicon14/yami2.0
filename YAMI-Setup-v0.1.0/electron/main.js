const { app, BrowserWindow, Menu, ipcMain, Tray, nativeImage, shell, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');

// ─── Paths ────────────────────────────────────────────────────────────────────
const YAMI_HOME = path.join(process.env.USERPROFILE, '.yami');
const YAMI_CONFIG = path.join(YAMI_HOME, 'yami.json');
const APP_DATA = path.join(process.env.USERPROFILE, 'AppData', 'Local', 'YAMI');
const APP_CONFIG = path.join(APP_DATA, 'app.json');
const DB_DIR = path.join(APP_DATA, 'db');
const RUNTIME_CORE = path.join(YAMI_HOME, 'runtime', 'core', 'yami.mjs');
const AUTO_PANEL_SERVER = path.join(YAMI_HOME, 'auto-panel', 'server.js');
const PANEL_PORT = 18808;

// ─── State ────────────────────────────────────────────────────────────────────
let mainWindow = null;
let tray = null;
let gatewayProcess = null;
let panelProcess = null;
let gatewayToken = null;
let gatewayPort = 18789;
let voiceListenerProc = null;

// ─── Boot ─────────────────────────────────────────────────────────────────────
function ensureDirs() {
  [APP_DATA, DB_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });
}

function loadGatewayConfig() {
  try {
    if (fs.existsSync(YAMI_CONFIG)) {
      const c = JSON.parse(fs.readFileSync(YAMI_CONFIG, 'utf8'));
      gatewayToken = c?.gateway?.auth?.token || null;
      gatewayPort  = c?.gateway?.port || 18789;
    }
  } catch (e) { console.warn('gateway config:', e.message); }
}

// ─── JSON "database" (no native deps) ────────────────────────────────────────
function dbFile(name) { return path.join(DB_DIR, `${name}.json`); }

function dbRead(name) {
  try { return JSON.parse(fs.readFileSync(dbFile(name), 'utf8')); }
  catch { return []; }
}

function dbWrite(name, data) {
  try { fs.writeFileSync(dbFile(name), JSON.stringify(data, null, 2)); return true; }
  catch { return false; }
}

function dbSettingsRead() {
  try { return JSON.parse(fs.readFileSync(dbFile('settings'), 'utf8')); }
  catch { return {}; }
}
function dbSettingsWrite(obj) {
  try { fs.writeFileSync(dbFile('settings'), JSON.stringify(obj, null, 2)); return true; }
  catch { return false; }
}

// ─── App Config ───────────────────────────────────────────────────────────────
function readAppConfig() {
  try { if (fs.existsSync(APP_CONFIG)) return JSON.parse(fs.readFileSync(APP_CONFIG, 'utf8')); }
  catch {}
  return null;
}
function writeAppConfig(config) {
  try { fs.writeFileSync(APP_CONFIG, JSON.stringify(config, null, 2)); return true; }
  catch { return false; }
}

// ─── Gateway ──────────────────────────────────────────────────────────────────
function startGateway() {
  if (!fs.existsSync(RUNTIME_CORE)) { console.warn('Runtime not found:', RUNTIME_CORE); return; }
  isGatewayRunning().then(running => {
    if (running) { console.log('Gateway already running'); return; }
    const env = { ...process.env, YAMI_HOME, OPENCLAW_HOME: YAMI_HOME,
      YAMI_CONFIG_PATH: YAMI_CONFIG, OPENCLAW_CONFIG_PATH: YAMI_CONFIG, OPENCLAW_STATE_DIR: YAMI_HOME };
    gatewayProcess = spawn('node', [RUNTIME_CORE, 'gateway'], { env, stdio: 'pipe', cwd: YAMI_HOME });
    gatewayProcess.stdout?.on('data', d => console.log('[GW]', d.toString().trim()));
    gatewayProcess.stderr?.on('data', d => console.error('[GW-ERR]', d.toString().trim()));
    gatewayProcess.on('error', e => console.error('[GW]', e.message));
    console.log('Gateway started, PID:', gatewayProcess.pid);
  });
}

// ─── Auto-panel server ────────────────────────────────────────────────────────
function isPanelRunning() {
  return new Promise(resolve => {
    const req = http.request({ hostname: '127.0.0.1', port: PANEL_PORT, path: '/', method: 'GET', timeout: 1000 },
      () => resolve(true));
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });
}

function startPanel() {
  if (!fs.existsSync(AUTO_PANEL_SERVER)) {
    console.warn('Auto-panel server not found:', AUTO_PANEL_SERVER);
    return;
  }
  isPanelRunning().then(running => {
    if (running) { console.log('Auto-panel already running on', PANEL_PORT); return; }
    const env = { ...process.env, YAMI_HOME, OPENCLAW_HOME: YAMI_HOME,
      YAMI_CONFIG_PATH: YAMI_CONFIG, OPENCLAW_CONFIG_PATH: YAMI_CONFIG, OPENCLAW_STATE_DIR: YAMI_HOME,
      YAMI_PANEL_PORT: String(PANEL_PORT) };
    panelProcess = spawn('node', [AUTO_PANEL_SERVER], { env, stdio: 'pipe', cwd: path.dirname(AUTO_PANEL_SERVER) });
    panelProcess.stdout?.on('data', d => console.log('[PANEL]', d.toString().trim()));
    panelProcess.stderr?.on('data', d => console.error('[PANEL-ERR]', d.toString().trim()));
    panelProcess.on('error', e => console.error('[PANEL]', e.message));
    console.log('Auto-panel started, PID:', panelProcess.pid);
  });
}

// Wait until panel is ready then load it
async function waitAndLoadPanel(maxMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    if (await isPanelRunning()) return true;
    await new Promise(r => setTimeout(r, 400));
  }
  return false;
}

function isGatewayRunning() {
  return new Promise(resolve => {
    const req = http.request({ hostname: '127.0.0.1', port: gatewayPort, path: '/', method: 'GET', timeout: 1500 },
      () => resolve(true));
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });
}

function gatewayRequest(method, reqPath, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: '127.0.0.1', port: gatewayPort, path: reqPath, method,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json',
        ...(gatewayToken ? { 'Authorization': `Bearer ${gatewayToken}` } : {}) },
      timeout: 30000
    };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    const req = http.request(opts, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    if (data) req.write(data);
    req.end();
  });
}

// ─── TTS ──────────────────────────────────────────────────────────────────────
function speakText(text) {
  const safe = text.replace(/"/g, '').replace(/'/g, '').substring(0, 300);
  const ps = `Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.Rate = 1; $s.Speak("${safe}")`;
  spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps],
    { detached: true, stdio: 'ignore' }).unref();
}

// ─── Voice listener ───────────────────────────────────────────────────────────
const VOICE_SCRIPT = `
Add-Type -AssemblyName System.Speech
$rec = New-Object System.Speech.Recognition.SpeechRecognitionEngine
$rec.SetInputToDefaultAudioDevice()
$choices = New-Object System.Speech.Recognition.Choices
$choices.Add("acorda","descansa","yami","para")
$gb = New-Object System.Speech.Recognition.GrammarBuilder
$gb.Append($choices)
$g = New-Object System.Speech.Recognition.Grammar($gb)
$rec.LoadGrammar($g)
$rec.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)
while($true) {
  $result = $rec.Recognize([System.TimeSpan]::FromSeconds(5))
  if($result) { Write-Output $result.Text }
}
`;

function startVoiceListener() {
  if (voiceListenerProc) return;
  voiceListenerProc = spawn('powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', VOICE_SCRIPT],
    { stdio: 'pipe' });
  voiceListenerProc.stdout?.on('data', d => {
    const cmd = d.toString().trim().toLowerCase();
    if (cmd && mainWindow) mainWindow.webContents.send('voice-command', cmd);
  });
  voiceListenerProc.on('exit', () => { voiceListenerProc = null; });
}

function stopVoiceListener() {
  if (voiceListenerProc) { voiceListenerProc.kill(); voiceListenerProc = null; }
}

// ─── Window ───────────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, height: 800, minWidth: 800, minHeight: 600,
    show: false, backgroundColor: '#03070b',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
      // Allow loading from localhost
      webSecurity: true
    },
    title: 'YAMI'
  });

  // Try to load auto-panel; fallback to local HTML
  waitAndLoadPanel(12000).then(ready => {
    if (ready) {
      console.log('Loading auto-panel from http://localhost:', PANEL_PORT);
      mainWindow.loadURL(`http://localhost:${PANEL_PORT}`);
    } else {
      console.warn('Auto-panel not ready, falling back to local HTML');
      mainWindow.loadFile(path.join(__dirname, 'app', 'index.html'));
    }
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('close', e => { if (tray) { e.preventDefault(); mainWindow.hide(); } });
  mainWindow.on('closed', () => { mainWindow = null; });
  buildMenu();
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray.png');
  if (!fs.existsSync(iconPath)) return;
  tray = new Tray(nativeImage.createFromPath(iconPath));
  tray.setToolTip('YAMI');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Abrir YAMI', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'Sair', click: () => { tray = null; app.quit(); } }
  ]));
  tray.on('double-click', () => mainWindow?.show());
}

function buildMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'YAMI', submenu: [
      { label: 'Configurações', accelerator: 'CmdOrCtrl+,', click: () => mainWindow?.webContents.send('nav', 'settings') },
      { type: 'separator' },
      { label: 'Minimizar', click: () => mainWindow?.hide() },
      { label: 'Sair', accelerator: 'CmdOrCtrl+Q', click: () => { tray = null; app.quit(); } }
    ]},
    { label: 'Editar', submenu: [
      { role: 'undo', label: 'Desfazer' }, { role: 'redo', label: 'Refazer' },
      { type: 'separator' },
      { role: 'cut', label: 'Recortar' }, { role: 'copy', label: 'Copiar' }, { role: 'paste', label: 'Colar' }
    ]},
    { label: 'Exibir', submenu: [
      { role: 'reload', label: 'Recarregar' },
      { label: 'Dev Tools', accelerator: 'F12', click: () => mainWindow?.webContents.toggleDevTools() },
      { role: 'togglefullscreen', label: 'Tela Cheia' }
    ]}
  ]));
}

// ─── IPC ──────────────────────────────────────────────────────────────────────
// App config
ipcMain.handle('app:getConfig', () => readAppConfig());
ipcMain.handle('app:saveConfig', (_, cfg) => writeAppConfig(cfg));
ipcMain.handle('yami:getConfig', () => {
  try { return JSON.parse(fs.readFileSync(YAMI_CONFIG, 'utf8')); } catch { return null; }
});

// Gateway
ipcMain.handle('gateway:url', () => `http://127.0.0.1:${gatewayPort}`);
ipcMain.handle('gateway:wsUrl', () => `ws://127.0.0.1:${gatewayPort}`);
ipcMain.handle('gateway:token', () => gatewayToken);
ipcMain.handle('gateway:status', async () => ({ running: await isGatewayRunning(), port: gatewayPort }));
ipcMain.handle('gateway:request', async (_, { method, path: p, body }) => {
  try { return await gatewayRequest(method, p, body); }
  catch (e) { return { status: 0, error: e.message }; }
});

// Messages DB
ipcMain.handle('db:getMessages', (_, session = 'default', limit = 50) => {
  const all = dbRead('messages').filter(m => m.session_id === session);
  return all.slice(-limit);
});
ipcMain.handle('db:addMessage', (_, msg) => {
  const all = dbRead('messages');
  const item = { id: Date.now(), session_id: msg.session_id || 'default', role: msg.role,
    content: msg.content, timestamp: Date.now(), source: msg.source || 'chat', metadata: msg.metadata || {} };
  all.push(item);
  // Keep last 500 messages
  if (all.length > 500) all.splice(0, all.length - 500);
  dbWrite('messages', all);
  return item.id;
});
ipcMain.handle('db:clearMessages', (_, session = 'default') => {
  const all = dbRead('messages').filter(m => m.session_id !== session);
  return dbWrite('messages', all);
});

// Events DB
ipcMain.handle('db:getEvents', (_, range) => {
  let events = dbRead('events');
  if (range?.start && range?.end) {
    events = events.filter(e => e.start_time >= range.start && e.start_time <= range.end);
  }
  return events.sort((a, b) => a.start_time - b.start_time);
});
ipcMain.handle('db:addEvent', (_, event) => {
  const events = dbRead('events');
  const item = { ...event, id: Date.now(), created_at: Date.now(), updated_at: Date.now() };
  events.push(item);
  dbWrite('events', events);
  return item.id;
});
ipcMain.handle('db:updateEvent', (_, { id, ...data }) => {
  const events = dbRead('events');
  const idx = events.findIndex(e => e.id === id);
  if (idx === -1) return false;
  events[idx] = { ...events[idx], ...data, id, updated_at: Date.now() };
  return dbWrite('events', events);
});
ipcMain.handle('db:deleteEvent', (_, id) => {
  return dbWrite('events', dbRead('events').filter(e => e.id !== id));
});

// Settings DB
ipcMain.handle('db:getSetting', (_, key) => {
  const s = dbSettingsRead();
  return s[key] !== undefined ? s[key] : null;
});
ipcMain.handle('db:setSetting', (_, key, value) => {
  const s = dbSettingsRead();
  s[key] = value;
  return dbSettingsWrite(s);
});

// TTS / Voice
ipcMain.handle('tts:speak', (_, text) => { speakText(text); return true; });
ipcMain.handle('voice:start', () => { startVoiceListener(); return true; });
ipcMain.handle('voice:stop', () => { stopVoiceListener(); return true; });

// Notifications
ipcMain.handle('notify', (_, { title, body }) => {
  if (Notification.isSupported()) new Notification({ title, body }).show();
  return true;
});

// Shell
ipcMain.handle('shell:openExternal', (_, url) => { shell.openExternal(url); return true; });
ipcMain.handle('shell:openDashboard', () => { shell.openExternal(`http://127.0.0.1:${gatewayPort}`); return true; });

// System
ipcMain.handle('system:info', () => ({
  platform: process.platform, version: app.getVersion(),
  yamiHome: YAMI_HOME, gatewayPort, dbPath: DB_DIR
}));

// ─── Lifecycle ────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  ensureDirs();
  loadGatewayConfig();
  startGateway();
  startPanel();   // start auto-panel UI server
  createWindow();
  setTimeout(createTray, 2000);
});

app.on('window-all-closed', () => {
  if (gatewayProcess) gatewayProcess.kill();
  if (panelProcess) panelProcess.kill();
  stopVoiceListener();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (gatewayProcess) gatewayProcess.kill();
  if (panelProcess) panelProcess.kill();
  stopVoiceListener();
});

app.on('activate', () => { if (!mainWindow) createWindow(); else mainWindow.show(); });
