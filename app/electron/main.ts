import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import BackendManager from './managers/BackendManager';

let mainWindow: BrowserWindow | null = null;
let backendManager: BackendManager;

// Initialize backend manager
function initBackendManager() {
  backendManager = new BackendManager();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js'),
    },
    title: 'TRII Investment Platform',
    backgroundColor: '#1f2937'
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers for Setup Wizard

// Check if Docker is installed
ipcMain.handle('check-docker-installed', async () => {
  try {
    return await backendManager.checkDockerAvailability();
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Check if Docker daemon is running
ipcMain.handle('check-docker-running', async () => {
  try {
    const result = await backendManager.checkDockerAvailability();
    return {
      running: result.available && !result.error?.includes('not running'),
      error: result.error,
    };
  } catch (error) {
    return {
      running: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Check system resources
ipcMain.handle('check-system-resources', async () => {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memGB = (totalMem / 1024 / 1024 / 1024).toFixed(1);
    const freeMemGB = (freeMem / 1024 / 1024 / 1024).toFixed(1);

    // Check available disk space (simplified - just check home directory)
    const homedir = os.homedir();
    let diskSpace = 'Unknown';
    let sufficient = true;

    // Memory check: recommend at least 8GB total, 4GB free
    if (totalMem < 8 * 1024 * 1024 * 1024) {
      sufficient = false;
    }

    return {
      sufficient,
      memory: `${memGB}GB total, ${freeMemGB}GB free`,
      disk: diskSpace,
      message: sufficient
        ? 'Sufficient resources available'
        : 'Limited memory detected. Application may run slower.',
    };
  } catch (error) {
    return {
      sufficient: true,
      message: 'Could not check resources, proceeding anyway',
    };
  }
});

// Save configuration
ipcMain.handle('save-configuration', async (event, config) => {
  try {
    const configDir = path.join(app.getPath('userData'), 'config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    const configPath = path.join(configDir, 'settings.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save configuration',
    };
  }
});

// Load configuration
ipcMain.handle('load-configuration', async () => {
  try {
    const configPath = path.join(app.getPath('userData'), 'config', 'settings.json');
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Failed to load configuration:', error);
    return null;
  }
});

// Start backend services
ipcMain.handle('start-backend-services', async () => {
  try {
    return await backendManager.startBackendServices();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start services',
    };
  }
});

// Stop backend services
ipcMain.handle('stop-backend-services', async () => {
  try {
    return await backendManager.stopBackendServices();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to stop services',
    };
  }
});

// Get backend status
ipcMain.handle('get-backend-status', async () => {
  try {
    return await backendManager.getBackendStatus();
  } catch (error) {
    return {
      dockerAvailable: false,
      dockerComposeAvailable: false,
      servicesRunning: false,
      services: {},
      error: error instanceof Error ? error.message : 'Failed to get status',
    };
  }
});

app.on('ready', () => {
  initBackendManager();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Cleanup on quit
app.on('before-quit', async () => {
  // Optionally stop backend services on quit
  // await backendManager.stopBackendServices();
});
