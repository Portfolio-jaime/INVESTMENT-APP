export interface ElectronAPI {
  // Docker checks
  checkDockerInstalled: () => Promise<{
    available: boolean;
    version?: string;
    error?: string;
  }>;
  checkDockerRunning: () => Promise<{
    running: boolean;
    error?: string;
  }>;
  checkSystemResources: () => Promise<{
    sufficient: boolean;
    memory?: string;
    disk?: string;
    message?: string;
  }>;

  // Configuration
  saveConfiguration: (config: any) => Promise<{ success: boolean; error?: string }>;
  loadConfiguration: () => Promise<any>;

  // Backend management
  startBackendServices: () => Promise<{ success: boolean; error?: string }>;
  stopBackendServices: () => Promise<{ success: boolean; error?: string }>;
  getBackendStatus: () => Promise<{
    dockerAvailable: boolean;
    dockerComposeAvailable: boolean;
    servicesRunning: boolean;
    services: Record<string, any>;
    error?: string;
  }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
