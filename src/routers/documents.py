"""
Document management API endpoints.

This module contains endpoints for managing processed documents,
including listing, retrieving, and viewing document results.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from ..models import DocumentRecord, DocumentListResponse, ProcessingResult
from ..services.convex_storage import ConvexStorageService

# Initialize storage service
storage_service = ConvexStorageService()

router = APIRouter(
    prefix="/documents",
    tags=["Document Management"],
    responses={
        404: {"description": "Document not found"},
        500: {"description": "Internal server error"}
    }
)


@router.get(
    "/",
    response_model=DocumentListResponse,
    summary="List processed documents",
    description="""
    Get a list of processed documents with optional filtering.
    
    **Features:**
    - Pagination support with limit and offset
    - Filter by processing status
    - Sorted by processing timestamp (newest first)
    
    **Status Values:**
    - **processed**: Successfully completed processing
    - **processing**: Currently being processed
    - **failed**: Processing failed with errors
    """
)
async def list_documents(
    limit: int = Query(
        default=50,
        ge=1,
        le=500,
        description="Maximum number of documents to return"
    ),
    offset: int = Query(
        default=0,
        ge=0,
        description="Number of documents to skip"
    ),
    status: Optional[str] = Query(
        default=None,
        description="Filter by status: processed, processing, failed"
    )
):
    """List processed documents with pagination and filtering."""
    
    # Validate status filter
    if status and status not in ["processed", "processing", "failed"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid status filter. Must be: processed, processing, or failed"
        )
    
    try:
        documents = await storage_service.list_documents(
            limit=limit,
            offset=offset,
            status_filter=status
        )
        
        total_count = await storage_service.get_document_count(status_filter=status)
        
        return DocumentListResponse(
            documents=documents,
            total_count=total_count
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list documents: {str(e)}"
        )


@router.get(
    "/{document_id}",
    response_model=DocumentRecord,
    summary="Get document by ID",
    description="""
    Retrieve a specific document record by its ID.
    
    **Returns:**
    - Complete document metadata
    - Processing results (if available)
    - Processing statistics and timing
    - Error information (if processing failed)
    """
)
async def get_document(document_id: str):
    """Get a specific document by ID."""
    
    try:
        document = await storage_service.get_document(document_id)
        
        if not document:
            raise HTTPException(
                status_code=404,
                detail=f"Document with ID '{document_id}' not found"
            )
        
        return document
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve document: {str(e)}"
        )


@router.get(
    "/{document_id}/results",
    response_model=ProcessingResult,
    summary="Get document processing results",
    description="""
    Get the processing results for a specific document.
    
    **Returns:**
    - Extracted text from OCR
    - Structured entities extracted from the document
    - Processing metadata and statistics
    - Extraction model information
    
    **Note:** Only returns results for successfully processed documents.
    """
)
async def get_document_results(document_id: str):
    """Get processing results for a specific document."""
    
    try:
        document = await storage_service.get_document(document_id)
        
        if not document:
            raise HTTPException(
                status_code=404,
                detail=f"Document with ID '{document_id}' not found"
            )
        
        if document.status != "processed":
            raise HTTPException(
                status_code=400,
                detail=f"Document processing not completed. Status: {document.status}"
            )
        
        if not document.processing_result:
            raise HTTPException(
                status_code=404,
                detail="No processing results available for this document"
            )
        
        return document.processing_result
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve document results: {str(e)}"
        )


@router.delete(
    "/{document_id}",
    summary="Delete document record",
    description="""
    Delete a document record and its associated data.
    
    **Warning:** This action cannot be undone.
    """
)
async def delete_document(document_id: str):
    """Delete a document record."""
    
    try:
        success = await storage_service.delete_document(document_id)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"Document with ID '{document_id}' not found"
            )
        
        return {"message": f"Document '{document_id}' deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete document: {str(e)}"
        )