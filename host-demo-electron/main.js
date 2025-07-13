const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let win, streamer;
function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.handle('start-stream', () => {
  const binPath = path.join(__dirname, '../host_streamer/target/release/host_streamer');
  streamer = spawn(binPath);
  streamer.stdout.on('data', data => win.webContents.send('log', data.toString()));
  streamer.stderr.on('data', data => win.webContents.send('log', data.toString()));
});

ipcMain.handle('stop-stream', () => {
  if (streamer) streamer.kill();
});