import { Handle, Position } from '@xyflow/react';
import { FileText, Settings, Upload, Edit } from 'lucide-react';
import { useState } from 'react';

interface DocumentInputNodeProps {
  id: string;
  data: {
    label: string;
    config?: {
      acceptedTypes?: string[];
      maxFiles?: number;
      description?: string;
    };
    onConfigUpdate?: (nodeId: string, config: any) => void;
  };
  selected?: boolean;
}

export function DocumentInputNode({ id, data, selected }: DocumentInputNodeProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [localConfig, setLocalConfig] = useState(data.config || {});
  
  return (
    <div className="relative">
      <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 transition-colors ${
        selected ? 'border-blue-500 shadow-lg' : 'border-blue-200'
      }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg mr-3">
            <Upload className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800">{data.label}</div>
            <div className="text-xs text-gray-500">Upload documents</div>
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
            <div><span className="font-medium">Max files:</span> {data.config?.maxFiles || 10}</div>
            <div><span className="font-medium">Types:</span> {data.config?.acceptedTypes?.join(', ') || 'All'}</div>
            {data.config?.description && (
              <div><span className="font-medium">Description:</span> {data.config.description}</div>
            )}
          </div>
        </div>
      )}
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 bg-blue-500 border-2 border-white shadow-sm" 
      />
      </div>

    {/* Configuration Modal */}
    {showConfigModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-90vw max-h-90vh overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Document Input Configuration</h3>
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
                Maximum Files
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={localConfig.maxFiles || 10}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, maxFiles: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Accepted File Types
              </label>
              <div className="space-y-2">
                {['pdf', 'png', 'jpg', 'jpeg', 'txt', 'docx'].map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={localConfig.acceptedTypes?.includes(type) ?? true}
                      onChange={(e) => {
                        const currentTypes = localConfig.acceptedTypes || ['pdf', 'png', 'jpg', 'jpeg', 'txt'];
                        if (e.target.checked) {
                          setLocalConfig(prev => ({ 
                            ...prev, 
                            acceptedTypes: [...(prev.acceptedTypes || []), type] 
                          }));
                        } else {
                          setLocalConfig(prev => ({ 
                            ...prev, 
                            acceptedTypes: (prev.acceptedTypes || []).filter(t => t !== type) 
                          }));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">.{type}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={localConfig.description || ''}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the expected document types..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
