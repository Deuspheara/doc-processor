import { useState, useEffect, useCallback } from 'react';
import { Edge } from '@xyflow/react';

interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    config?: Record<string, unknown>;
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

interface WorkflowExecution {
  id: string;
  status: string;
  started_at: string;
  completed_at?: string;
  error_message?: string;
  input_file_count: number;
}

interface ExecutionResult {
  execution_id: string;
  status: string;
  result: any;
  summary: {
    total_nodes: number;
    successful_nodes: number;
    failed_nodes: number;
    success_rate: number;
  };
  completed_at: string;
}

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/workflows');
      if (!response.ok) {
        throw new Error(`Failed to load workflows: ${response.statusText}`);
      }
      
      const data = await response.json();
      setWorkflows(data);
    } catch (error) {
      console.error('Failed to load workflows:', error);
      setError(error instanceof Error ? error.message : 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveWorkflow = useCallback(async (workflow: Workflow): Promise<string | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const url = workflow.id ? `/api/workflows/${workflow.id}` : '/api/workflows';
      const method = workflow.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflow),
      });

      if (!response.ok) {
        throw new Error(`Failed to save workflow: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Reload workflows to get updated list
      await loadWorkflows();
      
      return result.id;
    } catch (error) {
      console.error('Failed to save workflow:', error);
      setError(error instanceof Error ? error.message : 'Failed to save workflow');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadWorkflows]);

  const deleteWorkflow = useCallback(async (workflowId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete workflow: ${response.statusText}`);
      }
      
      // Reload workflows to get updated list
      await loadWorkflows();
      
      return true;
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete workflow');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadWorkflows]);

  const executeWorkflow = useCallback(async (workflowId: string, files?: File[]): Promise<ExecutionResult | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const formData = new FormData();
      if (files && files.length > 0) {
        files.forEach(file => formData.append('files', file));
      }

      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Workflow execution failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result as ExecutionResult;
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      setError(error instanceof Error ? error.message : 'Failed to execute workflow');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getWorkflowExecutions = useCallback(async (workflowId: string): Promise<WorkflowExecution[]> => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/executions`);
      if (!response.ok) {
        throw new Error(`Failed to load executions: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to load executions:', error);
      return [];
    }
  }, []);

  const validateWorkflow = useCallback(async (definition: { nodes: WorkflowNode[]; edges: Edge[] }) => {
    try {
      const response = await fetch('/api/workflows/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(definition),
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to validate workflow:', error);
      return {
        is_valid: false,
        errors: ['Failed to validate workflow'],
        warnings: [],
        node_count: definition.nodes.length,
        edge_count: definition.edges.length
      };
    }
  }, []);

  // Load workflows on mount
  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  return {
    workflows,
    loading,
    error,
    loadWorkflows,
    saveWorkflow,
    deleteWorkflow,
    executeWorkflow,
    getWorkflowExecutions,
    validateWorkflow,
  };
}
