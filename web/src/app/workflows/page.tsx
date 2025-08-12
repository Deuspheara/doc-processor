'use client';

import { useState, useCallback } from 'react';
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Connection,
  Edge,
  NodeTypes
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play, Save, Plus, Download, AlertCircle, CheckCircle, Upload, Trash2, FolderOpen, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { 
  DocumentInputNode,
  OCRProcessorNode,
  AIExtractorNode,
  DataValidatorNode,
  ExportDataNode 
} from '@/components/workflow/nodes';
import { useWorkflows } from '@/components/workflow/useWorkflows';

interface ExecutionResult {
  execution_id: string;
  status: string;
  result: Record<string, unknown>;
  summary: {
    total_nodes: number;
    successful_nodes: number;
    failed_nodes: number;
    success_rate: number;
  };
  completed_at: string;
}

// Register custom node types - we'll create wrapper components to pass the onConfigUpdate callback
const nodeTypes: NodeTypes = {
  'document-input': DocumentInputNode,
  'ocr-processor': OCRProcessorNode,
  'ai-extractor': AIExtractorNode,
  'data-validator': DataValidatorNode,
  'export-data': ExportDataNode,
};

interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    config?: Record<string, unknown>;
    onConfigUpdate?: (nodeId: string, config: Record<string, unknown>) => void;
  };
}

interface Workflow {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  definition: {
    nodes: WorkflowNode[];
    edges: Edge[];
  };
  created_at?: string;
  updated_at?: string;
}

const initialNodes: WorkflowNode[] = [];

const initialEdges: Edge[] = [];

// Available node types for the palette
const availableNodeTypes = [
  { 
    id: 'document-input', 
    name: 'Document Input', 
    description: 'Upload or receive documents',
    color: 'blue'
  },
  { 
    id: 'ocr-processor', 
    name: 'OCR Processor', 
    description: 'Extract text from documents',
    color: 'green'
  },
  { 
    id: 'ai-extractor', 
    name: 'AI Extractor', 
    description: 'Extract structured data using AI',
    color: 'purple'
  },
  { 
    id: 'data-validator', 
    name: 'Data Validator', 
    description: 'Validate extracted data',
    color: 'orange'
  },
  { 
    id: 'export-data', 
    name: 'Export Data', 
    description: 'Export data to various formats',
    color: 'indigo'
  },
];

export default function WorkflowsPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  
  const { 
    workflows, 
    loading, 
    error, 
    saveWorkflow, 
    deleteWorkflow, 
    executeWorkflow,
    validateWorkflow 
  } = useWorkflows();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleConfigUpdate = useCallback((nodeId: string, config: Record<string, unknown>) => {
    setNodes((nds) => 
      nds.map((node) => 
        node.id === nodeId
          ? { ...node, data: { ...node.data, config } }
          : node
      )
    );
  }, [setNodes]);

  const addNode = useCallback((type: string, label: string) => {
    const id = `${type}-${Date.now()}`;
    const newNode: WorkflowNode = {
      id,
      type,
      position: { 
        x: Math.random() * 300 + 100, 
        y: Math.random() * 300 + 100 
      },
      data: { 
        label,
        config: {},
        onConfigUpdate: handleConfigUpdate
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes, handleConfigUpdate]);

  const handleSaveWorkflow = async () => {
    if (!currentWorkflow?.name) {
      alert('Please enter a workflow name');
      return;
    }

    const workflowToSave: Workflow = {
      ...currentWorkflow,
      definition: {
        nodes,
        edges
      }
    };

    const savedId = await saveWorkflow(workflowToSave);
    if (savedId && !currentWorkflow.id) {
      setCurrentWorkflow({ ...currentWorkflow, id: savedId });
    }
  };

  const handleLoadWorkflow = async (workflow: Workflow) => {
    setCurrentWorkflow({
      _id: workflow._id,
      id: workflow._id, // Set id to _id for consistency
      name: workflow.name,
      description: workflow.description,
      definition: workflow.definition,
      created_at: workflow.created_at,
      updated_at: workflow.updated_at
    });
    // Add the onConfigUpdate callback to loaded nodes
    const nodesWithCallback = (workflow.definition?.nodes || []).map((node: WorkflowNode) => ({
      ...node,
      data: {
        ...node.data,
        onConfigUpdate: handleConfigUpdate
      }
    }));
    setNodes(nodesWithCallback);
    setEdges(workflow.definition?.edges || []);
  };

  const handleNewWorkflow = () => {
    setCurrentWorkflow({
      name: '',
      description: '',
      definition: { nodes: [], edges: [] }
    });
    setNodes([]);
    setEdges([]);
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      const success = await deleteWorkflow(workflowId);
      if (success && (currentWorkflow?.id === workflowId || currentWorkflow?._id === workflowId)) {
        handleNewWorkflow();
      }
    }
  };

  const handleRunWorkflow = async () => {
    if (!currentWorkflow?.id) {
      alert('Please save the workflow first');
      return;
    }

    // Check if workflow has document input node
    const hasDocumentInput = nodes.some(node => node.type === 'document-input');
    let files: File[] = [];

    if (hasDocumentInput) {
      // Create file input for document upload
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = '.pdf,.png,.jpg,.jpeg,.txt';
      
      input.onchange = async (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files) {
          files = Array.from(target.files);
          await executeWorkflowWithFiles(files);
        }
      };
      
      input.click();
      return;
    }

    await executeWorkflowWithFiles([]);
  };

  const executeWorkflowWithFiles = async (files: File[]) => {
    if (!currentWorkflow?.id) return;
    
    setIsExecuting(true);
    setExecutionResult(null);
    
    try {
      const result = await executeWorkflow(currentWorkflow.id, files);
      if (result) {
        setExecutionResult(result);
        setShowExecutionModal(true);
      }
    } catch (error) {
      console.error('Execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleValidateWorkflow = async () => {
    const validation = await validateWorkflow({ nodes, edges });
    
    let message = `Workflow validation:

`;
    message += `Nodes: ${validation.node_count}, Edges: ${validation.edge_count}
`;
    message += `Status: ${validation.is_valid ? '✓ Valid' : '✗ Invalid'}

`;
    
    if (validation.errors?.length > 0) {
      message += `Errors:
${validation.errors.map((e: string) => `• ${e}`).join('\n')}

`;
    }
    
    if (validation.warnings?.length > 0) {
      message += `Warnings:
${validation.warnings.map((w: string) => `• ${w}`).join('\n')}`;
    }
    
    alert(message);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Workflow Builder</h1>
            <p className="text-muted-foreground">Design custom document processing workflows</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleRunWorkflow}
              disabled={isExecuting || !currentWorkflow?.id}
              className="bg-green-600 hover:bg-green-700"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run
                </>
              )}
            </Button>
            
            <Button
              onClick={handleSaveWorkflow}
              disabled={loading || !currentWorkflow?.name}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Workflow Info */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="text"
            placeholder="Workflow name"
            value={currentWorkflow?.name || ''}
            onChange={(e) => setCurrentWorkflow(prev => ({
              ...prev!,
              name: e.target.value,
              description: prev?.description || '',
              definition: prev?.definition || { nodes: [], edges: [] }
            }))}
          />
          
          <Input
            type="text"
            placeholder="Description (optional)"
            value={currentWorkflow?.description || ''}
            onChange={(e) => setCurrentWorkflow(prev => ({
              ...prev!,
              name: prev?.name || '',
              description: e.target.value,
              definition: prev?.definition || { nodes: [], edges: [] }
            }))}
          />
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 border-r p-4 overflow-y-auto">
          {/* Node Types */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Components</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {availableNodeTypes.map((nodeType) => (
                  <Button
                    key={nodeType.id}
                    variant="outline"
                    onClick={() => addNode(nodeType.id, nodeType.name)}
                    className="w-full justify-start text-left h-auto p-3"
                  >
                    <div className="flex items-center space-x-3">
                      <Plus className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{nodeType.name}</p>
                        <p className="text-sm text-muted-foreground">{nodeType.description}</p>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Saved Workflows */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <FolderOpen className="w-5 h-5 mr-2" />
                Saved Workflows
                {workflows.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {workflows.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm">Loading workflows...</span>
                    </div>
                  </div>
                ) : workflows.length === 0 ? (
                  <div className="text-center py-8 rounded-lg border-2 border-dashed">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm font-medium">No saved workflows yet</p>
                    <p className="text-muted-foreground text-xs mt-1">Create your first workflow to get started</p>
                  </div>
                ) : (
                  workflows.map((workflow) => (
                    <Card
                      key={workflow._id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        currentWorkflow?.id === workflow._id
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => handleLoadWorkflow(workflow)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium truncate">
                                {workflow.name}
                              </h4>
                              {currentWorkflow?.id === workflow._id && (
                                <Badge variant="default" className="text-xs">
                                  Active
                                </Badge>
                              )}
                            </div>
                            
                            {workflow.description && (
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {workflow.description}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-1">
                                  <FileText className="w-3 h-3" />
                                  <span>{workflow.definition?.nodes?.length || 0} nodes</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <span>•</span>
                                  <span>{workflow.definition?.edges?.length || 0} connections</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div>Created: {workflow.created_at ? new Date(workflow.created_at).toLocaleDateString() : 'Unknown'}</div>
                                {workflow.updated_at && workflow.updated_at !== workflow.created_at && (
                                  <div>Modified: {new Date(workflow.updated_at).toLocaleDateString()}</div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Action buttons */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center space-x-1">
                              {workflow._id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (workflow._id && confirm('Are you sure you want to delete this workflow?')) {
                                    handleDeleteWorkflow(workflow._id);
                                  }
                                }}
                                className="p-1 h-auto text-muted-foreground hover:text-red-500"
                                title="Delete workflow"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workflow Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            nodeTypes={nodeTypes}
          >
            <Background />
            <MiniMap />
            <Controls />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
