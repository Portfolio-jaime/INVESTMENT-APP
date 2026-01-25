import React, { useState } from 'react';
import WelcomeStep from './WelcomeStep';
import DockerCheckStep from './DockerCheckStep';
import ConfigurationStep from './ConfigurationStep';
import CompletionStep from './CompletionStep';

export interface SetupConfig {
  apiKeys: {
    alphaVantage: string;
    finnhub: string;
    twelveData: string;
  };
  preferences: {
    dataStorage: string;
    autoUpdate: boolean;
  };
}

interface SetupWizardProps {
  onComplete: () => void;
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<SetupConfig>({
    apiKeys: {
      alphaVantage: '',
      finnhub: '',
      twelveData: '',
    },
    preferences: {
      dataStorage: 'local',
      autoUpdate: true,
    },
  });

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome',
      component: WelcomeStep,
    },
    {
      id: 'docker-check',
      title: 'System Check',
      component: DockerCheckStep,
    },
    {
      id: 'configuration',
      title: 'Configuration',
      component: ConfigurationStep,
    },
    {
      id: 'completion',
      title: 'Complete',
      component: CompletionStep,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConfigUpdate = (updates: Partial<SetupConfig>) => {
    setConfig((prev) => ({
      ...prev,
      ...updates,
      apiKeys: { ...prev.apiKeys, ...(updates.apiKeys || {}) },
      preferences: { ...prev.preferences, ...(updates.preferences || {}) },
    }));
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                      index < currentStep
                        ? 'bg-green-500 text-white'
                        : index === currentStep
                        ? 'bg-blue-600 text-white ring-4 ring-blue-200 dark:ring-blue-900'
                        : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {index < currentStep ? '✓' : index + 1}
                  </div>
                  <div
                    className={`mt-2 text-xs font-medium ${
                      index === currentStep
                        ? 'text-blue-600 dark:text-blue-400'
                        : index < currentStep
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 rounded transition-all duration-300 ${
                      index < currentStep
                        ? 'bg-green-500'
                        : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <CurrentStepComponent
            config={config}
            onConfigUpdate={handleConfigUpdate}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onComplete={onComplete}
            isFirstStep={currentStep === 0}
            isLastStep={currentStep === steps.length - 1}
          />
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            TRII Investment Decision Support Platform v1.0.0
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Your privacy-first investment intelligence platform
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
