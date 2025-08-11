import { Handle, Position } from '@xyflow/react';
import { Download, Settings, FileOutput, Edit } from 'lucide-react';
import { useState } from 'react';

interface ExportDataNodeProps {
  id: string;
  data: {
    label: string;
    config?: {
      format?: string;
      export_path?: string;
      include_metadata?: boolean;
      description?: string;
    };
    onConfigUpdate?: (nodeId: string, config: any) => void;
  };
  selected?: boolean;
}

export function ExportDataNode({ id, data, selected }: ExportDataNodeProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [localConfig, setLocalConfig] = useState(data.config || {});
  
  return (
    <div className="relative">
      <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 transition-colors ${
        selected ? 'border-indigo-500 shadow-lg' : 'border-indigo-200'
      }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-2 bg-indigo-100 rounded-lg mr-3">
            <FileOutput className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800">{data.label}</div>
            <div className="text-xs text-gray-500">Export processed data</div>
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
            <div><span className="font-medium">Format:</span> {data.config?.format || 'JSON'}</div>
            <div><span className="font-medium">Path:</span> {data.config?.export_path || 'exports/'}</div>
            <div><span className="font-medium">Include metadata:</span> {data.config?.include_metadata ? 'Yes' : 'No'}</div>
            {data.config?.description && (
              <div><span className="font-medium">Description:</span> {data.config.description}</div>
            )}
          </div>
        </div>
      )}
      
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 bg-indigo-500 border-2 border-white shadow-sm" 
      />
      </div>

    {/* Configuration Modal */}
    {showConfigModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-90vw max-h-90vh overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Export Data Configuration</h3>
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
                Export Format
              </label>
              <select
                value={localConfig.format || 'json'}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, format: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="xlsx">Excel (XLSX)</option>
                <option value="xml">XML</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Path
              </label>
              <input
                type="text"
                value={localConfig.export_path || 'exports'}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, export_path: e.target.value }))}
                placeholder="exports"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">Directory path where exported files will be saved</p>
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localConfig.include_metadata ?? false}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, include_metadata: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Include processing metadata</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">Include timestamps, confidence scores, and processing details</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={localConfig.description || ''}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe export requirements..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
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
