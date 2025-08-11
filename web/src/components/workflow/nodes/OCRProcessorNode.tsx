import { Handle, Position } from '@xyflow/react';
import { Eye, Settings, FileSearch, Edit } from 'lucide-react';
import { useState } from 'react';

interface OCRProcessorNodeProps {
  id: string;
  data: {
    label: string;
    config?: {
      language?: string;
      confidence_threshold?: number;
      description?: string;
    };
    onConfigUpdate?: (nodeId: string, config: any) => void;
  };
  selected?: boolean;
}

export function OCRProcessorNode({ id, data, selected }: OCRProcessorNodeProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [localConfig, setLocalConfig] = useState(data.config || {});
  
  return (
    <div className="relative">
      <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 transition-colors ${
        selected ? 'border-green-500 shadow-lg' : 'border-green-200'
      }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg mr-3">
            <FileSearch className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800">{data.label}</div>
            <div className="text-xs text-gray-500">Extract text from documents</div>
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
            <div><span className="font-medium">Language:</span> {data.config?.language || 'Auto-detect'}</div>
            <div><span className="font-medium">Confidence:</span> {data.config?.confidence_threshold || 0.8}</div>
            {data.config?.description && (
              <div><span className="font-medium">Description:</span> {data.config.description}</div>
            )}
          </div>
        </div>
      )}
      
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 bg-green-500 border-2 border-white shadow-sm" 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 bg-green-500 border-2 border-white shadow-sm" 
      />
      </div>

    {/* Configuration Modal */}
    {showConfigModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-90vw max-h-90vh overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">OCR Processor Configuration</h3>
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
                Language
              </label>
              <select
                value={localConfig.language || 'auto'}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, language: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="auto">Auto-detect</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="zh">Chinese</option>
                <option value="ja">Japanese</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confidence Threshold
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={localConfig.confidence_threshold || 0.8}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, confidence_threshold: parseFloat(e.target.value) }))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 min-w-12">
                  {((localConfig.confidence_threshold || 0.8) * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum confidence level for text recognition</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={localConfig.description || ''}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe OCR processing requirements..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
              onClick={() => {
                if (data.onConfigUpdate) {
                  data.onConfigUpdate(id, localConfig);
                }
                setShowConfigModal(false);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
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
