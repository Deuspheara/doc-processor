"""
OCR-related API endpoints.

This module contains all endpoints related to optical character recognition,
including OCR-only processing and testing functionality.
"""

from fastapi import APIRouter, File, UploadFile, HTTPException
from typing import Dict, Any

from ..dependencies import OCRServiceDep, SettingsDep
from ..models import OCRResult, TestOCRResponse, FileInfo
from ..services.ocr_service import MistralOCRService

router = APIRouter(
    prefix="/ocr",
    tags=["OCR"],
    responses={
        400: {"description": "Bad request - invalid file or configuration"},
        413: {"description": "File too large"},
        500: {"description": "Internal server error"},
        503: {"description": "OCR service unavailable"}
    }
)


@router.post(
    "/extract",
    response_model=OCRResult,
    summary="Extract text from document",
    description="""
    Extract text from a document using Mistral OCR.
    
    Supported file formats:
    - PDF documents
    - Images: PNG, JPG, JPEG, WebP
    
    **File size limit:** 50MB
    
    **Processing time:** Typically 2-10 seconds depending on document complexity
    
    **Returns:** Extracted text with processing metadata
    """
)
async def extract_text(
    file: UploadFile = File(..., description="Document file to process"),
    ocr_service: OCRServiceDep = None
):
    """Extract text from document using Mistral OCR only."""
    
    # Validate file type
    if not MistralOCRService.validate_file_type(file.content_type):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. "
                   f"Supported types: PDF, PNG, JPG, JPEG, WebP"
        )
    
    # Read and validate file content
    file_content = await file.read()
    MistralOCRService.validate_file_size(file_content)
    
    # Process with OCR service
    result = await ocr_service.extract_text(file_content, file.filename)
    
    return OCRResult(
        text=result["text"],
        processing_time=result["processing_time"],
        page_count=result["page_count"]
    )


@router.post(
    "/test",
    response_model=TestOCRResponse,
    summary="Test OCR functionality",
    description="""
    Test endpoint to verify OCR functionality with detailed debugging information.
    
    **Use this endpoint to:**
    - Verify your Mistral API key is working
    - Test document processing before using the full pipeline
    - Debug OCR issues with detailed error information
    - Check file format compatibility
    
    **Returns:** OCR result with debugging information and file metadata
    """
)
async def test_ocr(
    file: UploadFile = File(..., description="Document file to test"),
    ocr_service: OCRServiceDep = None,
    settings: SettingsDep = None
):
    """Test OCR functionality with debugging information."""
    
    # Validate file type
    if not MistralOCRService.validate_file_type(file.content_type):
        return TestOCRResponse(
            success=False,
            error=f"Unsupported file type: {file.content_type}",
            error_type="UnsupportedFileType",
            file_info=FileInfo(
                filename=file.filename or "unknown",
                size_mb=0,
                content_type=file.content_type or "unknown"
            )
        )
    
    # Read file content
    file_content = await file.read()
    
    try:
        file_size_mb = MistralOCRService.validate_file_size(file_content)
    except HTTPException as e:
        return TestOCRResponse(
            success=False,
            error=e.detail,
            error_type="FileTooLarge",
            file_info=FileInfo(
                filename=file.filename or "unknown",
                size_mb=len(file_content) / (1024 * 1024),
                content_type=file.content_type or "unknown"
            )
        )
    
    # Create file info
    file_info = FileInfo(
        filename=file.filename or "unknown",
        size_mb=round(file_size_mb, 2),
        content_type=file.content_type or "unknown"
    )
    
    # Attempt OCR processing
    try:
        result = await ocr_service.extract_text(file_content, file.filename)
        
        # Create preview text (first 500 characters)
        text_preview = result["text"]
        if len(text_preview) > 500:
            text_preview = text_preview[:500] + "..."
        
        return TestOCRResponse(
            success=True,
            text_preview=text_preview,
            full_text_length=len(result["text"]),
            processing_time=result["processing_time"],
            page_count=result["page_count"],
            file_info=file_info
        )
        
    except HTTPException as e:
        return TestOCRResponse(
            success=False,
            error=e.detail,
            error_type=e.__class__.__name__,
            file_info=file_info
        )
    except Exception as e:
        return TestOCRResponse(
            success=False,
            error=str(e),
            error_type=e.__class__.__name__,
            file_info=file_info
        )
