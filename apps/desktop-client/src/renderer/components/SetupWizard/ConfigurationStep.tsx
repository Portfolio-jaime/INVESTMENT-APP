import React, { useState } from 'react';
import { Key, Database, Settings, Eye, EyeOff, ExternalLink, Info } from 'lucide-react';
import { SetupConfig } from './SetupWizard';

interface ConfigurationStepProps {
  config: SetupConfig;
  onConfigUpdate: (updates: Partial<SetupConfig>) => void;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

const ConfigurationStep: React.FC<ConfigurationStepProps> = ({
  config,
  onConfigUpdate,
  onNext,
  onPrevious,
}) => {
  const [showKeys, setShowKeys] = useState({
    alphaVantage: false,
    finnhub: false,
    twelveData: false,
  });

  const handleApiKeyChange = (key: keyof SetupConfig['apiKeys'], value: string) => {
    onConfigUpdate({
      apiKeys: {
        ...config.apiKeys,
        [key]: value,
      },
    });
  };

  const handlePreferenceChange = (key: keyof SetupConfig['preferences'], value: any) => {
    onConfigUpdate({
      preferences: {
        ...config.preferences,
        [key]: value,
      },
    });
  };

  const handleSkip = () => {
    // Save default configuration
    window.electronAPI.saveConfiguration(config);
    onNext();
  };

  const handleSaveAndContinue = async () => {
    // Validate and save configuration
    await window.electronAPI.saveConfiguration(config);
    onNext();
  };

  const apiProviders = [
    {
      key: 'alphaVantage' as const,
      name: 'Alpha Vantage',
      description: 'Stock quotes, fundamentals, and technical indicators',
      url: 'https://www.alphavantage.co/support/#api-key',
      free: 'Yes (500 calls/day)',
    },
    {
      key: 'finnhub' as const,
      name: 'Finnhub',
      description: 'Real-time stock data, news, and company information',
      url: 'https://finnhub.io/register',
      free: 'Yes (60 calls/minute)',
    },
    {
      key: 'twelveData' as const,
      name: 'Twelve Data',
      description: 'Stock, forex, and cryptocurrency market data',
      url: 'https://twelvedata.com/pricing',
      free: 'Yes (800 calls/day)',
    },
  ];

  const hasAnyApiKey =
    config.apiKeys.alphaVantage || config.apiKeys.finnhub || config.apiKeys.twelveData;

  return (
    <div className="p-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl mb-4">
          <Settings className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
          Configure Your Platform
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Enhance your experience with API keys for real-time market data. All fields are optional
          and can be configured later.
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5 mb-8">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">Free API keys available!</p>
            <p>
              All providers listed below offer free tiers suitable for personal investment tracking.
              API keys are stored securely on your device and never shared.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* API Keys Section */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Key className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              API Keys (Optional)
            </h3>
          </div>

          <div className="space-y-4">
            {apiProviders.map((provider) => (
              <div
                key={provider.key}
                className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        {provider.name}
                      </h4>
                      <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                        Free Tier
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">
                      {provider.description}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Free tier: {provider.free}
                    </p>
                  </div>
                  <a
                    href={provider.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showKeys[provider.key] ? 'text' : 'password'}
                    value={config.apiKeys[provider.key]}
                    onChange={(e) => handleApiKeyChange(provider.key, e.target.value)}
                    placeholder={`Enter your ${provider.name} API key`}
                    className="w-full px-4 py-2 pr-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400"
                  />
                  <button
                    onClick={() =>
                      setShowKeys((prev) => ({ ...prev, [provider.key]: !prev[provider.key] }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showKeys[provider.key] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preferences Section */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Database className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Preferences</h3>
          </div>

          <div className="space-y-4">
            {/* Data Storage */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5">
              <label className="block mb-3">
                <span className="font-semibold text-slate-900 dark:text-white block mb-2">
                  Data Storage Location
                </span>
                <select
                  value={config.preferences.dataStorage}
                  onChange={(e) => handlePreferenceChange('dataStorage', e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
                >
                  <option value="local">Local (Recommended)</option>
                  <option value="custom">Custom Location</option>
                </select>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                  Where to store portfolio data and cache
                </span>
              </label>
            </div>

            {/* Auto Update */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                    Automatic Data Updates
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    Refresh market data every 30 seconds when the app is active
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={config.preferences.autoUpdate}
                    onChange={(e) => handlePreferenceChange('autoUpdate', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Note */}
      <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
          All API keys and preferences are stored locally and encrypted. You can modify these
          settings anytime in the application preferences.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onPrevious}
          className="px-6 py-3 text-slate-600 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          Previous
        </button>
        <div className="flex space-x-3">
          <button
            onClick={handleSkip}
            className="px-6 py-3 text-slate-600 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Skip for Now
          </button>
          <button
            onClick={handleSaveAndContinue}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {hasAnyApiKey ? 'Save & Continue' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationStep;
