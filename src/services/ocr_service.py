"""
Service layer for Mistral OCR integration.

This module handles all interactions with the Mistral OCR API,
including file processing, error handling, and result formatting.
"""

import base64
import time
from typing import Dict, Any

import httpx
from fastapi import HTTPException

from ..config import settings


class MistralOCRService:
    """
    Service for interacting with Mistral OCR API.
    
    Handles document text extraction using Mistral's OCR capabilities,
    supporting various file formats including PDF and images.
    """
    
    def __init__(self):
        if not settings.mistral_api_key:
            raise ValueError("MISTRAL_API_KEY not configured")
    
    async def extract_text(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """
        Extract text from document using Mistral OCR.
        
        Args:
            file_content: Raw bytes of the file to process
            filename: Original filename (used to determine content type)
            
        Returns:
            Dictionary containing extracted text, processing time, and metadata
            
        Raises:
            HTTPException: If OCR processing fails or API key is invalid
        """
        start_time = time.time()
        
        # Determine content type based on filename
        content_type = self._get_content_type(filename)
        
        # Encode file content to base64
        base64_content = base64.b64encode(file_content).decode('utf-8')
        data_url = f"data:{content_type};base64,{base64_content}"
        
        # Prepare API request
        headers = {
            "Authorization": f"Bearer {settings.mistral_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": settings.mistral_model,
            "document": {
                "type": "document_url",
                "document_url": data_url
            },
            "include_image_base64": True,
            "image_limit": 10
        }
        
        # Make API call
        async with httpx.AsyncClient(timeout=settings.ocr_timeout_seconds) as client:
            try:
                response = await client.post(
                    settings.mistral_ocr_url,
                    headers=headers,
                    json=payload
                )
                
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Mistral OCR failed: {response.text}"
                    )
                
                result = response.json()
                processing_time = time.time() - start_time
                
                # Extract and format text
                text_parts = []
                page_count = 0
                
                if "pages" in result:
                    page_count = len(result["pages"])
                    for page in result["pages"]:
                        if "markdown" in page:
                            text_parts.append(page["markdown"])
                
                combined_text = "\n\n".join(text_parts)
                
                return {
                    "text": combined_text,
                    "processing_time": processing_time,
                    "page_count": page_count or 1,
                    "raw_result": result  # For debugging purposes
                }
                
            except httpx.TimeoutException:
                raise HTTPException(
                    status_code=408,
                    detail=f"OCR processing timed out after {settings.ocr_timeout_seconds} seconds"
                )
            except httpx.RequestError as e:
                raise HTTPException(
                    status_code=503,
                    detail=f"OCR service unavailable: {str(e)}"
                )
    
    def _get_content_type(self, filename: str) -> str:
        """
        Determine MIME type from filename.
        
        Args:
            filename: Name of the file
            
        Returns:
            MIME type string
        """
        if not filename:
            return "application/pdf"
        
        extension = filename.lower().split('.')[-1]
        
        content_type_map = {
            'pdf': 'application/pdf',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'webp': 'image/webp'
        }
        
        return content_type_map.get(extension, 'application/pdf')
    
    @staticmethod
    def validate_file_type(content_type: str) -> bool:
        """
        Validate if the file type is supported.
        
        Args:
            content_type: MIME type of the file
            
        Returns:
            True if supported, False otherwise
        """
        supported_types = {
            'application/pdf',
            'image/png',
            'image/jpeg', 
            'image/jpg',
            'image/webp'
        }
        
        return (
            content_type in supported_types or
            content_type.startswith('image/')
        )
    
    @staticmethod
    def validate_file_size(file_content: bytes) -> float:
        """
        Validate file size and return size in MB.
        
        Args:
            file_content: Raw file bytes
            
        Returns:
            File size in megabytes
            
        Raises:
            HTTPException: If file is too large
        """
        size_mb = len(file_content) / (1024 * 1024)
        
        if size_mb > settings.max_file_size_mb:
            raise HTTPException(
                status_code=413,
                detail=f"File too large: {size_mb:.1f}MB. Maximum allowed: {settings.max_file_size_mb}MB"
            )
        
        return size_mb

    async def extract_text_from_bytes(self, file_content: bytes, content_type: str, language: str = None) -> str:
        """
        Extract text from document bytes - simplified version for workflow engine.
        
        Args:
            file_content: Raw bytes of the file to process
            content_type: MIME type of the file
            language: Language hint for OCR (currently not used by Mistral but kept for compatibility)
            
        Returns:
            Extracted text as string
            
        Raises:
            HTTPException: If OCR processing fails
        """
        # Use the main extract_text method with a dummy filename
        filename = "document.pdf" if content_type == "application/pdf" else "document.png"
        result = await self.extract_text(file_content, filename)
        
        # Note: Mistral OCR doesn't currently support language hints in the API
        # The language parameter is accepted for interface compatibility
        if language and language != 'auto':
            # Could log or store language preference for future use
            pass
            
        return result["text"]


# Alias for backward compatibility
OCRService = MistralOCRService
