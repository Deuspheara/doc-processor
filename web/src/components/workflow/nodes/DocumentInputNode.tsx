import { Handle, Position } from '@xyflow/react';
import { Settings, Upload, Edit } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DocumentInputNodeProps {
  id: string;
  data: {
    label: string;
    config?: {
      acceptedTypes?: string[];
      maxFiles?: number;
      description?: string;
    };
    onConfigUpdate?: (nodeId: string, config: Record<string, unknown>) => void;
  };
  selected?: boolean;
}

export function DocumentInputNode({ id, data, selected }: DocumentInputNodeProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [localConfig, setLocalConfig] = useState(data.config || {});
  
  return (
    <div className="relative">
      <Card className={`transition-colors ${
        selected ? 'border-primary shadow-lg' : 'border-border'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-semibold">{data.label}</div>
                <div className="text-xs text-muted-foreground">Upload documents</div>
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
                <div><span className="font-medium">Max files:</span> {data.config?.maxFiles || 10}</div>
                <div><span className="font-medium">Types:</span> {data.config?.acceptedTypes?.join(', ') || 'All'}</div>
                {data.config?.description && (
                  <div><span className="font-medium">Description:</span> {data.config.description}</div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 bg-blue-500 border-2 border-white shadow-sm" 
      />

    {/* Configuration Modal */}
    <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
      <DialogContent className="w-96 max-w-90vw max-h-90vh overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Document Input Configuration</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxFiles">
              Maximum Files
            </Label>
            <Input
              id="maxFiles"
              type="number"
              min="1"
              max="100"
              value={localConfig.maxFiles || 10}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, maxFiles: parseInt(e.target.value) }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Accepted File Types</Label>
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
                  <span className="text-sm">.{type}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">
              Description
            </Label>
            <textarea
              id="description"
              value={localConfig.description || ''}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the expected document types..."
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setShowConfigModal(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (data.onConfigUpdate) {
                data.onConfigUpdate(id, localConfig);
              }
              setShowConfigModal(false);
            }}
          >
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </div>
  );
}
