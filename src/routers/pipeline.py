"""
Complete document processing pipeline endpoints.

This module contains endpoints for the full document processing pipeline,
combining OCR and information extraction capabilities.
"""

from fastapi import APIRouter, File, UploadFile, Form, HTTPException
import json
from typing import Dict, Any

from ..dependencies import OCRServiceDep, ExtractionServiceDep, SettingsDep
from ..models import ProcessingResult, ExtractionRequest, ExtractionExample, ExtractionEntity
from ..services.ocr_service import MistralOCRService
from ..services.extraction_service import ExtractionService

router = APIRouter(
    prefix="/process",
    tags=["Document Processing"],
    responses={
        400: {"description": "Bad request - invalid file or parameters"},
        413: {"description": "File too large"},
        422: {"description": "Unprocessable entity - OCR extracted insufficient text"},
        500: {"description": "Internal server error"},
        503: {"description": "Service unavailable"}
    }
)


@router.post(
    "/document",
    response_model=ProcessingResult,
    summary="Complete document processing pipeline",
    description="""
    Process a document through the complete pipeline: OCR extraction + Information extraction.
    
    **Pipeline Steps:**
    1. **OCR Processing:** Extract text from document using Mistral OCR
    2. **Text Validation:** Ensure meaningful text was extracted
    3. **Information Extraction:** Extract structured data using LangExtract
    4. **Result Compilation:** Combine all results with processing statistics
    
    **Supported Input Files:**
    - PDF documents (up to 50MB)
    - Images: PNG, JPG, JPEG, WebP (up to 50MB)
    
    **Processing Time:** 
    - Simple documents: 3-15 seconds
    - Complex documents: 15-60 seconds
    
    **Use Cases:**
    - Invoice processing and data extraction
    - Contract analysis and term extraction
    - Form processing and field extraction
    - Receipt digitization and categorization
    """
)
async def process_document(
    file: UploadFile = File(..., description="Document file to process"),
    extraction_request: str = Form(
        ..., 
        description="JSON string containing extraction configuration"
    ),
    ocr_service: OCRServiceDep = None,
    extraction_service: ExtractionServiceDep = None
):
    """Complete pipeline: OCR extraction followed by information extraction."""
    
    # Validate file type
    if not MistralOCRService.validate_file_type(file.content_type):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. "
                   f"Supported: PDF, PNG, JPG, JPEG, WebP"
        )
    
    # Read and validate file content
    file_content = await file.read()
    file_size_mb = MistralOCRService.validate_file_size(file_content)
    
    # Parse and validate extraction parameters
    try:
        extraction_params = json.loads(extraction_request)
        extraction_req = ExtractionRequest(**extraction_params)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Invalid JSON in extraction_request parameter"
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid extraction parameters: {str(e)}"
        )
    
    # Validate examples  
    ExtractionService.validate_examples(extraction_req.examples)
    
    try:
        # Step 1: OCR Processing
        ocr_result = await ocr_service.extract_text(file_content, file.filename)
        
        # Step 2: Validate OCR results
        extracted_text = ocr_result["text"].strip()
        if len(extracted_text) < 10:
            raise HTTPException(
                status_code=422,
                detail="OCR extracted very little text. Please check if the document "
                       "is readable, contains text, or try a higher quality image."
            )
        
        # Step 3: Information Extraction
        extraction_result = extraction_service.extract_information(
            text=extracted_text,
            prompt_description=extraction_req.prompt_description,
            examples=extraction_req.examples,
            model_type=extraction_req.model_type,
            model_id=extraction_req.model_id
        )
        
        # Step 4: Validate and compile results
        try:
            # Validate entities before creating ProcessingResult
            entities = extraction_result["entities"]
            for i, entity in enumerate(entities):
                # Ensure each entity is properly formatted
                if not isinstance(entity, dict):
                    raise ValueError(f"Entity {i} is not a dictionary: {type(entity)}")
                
                # Ensure required fields exist
                if "extraction_class" not in entity:
                    entity["extraction_class"] = "unknown"
                if "extraction_text" not in entity:
                    entity["extraction_text"] = ""
                if "attributes" not in entity or entity["attributes"] is None:
                    entity["attributes"] = {}
                
                # Validate attributes is a dictionary
                if not isinstance(entity["attributes"], dict):
                    entity["attributes"] = {}
            
            # Create the response
            return ProcessingResult(
                ocr_text=extracted_text,
                extracted_entities=[ExtractionEntity(**entity) for entity in entities],
                extraction_metadata=extraction_result["metadata"],
                processing_stats={
                    "ocr_processing_time": ocr_result["processing_time"],
                    "page_count": ocr_result["page_count"],
                    "text_length": len(extracted_text),
                    "entity_count": len(entities),
                    "file_size_mb": round(file_size_mb, 2),
                    "extraction_model": f"{extraction_req.model_type}:{extraction_req.model_id}"
                }
            )
        except Exception as validation_error:
            raise HTTPException(
                status_code=500,
                detail=f"Result validation failed: {str(validation_error)}"
            )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Handle unexpected errors
        raise HTTPException(
            status_code=500,
            detail=f"Document processing failed: {str(e)}"
        )


@router.post(
    "/invoice",
    response_model=ProcessingResult,
    summary="Process invoice document (preset configuration)",
    description="""
    Process an invoice document with predefined extraction configuration.
    
    **Automatically extracts:**
    - Invoice number and date
    - Vendor/supplier information
    - Line items and descriptions
    - Amounts, totals, and tax information
    - Payment terms and due dates
    - Billing and shipping addresses
    
    **Perfect for:**
    - Accounts payable automation
    - Expense management systems
    - Financial data digitization
    - Invoice processing workflows
    
    **No configuration required** - just upload your invoice!
    """
)
async def process_invoice(
    file: UploadFile = File(..., description="Invoice document to process"),
    ocr_service: OCRServiceDep = None,
    extraction_service: ExtractionServiceDep = None
):
    """Process invoice document with predefined extraction configuration."""
    
    # Predefined invoice extraction configuration
    extraction_config = ExtractionRequest(
        prompt_description="""
        Extract comprehensive invoice information including:
        - Invoice identification (number, date, reference)
        - Vendor/supplier details (name, address, contact)
        - Customer/billing information
        - Line items with descriptions, quantities, and amounts
        - Financial totals (subtotal, tax, total amount)
        - Payment terms and due dates
        - Any additional invoice metadata
        """,
        examples=[
            ExtractionExample(
                text="""
                INVOICE #INV-2024-001
                Date: January 15, 2024
                
                From: ABC Supply Company
                123 Business Ave, Suite 100
                New York, NY 10001
                Phone: (555) 123-4567
                
                Bill To: XYZ Corporation
                456 Corporate Blvd
                Chicago, IL 60601
                
                Description                 Qty    Unit Price    Amount
                Office Supplies              2      $125.00     $250.00
                Printer Paper (Box)          5       $25.00     $125.00
                Pens (Pack of 12)           10       $15.00     $150.00
                
                Subtotal:                                       $525.00
                Tax (8.5%):                                      $44.63
                Total:                                          $569.63
                
                Payment Terms: Net 30
                Due Date: February 14, 2024
                """,
                extractions=[
                    ExtractionEntity(
                        extraction_class="invoice_number",
                        extraction_text="INV-2024-001",
                        attributes={"confidence": 1.0}
                    ),
                    ExtractionEntity(
                        extraction_class="invoice_date",
                        extraction_text="January 15, 2024",
                        attributes={"confidence": 1.0, "format": "date"}
                    ),
                    ExtractionEntity(
                        extraction_class="vendor_name",
                        extraction_text="ABC Supply Company",
                        attributes={"confidence": 1.0}
                    ),
                    ExtractionEntity(
                        extraction_class="vendor_address",
                        extraction_text="123 Business Ave, Suite 100, New York, NY 10001",
                        attributes={"confidence": 0.9}
                    ),
                    ExtractionEntity(
                        extraction_class="customer_name",
                        extraction_text="XYZ Corporation", 
                        attributes={"confidence": 1.0}
                    ),
                    ExtractionEntity(
                        extraction_class="total_amount",
                        extraction_text="$569.63",
                        attributes={"currency": "USD", "confidence": 1.0, "amount_type": "total"}
                    ),
                    ExtractionEntity(
                        extraction_class="subtotal_amount",
                        extraction_text="$525.00",
                        attributes={"currency": "USD", "confidence": 1.0, "amount_type": "subtotal"}
                    ),
                    ExtractionEntity(
                        extraction_class="tax_amount",
                        extraction_text="$44.63",
                        attributes={"currency": "USD", "confidence": 0.9, "tax_rate": "8.5%"}
                    ),
                    ExtractionEntity(
                        extraction_class="due_date",
                        extraction_text="February 14, 2024",
                        attributes={"confidence": 1.0, "format": "date"}
                    ),
                    ExtractionEntity(
                        extraction_class="payment_terms",
                        extraction_text="Net 30",
                        attributes={"confidence": 1.0}
                    )
                ]
            )
        ],
        model_type="openai",
        model_id="gpt-4o"
    )
    
    # Process using the main pipeline with predefined config
    extraction_request_json = extraction_config.model_dump_json()
    
    return await process_document(
        file=file,
        extraction_request=extraction_request_json,
        ocr_service=ocr_service,
        extraction_service=extraction_service
    )
