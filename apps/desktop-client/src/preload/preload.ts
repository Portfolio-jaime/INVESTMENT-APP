/**
 * Preload script for Electron security context
 * Exposes IPC APIs to the renderer process via contextBridge
 */

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Docker checks
  checkDockerInstalled: () => ipcRenderer.invoke('check-docker-installed'),
  checkDockerRunning: () => ipcRenderer.invoke('check-docker-running'),
  checkSystemResources: () => ipcRenderer.invoke('check-system-resources'),

  // Configuration
  saveConfiguration: (config: any) => ipcRenderer.invoke('save-configuration', config),
  loadConfiguration: () => ipcRenderer.invoke('load-configuration'),

  // Backend management
  startBackendServices: () => ipcRenderer.invoke('start-backend-services'),
  stopBackendServices: () => ipcRenderer.invoke('stop-backend-services'),
  getBackendStatus: () => ipcRenderer.invoke('get-backend-status'),
});

console.log('Preload script loaded - electronAPI exposed');
