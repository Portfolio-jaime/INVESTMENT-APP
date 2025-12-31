import React from 'react';
import { TrendingUp, Shield, Zap, Database, LineChart, Brain } from 'lucide-react';
import { SetupConfig } from './SetupWizard';

interface WelcomeStepProps {
  config: SetupConfig;
  onConfigUpdate: (updates: Partial<SetupConfig>) => void;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  const features = [
    {
      icon: LineChart,
      title: 'Real-Time Market Data',
      description: 'Live stock quotes, cryptocurrency prices, and market indicators',
      color: 'blue',
    },
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Machine learning predictions and intelligent investment insights',
      color: 'purple',
    },
    {
      icon: Database,
      title: 'Portfolio Management',
      description: 'Track your investments, analyze performance, and optimize returns',
      color: 'green',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized desktop application with instant data updates',
      color: 'yellow',
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Your data stays on your machine. No cloud dependencies required.',
      color: 'red',
    },
  ];

  return (
    <div className="p-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6 shadow-lg">
          <TrendingUp className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
          Welcome to TRII
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Your intelligent investment decision support platform
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="flex items-start space-x-4 p-5 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:shadow-md transition-all duration-200"
            >
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-lg bg-${feature.color}-100 dark:bg-${feature.color}-900/30 flex items-center justify-center`}
              >
                <Icon className={`w-6 h-6 text-${feature.color}-600 dark:text-${feature.color}-400`} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Privacy Message */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
        <div className="flex items-start space-x-3">
          <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Privacy-First Architecture
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
              TRII runs entirely on your local machine using Docker containers. Your financial data,
              portfolio information, and investment strategies never leave your computer. All API keys
              and configurations are stored securely on your device.
            </p>
          </div>
        </div>
      </div>

      {/* What's Next */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 mb-8">
        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
          What happens next?
        </h4>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <li className="flex items-center">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></span>
            We'll check if Docker Desktop is installed and running
          </li>
          <li className="flex items-center">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></span>
            Optionally configure API keys for enhanced market data
          </li>
          <li className="flex items-center">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></span>
            Set up your preferences and launch the platform
          </li>
        </ul>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default WelcomeStep;
