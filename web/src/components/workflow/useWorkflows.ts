import { useState, useEffect, useCallback } from 'react';
import { Edge } from '@xyflow/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

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
  description?: string;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use Convex queries and mutations
  const workflows = useQuery(api.workflows.list, {}) || [];
  const createWorkflow = useMutation(api.workflows.create);
  const updateWorkflow = useMutation(api.workflows.update);
  const deleteWorkflowMutation = useMutation(api.workflows.remove);

  const saveWorkflow = useCallback(async (workflow: Workflow): Promise<string | null> => {
    try {
      setLoading(true);
      setError(null);
      
      if (workflow.id) {
        // Update existing workflow
        await updateWorkflow({
          id: workflow.id as Id<"workflows">,
          name: workflow.name,
          description: workflow.description,
          definition: workflow.definition,
          is_active: true,
        });
        return workflow.id;
      } else {
        // Create new workflow
        const id = await createWorkflow({
          name: workflow.name,
          description: workflow.description,
          definition: workflow.definition,
          is_active: true,
        });
        return id;
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
      setError(error instanceof Error ? error.message : 'Failed to save workflow');
      return null;
    } finally {
      setLoading(false);
    }
  }, [createWorkflow, updateWorkflow]);

  const deleteWorkflow = useCallback(async (workflowId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await deleteWorkflowMutation({ id: workflowId as Id<"workflows"> });
      return true;
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete workflow');
      return false;
    } finally {
      setLoading(false);
    }
  }, [deleteWorkflowMutation]);

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

  return {
    workflows,
    loading,
    error,
    saveWorkflow,
    deleteWorkflow,
    executeWorkflow,
    getWorkflowExecutions,
    validateWorkflow,
  };
}
