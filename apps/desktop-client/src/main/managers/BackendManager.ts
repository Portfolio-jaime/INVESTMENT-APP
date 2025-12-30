/**
 * Backend Manager
 *
 * Manages the lifecycle of backend Docker services:
 * - Starting and stopping services
 * - Health monitoring
 * - Service logs access
 * - Docker availability checking
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

export interface ServiceHealth {
  name: string;
  running: boolean;
  healthy: boolean;
  error?: string;
}

export interface BackendStatus {
  dockerAvailable: boolean;
  dockerComposeAvailable: boolean;
  servicesRunning: boolean;
  services: Record<string, ServiceHealth>;
  error?: string;
}

export class BackendManager {
  private composeFilePath: string;
  private isStarting = false;
  private isStopping = false;

  constructor(composeFilePath?: string) {
    // Default to bundled docker-compose.yml in production
    // or use the one from infrastructure in development
    this.composeFilePath = composeFilePath || this.getDefaultComposePath();
  }

  private getDefaultComposePath(): string {
    if (process.env.NODE_ENV === 'development') {
      // Development: use infrastructure/docker/docker-compose.yml
      return path.join(process.cwd(), '../../infrastructure/docker/docker-compose.yml');
    } else {
      // Production: use bundled compose file
      return path.join(process.resourcesPath, 'docker', 'docker-compose.yml');
    }
  }

  /**
   * Check if Docker is installed and running
   */
  async checkDockerAvailability(): Promise<{ available: boolean; version?: string; error?: string }> {
    try {
      const { stdout } = await execAsync('docker --version');
      const version = stdout.trim();

      // Check if Docker daemon is running
      try {
        await execAsync('docker ps');
        return { available: true, version };
      } catch {
        return {
          available: false,
          version,
          error: 'Docker is installed but not running. Please start Docker Desktop.',
        };
      }
    } catch (error) {
      return {
        available: false,
        error: 'Docker is not installed. Please install Docker Desktop from docker.com',
      };
    }
  }

  /**
   * Check if Docker Compose is available
   */
  async checkDockerComposeAvailability(): Promise<{ available: boolean; version?: string }> {
    try {
      const { stdout } = await execAsync('docker-compose --version');
      return { available: true, version: stdout.trim() };
    } catch {
      // Try docker compose plugin
      try {
        const { stdout } = await execAsync('docker compose version');
        return { available: true, version: stdout.trim() };
      } catch {
        return { available: false };
      }
    }
  }

  /**
   * Get full backend status
   */
  async getBackendStatus(): Promise<BackendStatus> {
    const dockerCheck = await this.checkDockerAvailability();
    const composeCheck = await this.checkDockerComposeAvailability();

    if (!dockerCheck.available) {
      return {
        dockerAvailable: false,
        dockerComposeAvailable: false,
        servicesRunning: false,
        services: {},
        error: dockerCheck.error,
      };
    }

    if (!composeCheck.available) {
      return {
        dockerAvailable: true,
        dockerComposeAvailable: false,
        servicesRunning: false,
        services: {},
        error: 'Docker Compose not found',
      };
    }

    // Check services health
    const services = await this.checkServicesHealth();
    const servicesRunning = Object.values(services).some((s) => s.running);

    return {
      dockerAvailable: true,
      dockerComposeAvailable: true,
      servicesRunning,
      services,
    };
  }

  /**
   * Start all backend services
   */
  async startBackendServices(): Promise<{ success: boolean; error?: string }> {
    if (this.isStarting) {
      return { success: false, error: 'Services are already starting' };
    }

    try {
      this.isStarting = true;

      // Check prerequisites
      const dockerCheck = await this.checkDockerAvailability();
      if (!dockerCheck.available) {
        return { success: false, error: dockerCheck.error };
      }

      // Check if compose file exists
      if (!fs.existsSync(this.composeFilePath)) {
        return {
          success: false,
          error: `Docker Compose file not found: ${this.composeFilePath}`,
        };
      }

      // Start services
      const composeDir = path.dirname(this.composeFilePath);
      const command = `docker-compose -f "${this.composeFilePath}" up -d`;

      const { stdout, stderr } = await execAsync(command, {
        cwd: composeDir,
        env: {
          ...process.env,
          COMPOSE_PROJECT_NAME: 'trii',
        },
      });

      console.log('[BackendManager] Services started:', stdout);
      if (stderr && !stderr.includes('Creating') && !stderr.includes('Starting')) {
        console.error('[BackendManager] stderr:', stderr);
      }

      // Wait for services to be healthy
      await this.waitForServicesHealth(60000); // 60 seconds timeout

      return { success: true };
    } catch (error) {
      console.error('[BackendManager] Failed to start services:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      this.isStarting = false;
    }
  }

  /**
   * Stop all backend services
   */
  async stopBackendServices(): Promise<{ success: boolean; error?: string }> {
    if (this.isStopping) {
      return { success: false, error: 'Services are already stopping' };
    }

    try {
      this.isStopping = true;

      const composeDir = path.dirname(this.composeFilePath);
      const command = `docker-compose -f "${this.composeFilePath}" down`;

      const { stdout, stderr } = await execAsync(command, {
        cwd: composeDir,
        env: {
          ...process.env,
          COMPOSE_PROJECT_NAME: 'trii',
        },
      });

      console.log('[BackendManager] Services stopped:', stdout);
      if (stderr) {
        console.error('[BackendManager] stderr:', stderr);
      }

      return { success: true };
    } catch (error) {
      console.error('[BackendManager] Failed to stop services:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      this.isStopping = false;
    }
  }

  /**
   * Check health of individual services
   */
  async checkServicesHealth(): Promise<Record<string, ServiceHealth>> {
    const services = {
      'trii-postgres-1': { name: 'PostgreSQL', port: 5433 },
      'trii-redis-1': { name: 'Redis', port: 6379 },
      'trii-market-data-1': { name: 'Market Data', port: 8001 },
      'trii-analysis-engine-1': { name: 'Analysis Engine', port: 8002 },
      'trii-portfolio-manager-1': { name: 'Portfolio Manager', port: 8003 },
      'trii-ml-prediction-1': { name: 'ML Prediction', port: 8004 },
      'trii-api-gateway-1': { name: 'API Gateway', port: 8080 },
    };

    const health: Record<string, ServiceHealth> = {};

    for (const [containerName, config] of Object.entries(services)) {
      try {
        const { stdout } = await execAsync(
          `docker inspect --format='{{.State.Running}}' ${containerName}`
        );
        const running = stdout.trim() === 'true';

        let healthy = running;

        // For services with health endpoints, check HTTP
        if (running && config.port && config.port >= 8000) {
          try {
            const response = await fetch(`http://localhost:${config.port}/health`, {
              signal: AbortSignal.timeout(2000),
            });
            healthy = response.ok;
          } catch {
            healthy = false;
          }
        }

        health[config.name] = { name: config.name, running, healthy };
      } catch (error) {
        health[config.name] = {
          name: config.name,
          running: false,
          healthy: false,
          error: error instanceof Error ? error.message : 'Container not found',
        };
      }
    }

    return health;
  }

  /**
   * Wait for services to become healthy
   */
  private async waitForServicesHealth(timeoutMs = 60000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const health = await this.checkServicesHealth();
      const allHealthy = Object.values(health).every((s) => s.healthy);

      if (allHealthy) {
        console.log('[BackendManager] All services are healthy');
        return;
      }

      console.log('[BackendManager] Waiting for services to become healthy...');
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    console.warn('[BackendManager] Timeout waiting for services. Some services may not be healthy.');
  }

  /**
   * Get logs from a specific service
   */
  async getServiceLogs(serviceName: string, tail = 100): Promise<string> {
    try {
      const { stdout } = await execAsync(`docker logs --tail ${tail} trii-${serviceName}-1`);
      return stdout;
    } catch (error) {
      console.error(`[BackendManager] Failed to get logs for ${serviceName}:`, error);
      return '';
    }
  }

  /**
   * Restart a specific service
   */
  async restartService(serviceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      await execAsync(`docker restart trii-${serviceName}-1`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export default BackendManager;
