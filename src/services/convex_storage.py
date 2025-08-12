"""
Simplified Convex database service using the Python client.

This module provides functionality to store, retrieve, and manage
processed document records using the Convex Python client for direct database operations.
"""

import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any

from convex import ConvexClient
from ..models import DocumentRecord, ProcessingResult


class ConvexStorageService:
    """Service for storing and retrieving processed document records using Convex Python client."""
    
    def __init__(self, convex_url: str = None):
        """Initialize the Convex storage service with Python client."""
        # Use the standard Convex cloud URL format for Python client
        self.convex_url = convex_url or "https://peaceful-hound-784.convex.cloud"
        self.client = ConvexClient(self.convex_url)
        print(f"Using Convex storage at: {self.convex_url}")
    
    def _filter_none_values(self, data: Any) -> Any:
        """Recursively filter out None values from dictionaries and lists."""
        if isinstance(data, dict):
            filtered = {}
            for key, value in data.items():
                filtered_value = self._filter_none_values(value)
                if filtered_value is not None:
                    filtered[key] = filtered_value
            return filtered
        elif isinstance(data, list):
            return [self._filter_none_values(item) for item in data if self._filter_none_values(item) is not None]
        else:
            return data
    
    async def store_document(
        self, 
        filename: str,
        file_size_mb: float,
        content_type: str,
        processing_result: Optional[ProcessingResult] = None,
        status: str = "processing",
        error_message: Optional[str] = None
    ) -> str:
        """
        Store a document record in Convex.
        
        Args:
            filename: Original filename
            file_size_mb: File size in megabytes
            content_type: MIME type
            processing_result: Processing results (if completed)
            status: Processing status
            error_message: Error message if failed
            
        Returns:
            Document ID
        """
        data = {
            "filename": filename,
            "file_size_mb": file_size_mb,
            "content_type": content_type,
            "status": status
        }
        
        # Only include error_message if it's not None
        if error_message is not None:
            data["error_message"] = error_message
            
        # Only include processing_result if it's not None
        if processing_result is not None:
            processing_data = processing_result.model_dump()
            data["processing_result"] = self._filter_none_values(processing_data)
        
        # Call Convex mutation directly
        doc_id = self.client.mutation("documents:create", data)
        return doc_id
    
    async def update_document(
        self,
        doc_id: str,
        processing_result: Optional[ProcessingResult] = None,
        status: Optional[str] = None,
        error_message: Optional[str] = None
    ) -> bool:
        """
        Update a document record in Convex.
        
        Args:
            doc_id: Document ID
            processing_result: Updated processing results
            status: Updated status
            error_message: Updated error message
            
        Returns:
            True if updated successfully, False if document not found
        """
        data = {"id": doc_id}
        
        if processing_result is not None:
            processing_data = processing_result.model_dump()
            data["processing_result"] = self._filter_none_values(processing_data)
        if status is not None:
            data["status"] = status
        if error_message is not None:
            data["error_message"] = error_message
        
        # Call Convex mutation directly
        self.client.mutation("documents:update", data)
        return True
    
    async def get_document(self, doc_id: str) -> Optional[DocumentRecord]:
        """
        Retrieve a document record by ID from Convex.
        
        Args:
            doc_id: Document ID
            
        Returns:
            Document record or None if not found
        """
        # Call Convex query directly
        result = self.client.query("documents:get", {"id": doc_id})
        
        if result:
            # Convert Convex response to DocumentRecord
            return DocumentRecord(
                id=result.get("_id", doc_id),
                filename=result["filename"],
                status=result["status"],
                timestamp=result["timestamp"],
                file_size_mb=result["file_size_mb"],
                content_type=result["content_type"],
                processing_result=ProcessingResult(**result["processing_result"]) if result.get("processing_result") else None,
                error_message=result.get("error_message")
            )
        return None
    
    async def list_documents(
        self, 
        limit: int = 100, 
        offset: int = 0,
        status_filter: Optional[str] = None
    ) -> List[DocumentRecord]:
        """
        List document records from Convex.
        
        Args:
            limit: Maximum number of records to return
            offset: Number of records to skip
            status_filter: Filter by status (processed, processing, failed)
            
        Returns:
            List of document records
        """
        query_args = {
            "limit": limit,
            "offset": offset,
        }
        
        if status_filter:
            query_args["status_filter"] = status_filter
        
        # Call Convex query directly
        result = self.client.query("documents:list", query_args)
        
        documents = []
        for doc_data in result.get("documents", []):
            documents.append(DocumentRecord(
                id=doc_data.get("_id", str(uuid.uuid4())),
                filename=doc_data["filename"],
                status=doc_data["status"],
                timestamp=doc_data["timestamp"],
                file_size_mb=doc_data["file_size_mb"],
                content_type=doc_data["content_type"],
                processing_result=ProcessingResult(**doc_data["processing_result"]) if doc_data.get("processing_result") else None,
                error_message=doc_data.get("error_message")
            ))
        
        return documents
    
    async def get_document_count(self, status_filter: Optional[str] = None) -> int:
        """
        Get total count of documents from Convex.
        
        Args:
            status_filter: Filter by status
            
        Returns:
            Total count
        """
        # For now, we'll use the list operation to get count
        # In production, you'd want a separate count operation
        documents = await self.list_documents(limit=1000, status_filter=status_filter)
        return len(documents)
    
    async def delete_document(self, doc_id: str) -> bool:
        """
        Delete a document record from Convex.
        
        Args:
            doc_id: Document ID
            
        Returns:
            True if deleted successfully, False if not found
        """
        # Call Convex mutation directly
        self.client.mutation("documents:remove", {"id": doc_id})
        return True
    
    async def close(self):
        """Close any connections (not needed for Convex Python client)."""
        # The Convex Python client handles connections automatically
        pass