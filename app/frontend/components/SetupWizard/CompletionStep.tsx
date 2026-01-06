import React, { useState, useEffect } from 'react';
import { CheckCircle, Rocket, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { SetupConfig } from './SetupWizard';

interface CompletionStepProps {
  config: SetupConfig;
  onConfigUpdate: (updates: Partial<SetupConfig>) => void;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

interface ServiceStatus {
  name: string;
  status: 'starting' | 'running' | 'error';
  message: string;
}

const CompletionStep: React.FC<CompletionStepProps> = ({ onComplete, onPrevious }) => {
  const [servicesStarting, setServicesStarting] = useState(false);
  const [servicesStarted, setServicesStarted] = useState(false);
  const [startupError, setStartupError] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'PostgreSQL Database', status: 'starting', message: 'Initializing...' },
    { name: 'Redis Cache', status: 'starting', message: 'Waiting...' },
    { name: 'Market Data Service', status: 'starting', message: 'Waiting...' },
    { name: 'Analysis Engine', status: 'starting', message: 'Waiting...' },
    { name: 'Portfolio Manager', status: 'starting', message: 'Waiting...' },
    { name: 'ML Prediction Service', status: 'starting', message: 'Waiting...' },
  ]);

  useEffect(() => {
    // Auto-start services on mount
    handleStartServices();
  }, []);

  const handleStartServices = async () => {
    setServicesStarting(true);
    setStartupError(null);

    try {
      // Start backend services
      const result = await window.electronAPI.startBackendServices();

      if (result.success) {
        // Simulate service startup progress
        const serviceOrder = [0, 1, 2, 3, 4, 5];

        for (let i = 0; i < serviceOrder.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 1000));

          setServices((prev) => {
            const updated = [...prev];
            updated[serviceOrder[i]] = {
              ...updated[serviceOrder[i]],
              status: 'running',
              message: 'Running',
            };
            return updated;
          });
        }

        setServicesStarted(true);
        setServicesStarting(false);

        // Mark setup as complete
        localStorage.setItem('trii_setup_completed', 'true');
      } else {
        setStartupError(result.error || 'Failed to start services');
        setServicesStarting(false);

        // Mark all services as error
        setServices((prev) =>
          prev.map((service) => ({
            ...service,
            status: 'error',
            message: 'Failed to start',
          }))
        );
      }
    } catch (error) {
      console.error('Failed to start services:', error);
      setStartupError(error instanceof Error ? error.message : 'Unknown error occurred');
      setServicesStarting(false);
    }
  };

  const handleLaunch = () => {
    // Trigger completion callback to show main app
    onComplete();
  };

  const handleRetry = () => {
    // Reset services and try again
    setServices([
      { name: 'PostgreSQL Database', status: 'starting', message: 'Initializing...' },
      { name: 'Redis Cache', status: 'starting', message: 'Waiting...' },
      { name: 'Market Data Service', status: 'starting', message: 'Waiting...' },
      { name: 'Analysis Engine', status: 'starting', message: 'Waiting...' },
      { name: 'Portfolio Manager', status: 'starting', message: 'Waiting...' },
      { name: 'ML Prediction Service', status: 'starting', message: 'Waiting...' },
    ]);
    handleStartServices();
  };

  return (
    <div className="p-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div
          className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 transition-all duration-500 ${
            servicesStarted
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 scale-110'
              : startupError
              ? 'bg-gradient-to-r from-red-500 to-orange-500'
              : 'bg-gradient-to-r from-blue-600 to-purple-600'
          }`}
        >
          {servicesStarted ? (
            <CheckCircle className="w-10 h-10 text-white" />
          ) : startupError ? (
            <AlertCircle className="w-10 h-10 text-white" />
          ) : (
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          )}
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
          {servicesStarted
            ? 'Setup Complete!'
            : startupError
            ? 'Startup Error'
            : 'Starting Backend Services...'}
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          {servicesStarted
            ? 'Your investment platform is ready to use'
            : startupError
            ? 'There was an issue starting the backend services'
            : 'Please wait while we initialize the platform infrastructure'}
        </p>
      </div>

      {/* Services Status */}
      <div className="space-y-3 mb-10">
        {services.map((service, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 ${
              service.status === 'running'
                ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                : service.status === 'error'
                ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div>
                {service.status === 'running' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : service.status === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                ) : (
                  <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                )}
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{service.name}</p>
              </div>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">{service.message}</div>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {startupError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">Startup Failed</h4>
              <p className="text-sm text-red-800 dark:text-red-200 mb-3">{startupError}</p>
              <p className="text-sm text-red-700 dark:text-red-300">
                Please ensure Docker Desktop is running and try again. If the problem persists,
                check the Docker logs for more details.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {servicesStarted && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
              All Systems Ready!
            </h3>
            <p className="text-sm text-green-800 dark:text-green-200 mb-4">
              Your TRII platform is now running and ready to help you make intelligent investment
              decisions.
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-green-700 dark:text-green-300">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Backend Services Running</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Database Connected</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>APIs Configured</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Information Box */}
      {!startupError && !servicesStarted && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5 mb-8">
          <div className="flex items-start space-x-3">
            <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 animate-spin" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">First-time Setup</p>
              <p>
                This may take 2-3 minutes as Docker downloads and initializes containers. Subsequent
                starts will be much faster.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          disabled={servicesStarting || servicesStarted}
          className="px-6 py-3 text-slate-600 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <div className="flex space-x-3">
          {startupError && (
            <button
              onClick={handleRetry}
              disabled={servicesStarting}
              className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${servicesStarting ? 'animate-spin' : ''}`} />
              <span>Retry</span>
            </button>
          )}
          <button
            onClick={handleLaunch}
            disabled={!servicesStarted}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
          >
            <Rocket className="w-5 h-5" />
            <span>Launch Application</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompletionStep;
