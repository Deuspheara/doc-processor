import { Handle, Position } from '@xyflow/react';
import { Shield, Settings, CheckCircle, Edit, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface DataValidatorNodeProps {
  id: string;
  data: {
    label: string;
    config?: {
      validation_rules?: Array<{
        field: string;
        type: string;
        value?: any;
      }>;
      description?: string;
    };
    onConfigUpdate?: (nodeId: string, config: any) => void;
  };
  selected?: boolean;
}

export function DataValidatorNode({ id, data, selected }: DataValidatorNodeProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [localConfig, setLocalConfig] = useState(data.config || { validation_rules: [] });
  
  return (
    <div className="relative">
      <div className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 transition-colors ${
        selected ? 'border-orange-500 shadow-lg' : 'border-orange-200'
      }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-2 bg-orange-100 rounded-lg mr-3">
            <CheckCircle className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800">{data.label}</div>
            <div className="text-xs text-gray-500">Validate extracted data</div>
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
            <div><span className="font-medium">Rules:</span> {data.config?.validation_rules?.length || 0} configured</div>
            {data.config?.validation_rules?.slice(0, 2).map((rule, index) => (
              <div key={index} className="text-xs text-gray-600">
                • {rule.field}: {rule.type}
              </div>
            ))}
            {(data.config?.validation_rules?.length || 0) > 2 && (
              <div className="text-xs text-gray-500">... and {(data.config?.validation_rules?.length || 0) - 2} more</div>
            )}
            {data.config?.description && (
              <div><span className="font-medium">Description:</span> {data.config.description}</div>
            )}
          </div>
        </div>
      )}
      
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 bg-orange-500 border-2 border-white shadow-sm" 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 bg-orange-500 border-2 border-white shadow-sm" 
      />
      </div>

    {/* Configuration Modal */}
    {showConfigModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-90vw max-h-90vh overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Data Validator Configuration</h3>
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
                Description
              </label>
              <textarea
                value={localConfig.description || ''}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe validation purpose..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Validation Rules
                </label>
                <button
                  onClick={() => {
                    const newRules = [...(localConfig.validation_rules || []), { field: '', type: 'required', value: '' }];
                    setLocalConfig(prev => ({ ...prev, validation_rules: newRules }));
                  }}
                  className="flex items-center text-sm text-orange-600 hover:text-orange-800"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Rule
                </button>
              </div>
              
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {(localConfig.validation_rules || []).map((rule, index) => (
                  <div key={index} className="border rounded-md p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Rule {index + 1}</span>
                      <button
                        onClick={() => {
                          const newRules = localConfig.validation_rules?.filter((_, i) => i !== index) || [];
                          setLocalConfig(prev => ({ ...prev, validation_rules: newRules }));
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Field Name</label>
                        <input
                          type="text"
                          value={rule.field}
                          onChange={(e) => {
                            const newRules = [...(localConfig.validation_rules || [])];
                            newRules[index] = { ...rule, field: e.target.value };
                            setLocalConfig(prev => ({ ...prev, validation_rules: newRules }));
                          }}
                          placeholder="field_name"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Rule Type</label>
                        <select
                          value={rule.type}
                          onChange={(e) => {
                            const newRules = [...(localConfig.validation_rules || [])];
                            newRules[index] = { ...rule, type: e.target.value };
                            setLocalConfig(prev => ({ ...prev, validation_rules: newRules }));
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                        >
                          <option value="required">Required</option>
                          <option value="min_value">Min Value</option>
                          <option value="max_value">Max Value</option>
                          <option value="regex">Regex Pattern</option>
                        </select>
                      </div>
                    </div>
                    
                    {(['min_value', 'max_value', 'regex'].includes(rule.type)) && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Value</label>
                        <input
                          type="text"
                          value={rule.value || ''}
                          onChange={(e) => {
                            const newRules = [...(localConfig.validation_rules || [])];
                            newRules[index] = { ...rule, value: e.target.value };
                            setLocalConfig(prev => ({ ...prev, validation_rules: newRules }));
                          }}
                          placeholder={rule.type === 'regex' ? 'regex pattern' : 'numeric value'}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                    )}
                  </div>
                ))}
                
                {(localConfig.validation_rules || []).length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No validation rules configured. Click &quot;Add Rule&quot; to start.
                  </div>
                )}
              </div>
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
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
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
