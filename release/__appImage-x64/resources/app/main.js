const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const net = require('net');
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow = null;
let serverChild = null;
let serverPort = 0;

function pickFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}

function waitForServer(port, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get({ host: '127.0.0.1', port, path: '/', timeout: 1000 }, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error('Backend did not start within ' + timeoutMs + 'ms'));
        } else {
          setTimeout(tick, 250);
        }
      });
      req.on('timeout', () => req.destroy());
    };
    tick();
  });
}

function resolveServerEntry() {
  // electron-builder unpacks ../dist next to app.asar (asarUnpack).
  const candidates = [
    path.join(__dirname, '..', 'dist', 'index.js'),
    path.join(process.resourcesPath || '', 'app.asar.unpacked', 'dist', 'index.js'),
    path.join(process.resourcesPath || '', 'app', 'dist', 'index.js'),
  ];
  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p; } catch {}
  }
  return candidates[0];
}

async function startBackend() {
  serverPort = await pickFreePort();
  const entry = resolveServerEntry();

  if (!fs.existsSync(entry)) {
    throw new Error(
      'Server bundle not found at ' + entry +
      '. Run "npm run build" before starting Electron.'
    );
  }

  serverChild = spawn(process.execPath, [entry], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(serverPort),
      ELECTRON_RUN_AS_NODE: '1',
    },
    stdio: 'inherit',
    windowsHide: true,
  });

  serverChild.on('exit', (code) => {
    if (code !== 0 && mainWindow) {
      dialog.showErrorBox(
        'Qora EPOS — backend stopped',
        'The till backend stopped unexpectedly (exit code ' + code + '). The app will close.'
      );
      app.quit();
    }
  });

  await waitForServer(serverPort);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });

  const url = isDev ? 'http://localhost:5000' : 'http://127.0.0.1:' + serverPort;
  mainWindow.loadURL(url);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  buildMenu();
}

function buildMenu() {
  const template = [
    {
      label: 'Qora EPOS',
      submenu: [
        {
          label: 'About Qora EPOS',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Qora EPOS',
              message: 'Qora EPOS',
              detail: 'Point of Sale for Kerrigans XL Manorhamilton.\nVersion ' + app.getVersion() + '.',
            });
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'close' }],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(async () => {
  try {
    if (!isDev) {
      await startBackend();
    }
    createWindow();
  } catch (err) {
    dialog.showErrorBox('Qora EPOS — failed to start', String(err && err.message ? err.message : err));
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('before-quit', () => {
  if (serverChild && !serverChild.killed) {
    try { serverChild.kill(); } catch {}
  }
});

ipcMain.handle('get-app-info', () => ({
  name: app.getName(),
  version: app.getVersion(),
  platform: process.platform,
}));
