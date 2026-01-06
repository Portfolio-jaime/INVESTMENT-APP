/**
 * Service Status Component
 *
 * Displays real-time health status of backend microservices
 * with visual indicators and error messages.
 */

import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Server, CheckCircle, XCircle, Clock } from 'lucide-react';

export const ServiceStatus: React.FC = () => {
  const { services, backendHealthy, checkBackendHealth } = useAppStore();

  useEffect(() => {
    // Initial health check
    checkBackendHealth();

    // Set up periodic health checks (every 10 seconds)
    const interval = setInterval(checkBackendHealth, 10000);

    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  const serviceArray = Object.values(services);
  const healthyCount = serviceArray.filter((s) => s.healthy).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Server size={18} className="text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Backend Services
          </h3>
        </div>
        <div
          className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
            backendHealthy
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {backendHealthy ? (
            <>
              <CheckCircle size={14} />
              <span>All Systems Operational</span>
            </>
          ) : (
            <>
              <XCircle size={14} />
              <span>
                {healthyCount}/{serviceArray.length} Healthy
              </span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {serviceArray.map((service) => (
          <div
            key={service.name}
            className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-2 h-2 rounded-full ${
                  service.healthy
                    ? 'bg-green-500 animate-pulse'
                    : 'bg-red-500'
                }`}
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {service.name}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {service.error && (
                <span className="text-xs text-red-600 dark:text-red-400 max-w-xs truncate">
                  {service.error}
                </span>
              )}
              {service.lastCheck && (
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <Clock size={12} className="mr-1" />
                  <span>{new Date(service.lastCheck).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {!backendHealthy && (
        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-400">
            Some services are not responding. Make sure Docker Desktop is running and all services are started.
          </p>
          <button
            onClick={checkBackendHealth}
            className="mt-2 text-sm text-yellow-800 dark:text-yellow-400 font-medium hover:underline"
          >
            Check Again
          </button>
        </div>
      )}
    </div>
  );
};

export default ServiceStatus;
