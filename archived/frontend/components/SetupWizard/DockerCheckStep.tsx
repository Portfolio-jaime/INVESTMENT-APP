import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, ExternalLink, Loader2 } from 'lucide-react';
import { SetupConfig } from './SetupWizard';

interface DockerCheckStepProps {
  config: SetupConfig;
  onConfigUpdate: (updates: Partial<SetupConfig>) => void;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

interface SystemCheck {
  name: string;
  status: 'checking' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

const DockerCheckStep: React.FC<DockerCheckStepProps> = ({ onNext, onPrevious }) => {
  const [checks, setChecks] = useState<SystemCheck[]>([
    { name: 'Docker Desktop', status: 'checking', message: 'Checking installation...' },
    { name: 'Docker Running', status: 'checking', message: 'Checking status...' },
    { name: 'System Resources', status: 'checking', message: 'Validating requirements...' },
  ]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [canProceed, setCanProceed] = useState(false);

  useEffect(() => {
    runSystemChecks();
  }, []);

  const runSystemChecks = async () => {
    setIsRetrying(true);

    // Check Docker installation
    try {
      const dockerInstalled = await window.electronAPI.checkDockerInstalled();

      if (dockerInstalled.available) {
        setChecks((prev) => [
          {
            ...prev[0],
            status: 'success',
            message: 'Docker Desktop is installed',
            details: dockerInstalled.version || 'Version detected',
          },
          ...prev.slice(1),
        ]);

        // Check Docker running status
        setTimeout(async () => {
          const dockerRunning = await window.electronAPI.checkDockerRunning();

          if (dockerRunning.running) {
            setChecks((prev) => [
              prev[0],
              {
                ...prev[1],
                status: 'success',
                message: 'Docker daemon is running',
                details: 'Ready to start services',
              },
              ...prev.slice(2),
            ]);

            // Check system resources
            setTimeout(async () => {
              const resources = await window.electronAPI.checkSystemResources();

              if (resources.sufficient) {
                setChecks((prev) => [
                  ...prev.slice(0, 2),
                  {
                    ...prev[2],
                    status: 'success',
                    message: 'System resources sufficient',
                    details: `${resources.memory} memory, ${resources.disk} disk available`,
                  },
                ]);
                setCanProceed(true);
              } else {
                setChecks((prev) => [
                  ...prev.slice(0, 2),
                  {
                    ...prev[2],
                    status: 'warning',
                    message: 'Limited system resources',
                    details: resources.message || 'Application may run slower',
                  },
                ]);
                setCanProceed(true);
              }
              setIsRetrying(false);
            }, 500);
          } else {
            setChecks((prev) => [
              prev[0],
              {
                ...prev[1],
                status: 'error',
                message: 'Docker is not running',
                details: 'Please start Docker Desktop and try again',
              },
              {
                ...prev[2],
                status: 'checking',
                message: 'Waiting for Docker...',
              },
            ]);
            setCanProceed(false);
            setIsRetrying(false);
          }
        }, 500);
      } else {
        setChecks((prev) => [
          {
            ...prev[0],
            status: 'error',
            message: 'Docker Desktop not found',
            details: dockerInstalled.error || 'Please install Docker Desktop',
          },
          {
            ...prev[1],
            status: 'checking',
            message: 'Waiting for Docker installation...',
          },
          {
            ...prev[2],
            status: 'checking',
            message: 'Waiting for Docker...',
          },
        ]);
        setCanProceed(false);
        setIsRetrying(false);
      }
    } catch (error) {
      console.error('System check error:', error);
      setChecks([
        {
          name: 'Docker Desktop',
          status: 'error',
          message: 'Check failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        ...checks.slice(1),
      ]);
      setIsRetrying(false);
    }
  };

  const handleRetry = () => {
    setChecks([
      { name: 'Docker Desktop', status: 'checking', message: 'Checking installation...' },
      { name: 'Docker Running', status: 'checking', message: 'Checking status...' },
      { name: 'System Resources', status: 'checking', message: 'Validating requirements...' },
    ]);
    setCanProceed(false);
    runSystemChecks();
  };

  const getStatusIcon = (status: SystemCheck['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />;
      case 'checking':
        return <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />;
    }
  };

  const allChecksComplete = checks.every((check) => check.status !== 'checking');
  const hasErrors = checks.some((check) => check.status === 'error');

  return (
    <div className="p-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
          System Requirements Check
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          Verifying your system is ready to run TRII
        </p>
      </div>

      {/* Checks List */}
      <div className="space-y-4 mb-10">
        {checks.map((check, index) => (
          <div
            key={index}
            className={`p-6 rounded-xl border-2 transition-all duration-300 ${
              check.status === 'success'
                ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                : check.status === 'error'
                ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                : check.status === 'warning'
                ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">{getStatusIcon(check.status)}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  {check.name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">
                  {check.message}
                </p>
                {check.details && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    {check.details}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Installation Instructions */}
      {hasErrors && allChecksComplete && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Docker Desktop Required
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
            TRII requires Docker Desktop to run backend services. Please follow these steps:
          </p>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2 mb-4 list-decimal list-inside">
            <li>Download Docker Desktop from the official website</li>
            <li>Install and start Docker Desktop</li>
            <li>Wait for Docker to fully initialize (check the menu bar icon)</li>
            <li>Click the "Retry Check" button below</li>
          </ol>
          <a
            href="https://www.docker.com/products/docker-desktop"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <span>Download Docker Desktop</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* System Resources Warning */}
      {checks[2]?.status === 'warning' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                Limited Resources Detected
              </h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Your system has limited resources available. TRII will run, but you may experience
                slower performance. For optimal experience, we recommend at least 8GB RAM and 10GB
                free disk space.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {canProceed && !hasErrors && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                System Ready!
              </h4>
              <p className="text-sm text-green-800 dark:text-green-200">
                All requirements are met. You can proceed to configure the application.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-3 text-slate-600 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          Previous
        </button>
        <div className="flex space-x-3">
          {allChecksComplete && hasErrors && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>Retry Check</span>
            </button>
          )}
          <button
            onClick={onNext}
            disabled={!canProceed}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default DockerCheckStep;
