import { Handle, Position } from '@xyflow/react';
import { Settings, FileSearch, Edit } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface OCRProcessorNodeProps {
  id: string;
  data: {
    label: string;
    config?: {
      language?: string;
      confidence_threshold?: number;
      description?: string;
    };
    onConfigUpdate?: (nodeId: string, config: Record<string, unknown>) => void;
  };
  selected?: boolean;
}

export function OCRProcessorNode({ id, data, selected }: OCRProcessorNodeProps) {
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
        selected ? 'border-green-500 shadow-lg' : 'border-border'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <FileSearch className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-semibold">{data.label}</div>
                <div className="text-xs text-muted-foreground">Extract text from documents</div>
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
                <div><span className="font-medium">Language:</span> {data.config?.language || 'Auto'}</div>
                <div><span className="font-medium">Confidence:</span> {(data.config?.confidence_threshold || 0.8) * 100}%</div>
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
        className="w-3 h-3 bg-green-500 border-2 border-white shadow-sm" 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 bg-green-500 border-2 border-white shadow-sm" 
      />

      {/* Configuration Modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>OCR Processor Configuration</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">OCR Language</Label>
              <Select
                value={localConfig.language as string || 'auto'}
                onValueChange={(value) => updateLocalConfig('language', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                  <SelectItem value="eng">English</SelectItem>
                  <SelectItem value="spa">Spanish</SelectItem>
                  <SelectItem value="fra">French</SelectItem>
                  <SelectItem value="deu">German</SelectItem>
                  <SelectItem value="chi_sim">Chinese (Simplified)</SelectItem>
                  <SelectItem value="jpn">Japanese</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confidence">Confidence Threshold (%)</Label>
              <Input
                id="confidence"
                type="number"
                min="0"
                max="100"
                value={((localConfig.confidence_threshold as number) || 0.8) * 100}
                onChange={(e) => updateLocalConfig('confidence_threshold', parseFloat(e.target.value) / 100)}
                placeholder="80"
              />
              <p className="text-xs text-muted-foreground">Minimum confidence score for text recognition</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={localConfig.description as string || ''}
                onChange={(e) => updateLocalConfig('description', e.target.value)}
                placeholder="Describe OCR processing requirements..."
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setShowConfigModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfigSave} className="bg-green-600 hover:bg-green-700">
              Save Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
