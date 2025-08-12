"""
Document storage service for managing processed documents.

This module provides functionality to store, retrieve, and manage
processed document records and their results.
"""

import json
import os
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from pathlib import Path

from ..models import DocumentRecord, ProcessingResult


class DocumentStorageService:
    """Service for storing and retrieving processed document records."""
    
    def __init__(self, storage_dir: str = "processed_documents"):
        """Initialize the document storage service."""
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(exist_ok=True)
        self.metadata_file = self.storage_dir / "metadata.json"
        self._ensure_metadata_file()
    
    def _ensure_metadata_file(self):
        """Ensure metadata file exists with proper structure."""
        if not self.metadata_file.exists():
            self._save_metadata({})
    
    def _load_metadata(self) -> Dict[str, Any]:
        """Load metadata from file."""
        try:
            with open(self.metadata_file, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return {}
    
    def _save_metadata(self, metadata: Dict[str, Any]):
        """Save metadata to file."""
        with open(self.metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2, default=str)
    
    def store_document(
        self, 
        filename: str,
        file_size_mb: float,
        content_type: str,
        processing_result: Optional[ProcessingResult] = None,
        status: str = "processing",
        error_message: Optional[str] = None
    ) -> str:
        """
        Store a document record.
        
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
        doc_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        # Create document record
        document_record = DocumentRecord(
            id=doc_id,
            filename=filename,
            status=status,
            timestamp=timestamp,
            file_size_mb=file_size_mb,
            content_type=content_type,
            processing_result=processing_result,
            error_message=error_message
        )
        
        # Load existing metadata
        metadata = self._load_metadata()
        
        # Store document record
        metadata[doc_id] = document_record.model_dump()
        
        # Save updated metadata
        self._save_metadata(metadata)
        
        return doc_id
    
    def update_document(
        self,
        doc_id: str,
        processing_result: Optional[ProcessingResult] = None,
        status: Optional[str] = None,
        error_message: Optional[str] = None
    ) -> bool:
        """
        Update a document record.
        
        Args:
            doc_id: Document ID
            processing_result: Updated processing results
            status: Updated status
            error_message: Updated error message
            
        Returns:
            True if updated successfully, False if document not found
        """
        metadata = self._load_metadata()
        
        if doc_id not in metadata:
            return False
        
        # Update fields
        if processing_result is not None:
            metadata[doc_id]["processing_result"] = processing_result.model_dump()
        if status is not None:
            metadata[doc_id]["status"] = status
        if error_message is not None:
            metadata[doc_id]["error_message"] = error_message
        
        # Update timestamp
        metadata[doc_id]["timestamp"] = datetime.now().isoformat()
        
        # Save updated metadata
        self._save_metadata(metadata)
        
        return True
    
    def get_document(self, doc_id: str) -> Optional[DocumentRecord]:
        """
        Retrieve a document record by ID.
        
        Args:
            doc_id: Document ID
            
        Returns:
            Document record or None if not found
        """
        metadata = self._load_metadata()
        
        if doc_id not in metadata:
            return None
        
        return DocumentRecord(**metadata[doc_id])
    
    def list_documents(
        self, 
        limit: int = 100, 
        offset: int = 0,
        status_filter: Optional[str] = None
    ) -> List[DocumentRecord]:
        """
        List document records.
        
        Args:
            limit: Maximum number of records to return
            offset: Number of records to skip
            status_filter: Filter by status (processed, processing, failed)
            
        Returns:
            List of document records
        """
        metadata = self._load_metadata()
        
        # Convert to list and sort by timestamp (newest first)
        documents = []
        for doc_data in metadata.values():
            if status_filter and doc_data.get("status") != status_filter:
                continue
            documents.append(DocumentRecord(**doc_data))
        
        # Sort by timestamp (newest first)
        documents.sort(key=lambda d: d.timestamp, reverse=True)
        
        # Apply pagination
        return documents[offset:offset + limit]
    
    def get_document_count(self, status_filter: Optional[str] = None) -> int:
        """
        Get total count of documents.
        
        Args:
            status_filter: Filter by status
            
        Returns:
            Total count
        """
        metadata = self._load_metadata()
        
        if not status_filter:
            return len(metadata)
        
        count = 0
        for doc_data in metadata.values():
            if doc_data.get("status") == status_filter:
                count += 1
        
        return count
    
    def delete_document(self, doc_id: str) -> bool:
        """
        Delete a document record.
        
        Args:
            doc_id: Document ID
            
        Returns:
            True if deleted successfully, False if not found
        """
        metadata = self._load_metadata()
        
        if doc_id not in metadata:
            return False
        
        del metadata[doc_id]
        self._save_metadata(metadata)
        
        return True