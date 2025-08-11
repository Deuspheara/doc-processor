'use client';

import { useState, useEffect } from 'react';
import { Save, Key, Settings as SettingsIcon, Globe, Zap } from 'lucide-react';

interface ApiConfig {
  mistral_api_key: string;
  openai_api_key: string;
  openrouter_api_key: string;
  api_base_url: string;
  default_model: string;
}

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string;
}

const availableModels: ModelInfo[] = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Most capable GPT-4 model' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', description: 'Fast and capable' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', description: 'Fast and cost-effective' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'OpenRouter', description: 'Anthropic\'s balanced model' },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google', description: 'Google\'s advanced model' },
];

export default function SettingsPage() {
  const [config, setConfig] = useState<ApiConfig>({
    mistral_api_key: '',
    openai_api_key: '',
    openrouter_api_key: '',
    api_base_url: 'http://localhost:8000',
    default_model: 'gpt-4o'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Load saved configuration
    const savedConfig = localStorage.getItem('apiConfig');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  const handleConfigChange = (key: keyof ApiConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const saveConfiguration = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      // Save to localStorage (in a real app, you'd save to a backend)
      localStorage.setItem('apiConfig', JSON.stringify(config));
      
      // Test the API connection
      const response = await fetch(`${config.api_base_url}/health`);
      if (response.ok) {
        setMessage({ type: 'success', text: 'Configuration saved successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Configuration saved, but API connection failed.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save configuration.' });
    } finally {
      setIsSaving(false);
    }
  };

  const testApiConnection = async () => {
    try {
      const response = await fetch(`${config.api_base_url}/health`);
      const data = await response.json();
      
      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `API connection successful! Status: ${data.status}` 
        });
      } else {
        setMessage({ type: 'error', text: 'API connection failed.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to connect to API.' });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure API keys, models, and processing parameters
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* API Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Key className="h-6 w-6 text-gray-600" />
          <h2 className="text-xl font-semibold">API Configuration</h2>
        </div>

        <div className="space-y-6">
          {/* API Base URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Base URL
            </label>
            <div className="flex space-x-3">
              <input
                type="url"
                value={config.api_base_url}
                onChange={(e) => handleConfigChange('api_base_url', e.target.value)}
                placeholder="http://localhost:8000"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={testApiConnection}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Globe className="h-4 w-4" />
                <span>Test</span>
              </button>
            </div>
          </div>

          {/* Mistral API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mistral API Key (for OCR)
            </label>
            <input
              type="password"
              value={config.mistral_api_key}
              onChange={(e) => handleConfigChange('mistral_api_key', e.target.value)}
              placeholder="Enter your Mistral API key"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Required for OCR text extraction from documents
            </p>
          </div>

          {/* OpenAI API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OpenAI API Key (for Information Extraction)
            </label>
            <input
              type="password"
              value={config.openai_api_key}
              onChange={(e) => handleConfigChange('openai_api_key', e.target.value)}
              placeholder="Enter your OpenAI API key"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Required for GPT models and information extraction
            </p>
          </div>

          {/* OpenRouter API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OpenRouter API Key (Optional)
            </label>
            <input
              type="password"
              value={config.openrouter_api_key}
              onChange={(e) => handleConfigChange('openrouter_api_key', e.target.value)}
              placeholder="Enter your OpenRouter API key"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Provides access to Claude, Llama, and other models
            </p>
          </div>
        </div>
      </div>

      {/* Model Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Zap className="h-6 w-6 text-gray-600" />
          <h2 className="text-xl font-semibold">Model Configuration</h2>
        </div>

        <div className="space-y-6">
          {/* Default Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Model for Information Extraction
            </label>
            <select
              value={config.default_model}
              onChange={(e) => handleConfigChange('default_model', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {availableModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.provider}) - {model.description}
                </option>
              ))}
            </select>
          </div>

          {/* Available Models */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Available Models</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableModels.map((model) => (
                <div key={model.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{model.name}</h4>
                    <span className="text-sm text-gray-500">{model.provider}</span>
                  </div>
                  <p className="text-sm text-gray-600">{model.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Processing Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <SettingsIcon className="h-6 w-6 text-gray-600" />
          <h2 className="text-xl font-semibold">Processing Settings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max File Size (MB)
            </label>
            <input
              type="number"
              defaultValue={50}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Processing Timeout (seconds)
            </label>
            <input
              type="number"
              defaultValue={120}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="auto-retry"
              defaultChecked
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="auto-retry" className="text-sm font-medium text-gray-700">
              Auto-retry failed processing
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="save-text"
              defaultChecked
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="save-text" className="text-sm font-medium text-gray-700">
              Save extracted text
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveConfiguration}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </div>
    </div>
  );
}
