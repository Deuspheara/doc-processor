import { Handle, Position } from '@xyflow/react';
import { Settings, Sparkles, Edit } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
      <Card className={`transition-colors ${
        selected ? 'border-purple-500 shadow-lg' : 'border-border'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-semibold">{data.label}</div>
                <div className="text-xs text-muted-foreground">AI-powered data extraction</div>
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
                <div><span className="font-medium">Model:</span> {data.config?.model || 'GPT-4'}</div>
                <div><span className="font-medium">Fields:</span> {data.config?.extraction_fields?.length || 0} configured</div>
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
        className="w-3 h-3 bg-purple-500 border-2 border-white shadow-sm" 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 bg-purple-500 border-2 border-white shadow-sm" 
      />

      {/* Configuration Modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>AI Extractor Configuration</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="model">AI Model</Label>
              <Select
                value={localConfig.model as string || 'gpt-4o'}
                onValueChange={(value) => updateLocalConfig('model', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fields">Extraction Fields (comma-separated)</Label>
              <Input
                id="fields"
                value={(localConfig.extraction_fields as string[])?.join(', ') || ''}
                onChange={(e) => updateLocalConfig('extraction_fields', e.target.value.split(',').map(f => f.trim()).filter(f => f))}
                placeholder="invoice_number, total_amount, vendor_name"
              />
              <p className="text-xs text-muted-foreground">Leave empty for automatic field detection</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={localConfig.description as string || ''}
                onChange={(e) => updateLocalConfig('description', e.target.value)}
                placeholder="Describe what this AI extractor should do..."
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setShowConfigModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfigSave}>
              Save Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
