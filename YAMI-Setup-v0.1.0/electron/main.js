const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;
let gateway;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png')
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Start YAMI Gateway
function startGateway() {
  const { spawn } = require('child_process');
  const yamiHome = path.join(process.env.USERPROFILE, 'AppData', 'Local', 'YAMI');
  const runtimePath = path.join(process.env.USERPROFILE, '.yami', 'runtime', 'core');

  gateway = spawn('node', [
    path.join(runtimePath, 'yami.mjs'),
    'gateway'
  ], {
    env: {
      ...process.env,
      YAMI_HOME: yamiHome,
      OPENCLAW_HOME: yamiHome
    },
    stdio: 'ignore'
  });

  gateway.on('error', (error) => {
    console.error('Gateway error:', error);
  });
}

app.on('ready', () => {
  startGateway();
  createWindow();
  createMenu();
});

app.on('window-all-closed', () => {
  if (gateway) {
    gateway.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

function createMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: 'YAMI',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { label: 'Configurações', accelerator: 'Ctrl+,', click: () => mainWindow.webContents.send('open-settings') },
        { type: 'separator' },
        { label: 'Sair', accelerator: 'Ctrl+Q', role: 'quit' }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'Exibir',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' }
      ]
    }
  ]);

  Menu.setApplicationMenu(menu);
}

// IPC handlers
ipcMain.handle('get-config', async (event) => {
  const configPath = path.join(process.env.USERPROFILE, 'AppData', 'Local', 'YAMI', 'yami.json');
  try {
    const fs = require('fs').promises;
    const config = await fs.readFile(configPath, 'utf8');
    return JSON.parse(config);
  } catch (error) {
    return null;
  }
});

ipcMain.handle('save-config', async (event, config) => {
  const configPath = path.join(process.env.USERPROFILE, 'AppData', 'Local', 'YAMI', 'yami.json');
  try {
    const fs = require('fs').promises;
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    return false;
  }
});

ipcMain.handle('get-gateway-url', async () => {
  return 'ws://127.0.0.1:18789';
});
