const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let win, streamer;

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: 'Game Stream Host'
  });
  win.loadFile('index.html');
  
  // Open DevTools in development
  // win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('start-stream', async () => {
  try {
    const binPath = path.join(__dirname, '../host_streamer/target/release/host_streamer.exe');
    
    // Check if the binary exists
    const fs = require('fs');
    if (!fs.existsSync(binPath)) {
      win.webContents.send('log', '❌ Error: Streamer binary not found. Please build it first:\n');
      win.webContents.send('log', '   cd host_streamer && cargo build --release\n');
      return { success: false, error: 'Binary not found' };
    }
    
    win.webContents.send('log', '🚀 Starting game streamer...\n');
    streamer = spawn(binPath, [], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    streamer.stdout.on('data', data => {
      const output = data.toString();
      win.webContents.send('log', output);
      
      // Check if this is an OFFER
      if (output.includes('OFFER:')) {
        win.webContents.send('offer', output);
      }
    });
    
    streamer.stderr.on('data', data => {
      win.webContents.send('log', `⚠️  ${data.toString()}`);
    });
    
    streamer.on('error', (error) => {
      win.webContents.send('log', `❌ Streamer error: ${error.message}\n`);
    });
    
    streamer.on('close', (code) => {
      win.webContents.send('log', `🔚 Streamer process exited with code ${code}\n`);
    });
    
    return { success: true };
  } catch (error) {
    win.webContents.send('log', `❌ Failed to start streamer: ${error.message}\n`);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-stream', () => {
  if (streamer) {
    win.webContents.send('log', '🛑 Stopping streamer...\n');
    streamer.kill();
    streamer = null;
  }
});

ipcMain.handle('send-answer', (event, answer) => {
  if (streamer && streamer.stdin) {
    streamer.stdin.write(answer + '\n');
    win.webContents.send('log', '📤 Answer sent to streamer\n');
  }
});