'use client';

import { useState, useEffect } from 'react';
import { Save, Key, Settings as SettingsIcon, Globe, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure API keys, models, and processing parameters
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
          <AlertDescription>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Settings Tabs */}
      <Tabs defaultValue="api" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="api">API Configuration</TabsTrigger>
          <TabsTrigger value="models">Models & Processing</TabsTrigger>
        </TabsList>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Key className="h-6 w-6" />
                <span>API Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Base URL */}
              <div className="space-y-2">
                <Label htmlFor="api_base_url">API Base URL</Label>
                <div className="flex space-x-3">
                  <Input
                    id="api_base_url"
                    type="url"
                    value={config.api_base_url}
                    onChange={(e) => handleConfigChange('api_base_url', e.target.value)}
                    placeholder="http://localhost:8000"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={testApiConnection}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Test
                  </Button>
                </div>
              </div>

              {/* Mistral API Key */}
              <div className="space-y-2">
                <Label htmlFor="mistral_api_key">Mistral API Key (for OCR)</Label>
                <Input
                  id="mistral_api_key"
                  type="password"
                  value={config.mistral_api_key}
                  onChange={(e) => handleConfigChange('mistral_api_key', e.target.value)}
                  placeholder="Enter your Mistral API key"
                />
                <p className="text-sm text-muted-foreground">
                  Required for OCR text extraction from documents
                </p>
              </div>

              {/* OpenAI API Key */}
              <div className="space-y-2">
                <Label htmlFor="openai_api_key">OpenAI API Key (for Information Extraction)</Label>
                <Input
                  id="openai_api_key"
                  type="password"
                  value={config.openai_api_key}
                  onChange={(e) => handleConfigChange('openai_api_key', e.target.value)}
                  placeholder="Enter your OpenAI API key"
                />
                <p className="text-sm text-muted-foreground">
                  Required for GPT models and information extraction
                </p>
              </div>

              {/* OpenRouter API Key */}
              <div className="space-y-2">
                <Label htmlFor="openrouter_api_key">OpenRouter API Key (Optional)</Label>
                <Input
                  id="openrouter_api_key"
                  type="password"
                  value={config.openrouter_api_key}
                  onChange={(e) => handleConfigChange('openrouter_api_key', e.target.value)}
                  placeholder="Enter your OpenRouter API key"
                />
                <p className="text-sm text-muted-foreground">
                  Provides access to Claude, Llama, and other models
                </p>
              </div>

              <Button 
                onClick={saveConfiguration} 
                disabled={isSaving}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Zap className="h-6 w-6" />
                <span>Model Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Default Model */}
              <div className="space-y-2">
                <Label htmlFor="default_model">Default Model for Information Extraction</Label>
                <Select 
                  value={config.default_model} 
                  onValueChange={(value) => handleConfigChange('default_model', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name} ({model.provider}) - {model.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Available Models */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Available Models</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableModels.map((model) => (
                    <Card key={model.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{model.name}</h4>
                          <span className="text-sm text-muted-foreground">{model.provider}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{model.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Processing Settings */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium flex items-center space-x-2">
                  <SettingsIcon className="h-5 w-5" />
                  <span>Processing Settings</span>
                </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="max_file_size">Max File Size (MB)</Label>
                    <Input
                      id="max_file_size"
                      type="number"
                      defaultValue={50}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="processing_timeout">Processing Timeout (seconds)</Label>
                    <Input
                      id="processing_timeout"
                      type="number"
                      defaultValue={120}
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="auto-retry"
                      defaultChecked
                      className="rounded"
                    />
                    <Label htmlFor="auto-retry">
                      Auto-retry failed processing
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="save-text"
                      defaultChecked
                      className="rounded"
                    />
                    <Label htmlFor="save-text">
                      Save extracted text
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
