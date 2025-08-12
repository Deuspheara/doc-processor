from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
import json
import uuid

from ..services.workflow_engine import WorkflowEngine
from ..services.convex_workflow_storage import ConvexWorkflowStorageService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/workflows", tags=["workflows"])

# Initialize Convex workflow storage service
workflow_storage = ConvexWorkflowStorageService()

@router.post("/", response_model=Dict[str, Any])
async def create_workflow(workflow_data: Dict[str, Any]):
    """Create a new workflow"""
    try:
        workflow_id = await workflow_storage.create_workflow(
            name=workflow_data['name'],
            description=workflow_data.get('description', ''),
            definition=workflow_data['definition'],
            is_active=True
        )
        
        logger.info(f"Created workflow: {workflow_id} - {workflow_data['name']}")
        return {"id": workflow_id, "message": "Workflow created successfully"}
        
    except Exception as e:
        logger.error(f"Failed to create workflow: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create workflow: {str(e)}")

@router.get("/", response_model=List[Dict[str, Any]])
async def list_workflows():
    """Get all workflows"""
    try:
        workflows_data = await workflow_storage.list_workflows(is_active=True)
        
        workflows = []
        for workflow in workflows_data:
            workflows.append({
                "id": workflow['_id'],
                "name": workflow['name'],
                "description": workflow.get('description', ''),
                "created_at": workflow['created_at'],
                "updated_at": workflow.get('updated_at'),
                "definition": workflow.get('definition', {"nodes": [], "edges": []}),
                "node_count": len(workflow['definition'].get('nodes', [])) if workflow.get('definition') else 0
            })
        
        return workflows
        
    except Exception as e:
        logger.error(f"Failed to list workflows: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list workflows: {str(e)}")

@router.get("/{workflow_id}", response_model=Dict[str, Any])
async def get_workflow(workflow_id: str):
    """Get a specific workflow"""
    try:
        if workflow_id not in workflows_db:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        workflow = workflows_db[workflow_id]
        
        return {
            "id": workflow['id'],
            "name": workflow['name'],
            "description": workflow['description'],
            "definition": workflow['definition'],
            "created_at": workflow['created_at'],
            "updated_at": workflow['updated_at']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get workflow {workflow_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get workflow: {str(e)}")

@router.put("/{workflow_id}", response_model=Dict[str, Any])
async def update_workflow(workflow_id: str, workflow_data: Dict[str, Any]):
    """Update an existing workflow"""
    try:
        if workflow_id not in workflows_db:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        workflow = workflows_db[workflow_id]
        workflow.update({
            'name': workflow_data.get('name', workflow['name']),
            'description': workflow_data.get('description', workflow['description']),
            'definition': workflow_data.get('definition', workflow['definition']),
            'updated_at': datetime.utcnow().isoformat()
        })
        
        workflows_db[workflow_id] = workflow
        
        logger.info(f"Updated workflow: {workflow_id}")
        return {"id": workflow_id, "message": "Workflow updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update workflow {workflow_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update workflow: {str(e)}")

@router.delete("/{workflow_id}", response_model=Dict[str, Any])
async def delete_workflow(workflow_id: str):
    """Delete a workflow (soft delete)"""
    try:
        if workflow_id not in workflows_db:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        workflows_db[workflow_id]['is_active'] = False
        workflows_db[workflow_id]['updated_at'] = datetime.utcnow().isoformat()
        
        logger.info(f"Deleted workflow: {workflow_id}")
        return {"id": workflow_id, "message": "Workflow deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete workflow {workflow_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete workflow: {str(e)}")

@router.post("/{workflow_id}/execute")
async def execute_workflow(workflow_id: str, files: List[UploadFile] = File(default=[])):
    """Execute a workflow"""
    try:
        if workflow_id not in workflows_db:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        workflow = workflows_db[workflow_id]
        
        # Validate that we have files if the workflow requires them
        workflow_definition = workflow.get('definition', {})
        nodes = workflow_definition.get('nodes', [])
        
        # Check if workflow has document-input nodes that require files
        document_input_nodes = [node for node in nodes if node.get('type') == 'document-input']
        if document_input_nodes and not files:
            raise HTTPException(
                status_code=422, 
                detail="This workflow requires document files to be uploaded"
            )
        
        # Create execution record
        execution_id = str(uuid.uuid4())
        execution = {
            'id': execution_id,
            'workflow_id': workflow_id,
            'status': 'running',
            'input_data': {'file_count': len(files)},
            'output_data': None,
            'error_message': None,
            'started_at': datetime.utcnow().isoformat(),
            'completed_at': None
        }
        executions_db[execution_id] = execution
        
        # Process uploaded files if any
        documents = []
        if files:
            for i, file in enumerate(files):
                content = await file.read()
                documents.append({
                    'id': f"{file.filename}_{i}" if file.filename else f"document_{i}",
                    'filename': file.filename or f"document_{i}",
                    'content': content,
                    'content_type': file.content_type or 'application/octet-stream',
                    'metadata': {
                        'filename': file.filename,
                        'size': len(content),
                        'uploaded_at': datetime.utcnow().isoformat()
                    }
                })
        
        # Prepare input data for workflow
        input_data = {
            'documents': documents
        }
        
        # Execute workflow
        engine = WorkflowEngine()
        logger.info(f"Starting execution of workflow {workflow_id} with {len(documents)} documents")
        
        try:
            result = await engine.execute_workflow(workflow['definition'], input_data)
        except Exception as workflow_error:
            logger.error(f"Workflow execution error: {str(workflow_error)}", exc_info=True)
            raise HTTPException(
                status_code=500, 
                detail=f"Workflow execution failed: {str(workflow_error)}"
            )
        
        # Update execution record
        execution['status'] = 'completed' if result['status'] == 'completed' else 'failed'
        execution['output_data'] = result
        execution['completed_at'] = datetime.utcnow().isoformat()
        
        if result['status'] != 'completed':
            execution['error_message'] = f"Workflow execution failed. {result['summary']['failed_nodes']} nodes failed."
        
        executions_db[execution_id] = execution
        
        logger.info(f"Workflow execution {execution_id} completed with status: {execution['status']}")
        
        return {
            "execution_id": execution_id,
            "status": execution['status'],
            "result": result,
            "summary": result.get('summary', {}),
            "completed_at": execution['completed_at']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Workflow execution failed for {workflow_id}: {str(e)}")
        
        # Update execution record with error
        if 'execution_id' in locals():
            execution = executions_db.get(execution_id, {})
            execution.update({
                'status': 'failed',
                'error_message': str(e),
                'completed_at': datetime.utcnow().isoformat()
            })
            executions_db[execution_id] = execution
        
        raise HTTPException(status_code=500, detail=f"Workflow execution failed: {str(e)}")

@router.get("/{workflow_id}/executions", response_model=List[Dict[str, Any]])
async def get_workflow_executions(workflow_id: str):
    """Get execution history for a workflow"""
    try:
        executions = []
        for execution in executions_db.values():
            if execution['workflow_id'] == workflow_id:
                executions.append({
                    "id": execution['id'],
                    "status": execution['status'],
                    "started_at": execution['started_at'],
                    "completed_at": execution['completed_at'],
                    "error_message": execution['error_message'],
                    "input_file_count": execution.get('input_data', {}).get('file_count', 0)
                })
        
        # Sort by started_at descending
        executions.sort(key=lambda x: x['started_at'], reverse=True)
        
        return executions
        
    except Exception as e:
        logger.error(f"Failed to get executions for workflow {workflow_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get executions: {str(e)}")

@router.get("/{workflow_id}/executions/{execution_id}", response_model=Dict[str, Any])
async def get_execution_details(workflow_id: str, execution_id: str):
    """Get detailed results of a specific execution"""
    try:
        if execution_id not in executions_db:
            raise HTTPException(status_code=404, detail="Execution not found")
        
        execution = executions_db[execution_id]
        
        if execution['workflow_id'] != workflow_id:
            raise HTTPException(status_code=404, detail="Execution not found for this workflow")
        
        return {
            "id": execution['id'],
            "workflow_id": execution['workflow_id'],
            "status": execution['status'],
            "started_at": execution['started_at'],
            "completed_at": execution['completed_at'],
            "error_message": execution['error_message'],
            "input_data": execution['input_data'],
            "output_data": execution['output_data']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get execution details {execution_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get execution details: {str(e)}")

@router.post("/validate", response_model=Dict[str, Any])
async def validate_workflow(workflow_definition: Dict[str, Any]):
    """Validate a workflow definition without executing it"""
    try:
        nodes = workflow_definition.get('nodes', [])
        edges = workflow_definition.get('edges', [])
        
        # Basic validation
        errors = []
        warnings = []
        
        if not nodes:
            errors.append("Workflow must have at least one node")
        
        # Check for isolated nodes (no connections)
        connected_nodes = set()
        for edge in edges:
            connected_nodes.add(edge['source'])
            connected_nodes.add(edge['target'])
        
        isolated_nodes = [node['id'] for node in nodes if node['id'] not in connected_nodes and len(nodes) > 1]
        if isolated_nodes:
            warnings.append(f"Isolated nodes found: {', '.join(isolated_nodes)}")
        
        # Check for unknown node types
        valid_node_types = {'document-input', 'ocr-processor', 'ai-extractor', 'data-validator', 'export-data'}
        invalid_types = [node['type'] for node in nodes if node['type'] not in valid_node_types]
        if invalid_types:
            errors.append(f"Unknown node types: {', '.join(set(invalid_types))}")
        
        # Check for cycles (simplified check)
        # More sophisticated cycle detection could be implemented
        
        is_valid = len(errors) == 0
        
        return {
            "is_valid": is_valid,
            "errors": errors,
            "warnings": warnings,
            "node_count": len(nodes),
            "edge_count": len(edges)
        }
        
    except Exception as e:
        logger.error(f"Failed to validate workflow: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to validate workflow: {str(e)}")

# Health check for workflow service
@router.get("/health", response_model=Dict[str, str])
async def workflow_health():
    """Health check for workflow service"""
    try:
        workflows = await workflow_storage.list_workflows(is_active=True)
        executions = await workflow_storage.list_executions()
        return {
            "status": "healthy",
            "service": "workflow_service",
            "workflows_count": str(len(workflows)),
            "executions_count": str(len(executions))
        }
    except Exception as e:
        return {
            "status": "error",
            "service": "workflow_service",
            "error": str(e)
        }
