import { Handle, Position } from '@xyflow/react';
import { Shield, Settings, CheckCircle, Edit, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
      <Card className={`transition-colors ${
        selected ? 'border-orange-500 shadow-lg' : 'border-border'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg mr-3">
                <CheckCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-sm font-semibold">{data.label}</div>
                <div className="text-xs text-muted-foreground">Validate extracted data</div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfig(!showConfig)}
                title="Show config"
                className="h-8 w-8 p-0"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfigModal(true)}
                title="Edit config"
                className="h-8 w-8 p-0"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {showConfig && (
            <div className="mt-3 p-3 bg-muted rounded-md text-xs border">
              <div className="space-y-1">
                <div><span className="font-medium">Rules:</span> {data.config?.validation_rules?.length || 0} configured</div>
                {data.config?.validation_rules?.slice(0, 2).map((rule, index) => (
                  <div key={index} className="text-xs text-muted-foreground">
                    • {rule.field}: {rule.type}
                  </div>
                ))}
                {(data.config?.validation_rules?.length || 0) > 2 && (
                  <div className="text-xs text-muted-foreground">... and {(data.config?.validation_rules?.length || 0) - 2} more</div>
                )}
                {data.config?.description && (
                  <div><span className="font-medium">Description:</span> {data.config.description}</div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Configuration Modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Data Validator Configuration</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={localConfig.description || ''}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe validation purpose..."
                rows={2}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Validation Rules</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newRules = [...(localConfig.validation_rules || []), { field: '', type: 'required', value: '' }];
                    setLocalConfig(prev => ({ ...prev, validation_rules: newRules }));
                  }}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Rule
                </Button>
              </div>
              
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {(localConfig.validation_rules || []).map((rule, index) => (
                  <div key={index} className="border rounded-md p-3 bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Rule {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newRules = localConfig.validation_rules?.filter((_, i) => i !== index) || [];
                          setLocalConfig(prev => ({ ...prev, validation_rules: newRules }));
                        }}
                        className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Field Name</Label>
                        <Input
                          value={rule.field}
                          onChange={(e) => {
                            const newRules = [...(localConfig.validation_rules || [])];
                            newRules[index] = { ...rule, field: e.target.value };
                            setLocalConfig(prev => ({ ...prev, validation_rules: newRules }));
                          }}
                          placeholder="field_name"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Rule Type</Label>
                        <Select
                          value={rule.type}
                          onValueChange={(value) => {
                            const newRules = [...(localConfig.validation_rules || [])];
                            newRules[index] = { ...rule, type: value };
                            setLocalConfig(prev => ({ ...prev, validation_rules: newRules }));
                          }}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="required">Required</SelectItem>
                            <SelectItem value="min_value">Min Value</SelectItem>
                            <SelectItem value="max_value">Max Value</SelectItem>
                            <SelectItem value="regex">Regex Pattern</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {(['min_value', 'max_value', 'regex'].includes(rule.type)) && (
                      <div className="space-y-1">
                        <Label className="text-xs">Value</Label>
                        <Input
                          value={rule.value || ''}
                          onChange={(e) => {
                            const newRules = [...(localConfig.validation_rules || [])];
                            newRules[index] = { ...rule, value: e.target.value };
                            setLocalConfig(prev => ({ ...prev, validation_rules: newRules }));
                          }}
                          placeholder={rule.type === 'regex' ? 'regex pattern' : 'numeric value'}
                          className="h-8 text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
                
                {(localConfig.validation_rules || []).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No validation rules configured. Click "Add Rule" to start.
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setShowConfigModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (data.onConfigUpdate) {
                  data.onConfigUpdate(id, localConfig);
                }
                setShowConfigModal(false);
              }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Save Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
