"""
Pydantic models and schemas for the Document Processing API.

This module defines all request/response models and data structures
used throughout the API, ensuring type safety and validation.
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from enum import Enum


class ModelType(str, Enum):
    """Supported LLM model types for information extraction."""
    OPENAI = "openai"
    GEMINI = "gemini" 
    OLLAMA = "ollama"


class ExtractionEntity(BaseModel):
    """
    Represents an extracted entity from a document.
    
    This model defines the structure for individual pieces of information
    extracted from documents, including their type, text, and metadata.
    """
    extraction_class: str = Field(
        ..., 
        description="Type/class of the entity (e.g., 'invoice_number', 'vendor_name')",
        example="invoice_number"
    )
    extraction_text: str = Field(
        ..., 
        description="Exact text extracted from the source document",
        example="INV-2024-001"
    )
    attributes: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional attributes and metadata for the entity",
        example={"confidence": 0.95, "currency": "USD"}
    )
    start_char: Optional[int] = Field(
        None,
        description="Starting character position in the source text"
    )
    end_char: Optional[int] = Field(
        None,
        description="Ending character position in the source text"
    )


class ExtractionExample(BaseModel):
    """
    Example for few-shot learning in information extraction.
    
    Provides sample text and expected extractions to guide the AI model
    in understanding what information to extract and how to structure it.
    """
    text: str = Field(
        ...,
        description="Sample text for the extraction example",
        example="Invoice #12345 from ABC Company. Total: $1,250.00"
    )
    extractions: List[ExtractionEntity] = Field(
        ...,
        description="List of expected extractions for this text sample"
    )


class ExtractionRequest(BaseModel):
    """
    Configuration for information extraction from text.
    
    Defines what information to extract, how to extract it using examples,
    and which AI model to use for the extraction process.
    """
    model_config = {'protected_namespaces': ()}
    
    prompt_description: str = Field(
        ...,
        description="Clear description of what information to extract",
        example="Extract key invoice information including vendor details, amounts, and dates"
    )
    examples: List[ExtractionExample] = Field(
        ...,
        description="Few-shot examples to guide the extraction process",
        min_items=1
    )
    model_type: ModelType = Field(
        ModelType.OPENAI,
        description="LLM model type to use for extraction"
    )
    model_id: str = Field(
        "gpt-4o",
        description="Specific model ID within the chosen model type",
        example="gpt-4o"
    )


class OCRResult(BaseModel):
    """
    Result from OCR processing of a document.
    
    Contains the extracted text along with processing metadata.
    """
    text: str = Field(
        ...,
        description="Extracted text from the document"
    )
    processing_time: float = Field(
        ...,
        description="Time taken to process the document (seconds)",
        example=2.45
    )
    page_count: int = Field(
        ...,
        description="Number of pages processed",
        example=3
    )


class ExtractionResult(BaseModel):
    """
    Result from information extraction processing.
    
    Contains extracted entities along with processing metadata.
    """
    entities: List[ExtractionEntity] = Field(
        ...,
        description="List of extracted entities from the text"
    )
    metadata: Dict[str, Any] = Field(
        ...,
        description="Metadata about the extraction process"
    )


class ProcessingResult(BaseModel):
    """
    Complete result from document processing pipeline.
    
    Combines OCR results with information extraction results,
    providing a comprehensive view of the document processing.
    """
    ocr_text: str = Field(
        ...,
        description="Complete text extracted from the document via OCR"
    )
    extracted_entities: List[ExtractionEntity] = Field(
        ...,
        description="Structured information extracted from the OCR text"
    )
    extraction_metadata: Dict[str, Any] = Field(
        ...,
        description="Metadata about the extraction process"
    )
    processing_stats: Dict[str, Any] = Field(
        ...,
        description="Statistics about the overall processing pipeline",
        example={
            "ocr_processing_time": 2.45,
            "page_count": 3,
            "text_length": 1523,
            "entity_count": 5,
            "file_size_mb": 2.1
        }
    )


class HealthResponse(BaseModel):
    """
    API health check response.
    
    Provides information about the API status and configuration.
    """
    status: str = Field(
        ...,
        description="Overall API status",
        example="healthy"
    )
    mistral_api_configured: bool = Field(
        ...,
        description="Whether Mistral API key is configured"
    )
    langextract_api_configured: bool = Field(
        ...,
        description="Whether LangExtract/OpenAI API key is configured"
    )
    available_endpoints: List[str] = Field(
        ...,
        description="List of available API endpoints"
    )


class ErrorResponse(BaseModel):
    """
    Standardized error response.
    
    Provides consistent error information across all endpoints.
    """
    detail: str = Field(
        ...,
        description="Human-readable error message"
    )
    error_code: Optional[str] = Field(
        None,
        description="Machine-readable error code"
    )
    timestamp: Optional[str] = Field(
        None,
        description="ISO timestamp when the error occurred"
    )


class FileInfo(BaseModel):
    """
    Information about an uploaded file.
    
    Provides metadata about files being processed.
    """
    filename: str = Field(
        ...,
        description="Original filename"
    )
    size_mb: float = Field(
        ...,
        description="File size in megabytes"
    )
    content_type: str = Field(
        ...,
        description="MIME type of the file"
    )
    

class TestOCRResponse(BaseModel):
    """
    Response from the test OCR endpoint.
    
    Includes both processing results and debugging information.
    """
    success: bool = Field(
        ...,
        description="Whether the OCR test was successful"
    )
    text_preview: Optional[str] = Field(
        None,
        description="Preview of the extracted text (first 500 characters)"
    )
    full_text_length: Optional[int] = Field(
        None,
        description="Total length of the extracted text"
    )
    processing_time: Optional[float] = Field(
        None,
        description="Time taken for processing (seconds)"
    )
    page_count: Optional[int] = Field(
        None,
        description="Number of pages processed"
    )
    file_info: FileInfo = Field(
        ...,
        description="Information about the processed file"
    )
    error: Optional[str] = Field(
        None,
        description="Error message if processing failed"
    )
    error_type: Optional[str] = Field(
        None,
        description="Type of error that occurred"
    )


class DocumentRecord(BaseModel):
    """
    Stored document processing record.
    
    Represents a processed document with its results and metadata.
    """
    id: str = Field(
        ...,
        description="Unique document identifier"
    )
    filename: str = Field(
        ...,
        description="Original filename of the processed document"
    )
    status: str = Field(
        ...,
        description="Processing status: processed, processing, failed",
        example="processed"
    )
    timestamp: str = Field(
        ...,
        description="ISO timestamp when processing was completed"
    )
    file_size_mb: float = Field(
        ...,
        description="File size in megabytes"
    )
    content_type: str = Field(
        ...,
        description="MIME type of the original file"
    )
    processing_result: Optional[ProcessingResult] = Field(
        None,
        description="Complete processing results (null if still processing or failed)"
    )
    error_message: Optional[str] = Field(
        None,
        description="Error message if processing failed"
    )


class DocumentListResponse(BaseModel):
    """
    Response for listing processed documents.
    """
    documents: List[DocumentRecord] = Field(
        ...,
        description="List of processed document records"
    )
    total_count: int = Field(
        ...,
        description="Total number of documents"
    )
