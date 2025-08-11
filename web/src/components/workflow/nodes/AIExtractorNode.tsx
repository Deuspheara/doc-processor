import { Handle, Position } from '@xyflow/react';
import { Brain, Settings, Sparkles, Edit } from 'lucide-react';
import { useState } from 'react';

interface AIExtractorNodeProps {
  id: string;
  data: {
    label: string;
    config?: {
      extraction_fields?: string[];
      model?: string;
      description?: string;
    };
    onConfigUpdate?: (nodeId: string, config: Record<string, unknown>) => void;
  };
  selected?: boolean;
}

export function AIExtractorNode({ id, data, selected }: AIExtractorNodeProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [localConfig, setLocalConfig] = useState(data.config || {});
  
  const handleConfigSave = () => {
    if (data.onConfigUpdate) {
      data.onConfigUpdate(id, localConfig);
    }
    setShowConfigModal(false);
  };

  const updateLocalConfig = (key: string, value: unknown) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };
  
  return (
    <div className="relative">
      <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 transition-colors ${
        selected ? 'border-purple-500 shadow-lg' : 'border-purple-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg mr-3">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800">{data.label}</div>
              <div className="text-xs text-gray-500">AI-powered data extraction</div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => setShowConfig(!showConfig)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Show config"
            >
              <Settings className="w-4 h-4 text-gray-400" />
            </button>
            <button 
              onClick={() => setShowConfigModal(true)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Edit config"
            >
              <Edit className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        
        {showConfig && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md text-xs border">
            <div className="space-y-1">
              <div><span className="font-medium">Model:</span> {data.config?.model || 'gpt-4o'}</div>
              <div><span className="font-medium">Fields:</span> {data.config?.extraction_fields?.join(', ') || 'Auto-detect'}</div>
              {data.config?.description && (
                <div><span className="font-medium">Description:</span> {data.config.description}</div>
              )}
            </div>
          </div>
        )}
      
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 bg-purple-500 border-2 border-white shadow-sm" 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 bg-purple-500 border-2 border-white shadow-sm" 
      />
      </div>

    {/* Configuration Modal */}
    {showConfigModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-90vw max-h-90vh overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">AI Extractor Configuration</h3>
            <button 
              onClick={() => setShowConfigModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Model
              </label>
              <select
                value={localConfig.model || 'gpt-4o'}
                onChange={(e) => updateLocalConfig('model', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Extraction Fields (comma-separated)
              </label>
              <input
                type="text"
                value={localConfig.extraction_fields?.join(', ') || ''}
                onChange={(e) => updateLocalConfig('extraction_fields', e.target.value.split(',').map(f => f.trim()).filter(f => f))}
                placeholder="invoice_number, total_amount, vendor_name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for automatic field detection</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={localConfig.description || ''}
                onChange={(e) => updateLocalConfig('description', e.target.value)}
                placeholder="Describe what this AI extractor should do..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowConfigModal(false)}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfigSave}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
