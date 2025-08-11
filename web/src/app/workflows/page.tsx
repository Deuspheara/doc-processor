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
  id?: string;
  name: string;
  description: string;
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
      id: workflow.id,
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
      if (success && currentWorkflow?.id === workflowId) {
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
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Workflow Builder</h1>
            <p className="text-gray-600">Design custom document processing workflows</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRunWorkflow}
              disabled={isExecuting || !currentWorkflow?.id}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2 inline" />
                  Run
                </>
              )}
            </button>
            
            <button
              onClick={handleSaveWorkflow}
              disabled={loading || !currentWorkflow?.name}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4 mr-2 inline" />
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Workflow Info */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Workflow name"
            value={currentWorkflow?.name || ''}
            onChange={(e) => setCurrentWorkflow(prev => ({
              ...prev!,
              name: e.target.value,
              description: prev?.description || '',
              definition: prev?.definition || { nodes: [], edges: [] }
            }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <input
            type="text"
            placeholder="Description (optional)"
            value={currentWorkflow?.description || ''}
            onChange={(e) => setCurrentWorkflow(prev => ({
              ...prev!,
              name: prev?.name || '',
              description: e.target.value,
              definition: prev?.definition || { nodes: [], edges: [] }
            }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r p-4 overflow-y-auto">
          {/* Node Types */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Components</h3>
            <div className="space-y-2">
              {availableNodeTypes.map((nodeType) => (
                <button
                  key={nodeType.id}
                  onClick={() => addNode(nodeType.id, nodeType.name)}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300"
                >
                  <div className="flex items-center space-x-3">
                    <Plus className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{nodeType.name}</p>
                      <p className="text-sm text-gray-600">{nodeType.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Saved Workflows */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FolderOpen className="w-5 h-5 mr-2 text-gray-600" />
                Saved Workflows
                {workflows.length > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {workflows.length}
                  </span>
                )}
              </h3>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-2 text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-sm">Loading workflows...</span>
                  </div>
                </div>
              ) : workflows.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm font-medium">No saved workflows yet</p>
                  <p className="text-gray-400 text-xs mt-1">Create your first workflow to get started</p>
                </div>
              ) : (
                workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className={`group relative border rounded-lg transition-all hover:shadow-md ${
                      currentWorkflow?.id === workflow.id
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <button
                      onClick={() => handleLoadWorkflow(workflow)}
                      className="w-full text-left p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900 truncate">
                              {workflow.name}
                            </h4>
                            {currentWorkflow?.id === workflow.id && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Active
                              </span>
                            )}
                          </div>
                          
                          {workflow.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {workflow.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
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
                      </div>
                    </button>
                    
                    {/* Action buttons - shown on hover */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center space-x-1">
                        {workflow.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (workflow.id && confirm('Are you sure you want to delete this workflow?')) {
                                handleDeleteWorkflow(workflow.id);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Delete workflow"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
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
