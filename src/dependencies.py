"""
Shared dependencies for the Document Processing API.

This module provides dependency injection functions for services,
configuration, and other shared resources used across endpoints.
"""

from typing import Annotated
from fastapi import Depends, HTTPException

from .config import settings
from .services.ocr_service import MistralOCRService  
from .services.extraction_service import ExtractionService


def get_settings():
    """Dependency to get application settings."""
    return settings


def get_ocr_service() -> MistralOCRService:
    """
    Dependency to get OCR service instance.
    
    Returns:
        Configured MistralOCRService instance
        
    Raises:
        HTTPException: If Mistral API key is not configured
    """
    try:
        return MistralOCRService()
    except ValueError as e:
        raise HTTPException(
            status_code=500,
            detail=f"OCR service configuration error: {str(e)}"
        )


def get_extraction_service() -> ExtractionService:
    """
    Dependency to get extraction service instance.
    
    Returns:
        Configured ExtractionService instance
        
    Raises:
        HTTPException: If LangExtract/OpenAI API key is not configured
    """
    try:
        return ExtractionService()
    except ValueError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Extraction service configuration error: {str(e)}"
        )


# Type aliases for dependency injection
SettingsDep = Annotated[type(settings), Depends(get_settings)]
OCRServiceDep = Annotated[MistralOCRService, Depends(get_ocr_service)]
ExtractionServiceDep = Annotated[ExtractionService, Depends(get_extraction_service)]
