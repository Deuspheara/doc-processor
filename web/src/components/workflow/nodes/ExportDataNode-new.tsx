import { Handle, Position } from '@xyflow/react';
import { Download, Settings, FileOutput, Edit } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
      <Card className={`transition-colors ${
        selected ? 'border-indigo-500 shadow-lg' : 'border-border'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                <FileOutput className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <div className="text-sm font-semibold">{data.label}</div>
                <div className="text-xs text-muted-foreground">Export processed data</div>
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
                <div><span className="font-medium">Format:</span> {data.config?.format || 'JSON'}</div>
                <div><span className="font-medium">Path:</span> {data.config?.export_path || 'exports/'}</div>
                <div><span className="font-medium">Include metadata:</span> {data.config?.include_metadata ? 'Yes' : 'No'}</div>
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
        className="w-3 h-3 bg-indigo-500 border-2 border-white shadow-sm" 
      />

      {/* Configuration Modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Data Configuration</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="format">Export Format</Label>
              <Select
                value={localConfig.format as string || 'json'}
                onValueChange={(value) => setLocalConfig(prev => ({ ...prev, format: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="path">Export Path</Label>
              <Input
                id="path"
                value={localConfig.export_path as string || 'exports'}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, export_path: e.target.value }))}
                placeholder="exports"
              />
              <p className="text-xs text-muted-foreground">Directory path where exported files will be saved</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                id="metadata"
                type="checkbox"
                checked={localConfig.include_metadata as boolean ?? false}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, include_metadata: e.target.checked }))}
                className="rounded border-input text-primary focus:ring-ring"
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="metadata"
                  className="text-sm font-medium leading-none"
                >
                  Include processing metadata
                </Label>
                <p className="text-xs text-muted-foreground">
                  Include timestamps, confidence scores, and processing details
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={localConfig.description as string || ''}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe export requirements..."
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
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
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Save Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
