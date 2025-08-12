"""
Convex workflow storage service using the Python client.

This module provides functionality to store, retrieve, and manage
workflow records using the Convex Python client for direct database operations.
"""

import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any

from convex import ConvexClient


class ConvexWorkflowStorageService:
    """Service for managing workflows and workflow executions using Convex Python client."""
    
    def __init__(self, convex_url: str = None):
        """Initialize the Convex workflow storage service with Python client."""
        # Use the standard Convex cloud URL format for Python client
        self.convex_url = convex_url or "https://peaceful-hound-784.convex.cloud"
        self.client = ConvexClient(self.convex_url)
        print(f"Using Convex workflow storage at: {self.convex_url}")
    
    # WORKFLOW OPERATIONS
    
    async def create_workflow(
        self, 
        name: str,
        description: str = None,
        definition: Dict[str, Any] = None,
        is_active: bool = True
    ) -> str:
        """
        Create a new workflow in Convex.
        
        Args:
            name: Workflow name
            description: Optional workflow description
            definition: Workflow definition (nodes, edges, etc.)
            is_active: Whether the workflow is active
            
        Returns:
            Workflow ID
        """
        data = {
            "name": name,
            "is_active": is_active
        }
        
        if description is not None:
            data["description"] = description
        if definition is not None:
            data["definition"] = definition
        
        # Call Convex mutation directly
        workflow_id = self.client.mutation("workflows:create", data)
        return workflow_id
    
    async def get_workflow(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a workflow by ID from Convex.
        
        Args:
            workflow_id: Workflow ID
            
        Returns:
            Workflow record or None if not found
        """
        # Call Convex query directly
        result = self.client.query("workflows:get", {"id": workflow_id})
        return result
    
    async def list_workflows(self, is_active: Optional[bool] = None) -> List[Dict[str, Any]]:
        """
        List workflows from Convex.
        
        Args:
            is_active: Filter by active status
            
        Returns:
            List of workflow records
        """
        query_args = {}
        if is_active is not None:
            query_args["is_active"] = is_active
        
        # Call Convex query directly
        result = self.client.query("workflows:list", query_args)
        return result
    
    async def update_workflow(
        self,
        workflow_id: str,
        name: str = None,
        description: str = None,
        definition: Dict[str, Any] = None,
        is_active: bool = None
    ) -> bool:
        """
        Update a workflow in Convex.
        
        Args:
            workflow_id: Workflow ID
            name: Updated workflow name
            description: Updated description
            definition: Updated workflow definition
            is_active: Updated active status
            
        Returns:
            True if updated successfully
        """
        data = {"id": workflow_id}
        
        if name is not None:
            data["name"] = name
        if description is not None:
            data["description"] = description
        if definition is not None:
            data["definition"] = definition
        if is_active is not None:
            data["is_active"] = is_active
        
        # Call Convex mutation directly
        self.client.mutation("workflows:update", data)
        return True
    
    async def delete_workflow(self, workflow_id: str) -> bool:
        """
        Delete a workflow from Convex.
        
        Args:
            workflow_id: Workflow ID
            
        Returns:
            True if deleted successfully
        """
        # Call Convex mutation directly
        self.client.mutation("workflows:remove", {"id": workflow_id})
        return True
    
    # WORKFLOW EXECUTION OPERATIONS
    
    async def create_execution(
        self,
        workflow_id: str,
        input_data: Dict[str, Any] = None,
        status: str = "pending"
    ) -> str:
        """
        Create a new workflow execution in Convex.
        
        Args:
            workflow_id: ID of the workflow to execute
            input_data: Input data for the execution
            status: Initial execution status
            
        Returns:
            Execution ID
        """
        data = {
            "workflow_id": workflow_id,
            "status": status
        }
        
        if input_data is not None:
            data["input_data"] = input_data
        
        # Call Convex mutation directly
        execution_id = self.client.mutation("workflows:createExecution", data)
        return execution_id
    
    async def get_execution(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a workflow execution by ID from Convex.
        
        Args:
            execution_id: Execution ID
            
        Returns:
            Execution record or None if not found
        """
        # Call Convex query directly
        result = self.client.query("workflows:getExecution", {"id": execution_id})
        return result
    
    async def list_executions(
        self, 
        workflow_id: str = None,
        status: str = None
    ) -> List[Dict[str, Any]]:
        """
        List workflow executions from Convex.
        
        Args:
            workflow_id: Filter by workflow ID
            status: Filter by execution status
            
        Returns:
            List of execution records
        """
        query_args = {}
        if workflow_id is not None:
            query_args["workflow_id"] = workflow_id
        if status is not None:
            query_args["status"] = status
        
        # Call Convex query directly
        result = self.client.query("workflows:listExecutions", query_args)
        return result
    
    async def update_execution(
        self,
        execution_id: str,
        status: str = None,
        output_data: Dict[str, Any] = None,
        error_message: str = None,
        completed_at: str = None
    ) -> bool:
        """
        Update a workflow execution in Convex.
        
        Args:
            execution_id: Execution ID
            status: Updated execution status
            output_data: Execution output data
            error_message: Error message if failed
            completed_at: Completion timestamp
            
        Returns:
            True if updated successfully
        """
        data = {"id": execution_id}
        
        if status is not None:
            data["status"] = status
        if output_data is not None:
            data["output_data"] = output_data
        if error_message is not None:
            data["error_message"] = error_message
        if completed_at is not None:
            data["completed_at"] = completed_at
        
        # Call Convex mutation directly
        self.client.mutation("workflows:updateExecution", data)
        return True
    
    async def close(self):
        """Close any connections (not needed for Convex Python client)."""
        # The Convex Python client handles connections automatically
        pass