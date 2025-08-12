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
from ..services.convex_storage import ConvexStorageService

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

# Initialize storage service
storage_service = ConvexStorageService()


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
    document_id: str = Form(
        None,
        description="Optional existing document ID to update instead of creating new"
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
    
    # Store initial document record or use existing one
    if document_id:
        # Use provided document ID - don't create or update in Python backend
        # The Next.js API will handle all Convex updates
        doc_id = document_id
    else:
        # Create new document record (fallback for direct API usage)
        doc_id = await storage_service.store_document(
            filename=file.filename,
            file_size_mb=file_size_mb,
            content_type=file.content_type,
            status="processing"
        )
    
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
            processing_result = ProcessingResult(
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
            
            # Update document record with successful results (only if not using provided document_id)
            if not document_id:
                await storage_service.update_document(
                    doc_id=doc_id,
                    processing_result=processing_result,
                    status="processed"
                )
            
            return processing_result
        except Exception as validation_error:
            # Update document record with error (only if not using provided document_id)
            if not document_id:
                await storage_service.update_document(
                    doc_id=doc_id,
                    status="failed",
                    error_message=f"Result validation failed: {str(validation_error)}"
                )
            raise HTTPException(
                status_code=500,
                detail=f"Result validation failed: {str(validation_error)}"
            )
        
    except HTTPException as http_exc:
        # Update document record with HTTP error (only if not using provided document_id)
        if not document_id:
            await storage_service.update_document(
                doc_id=doc_id,
                status="failed",
                error_message=http_exc.detail
            )
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Update document record with unexpected error (only if not using provided document_id)
        if not document_id:
            await storage_service.update_document(
                doc_id=doc_id,
                status="failed",
                error_message=f"Document processing failed: {str(e)}"
            )
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
    document_id: str = Form(
        None,
        description="Optional existing document ID to update instead of creating new"
    ),
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
                # GitKraken Invoice
                
                Axosoft LLC (DBA GitKraken)
                16435 N Scottsdale Road, Suite 130
                Scottsdale, AZ 85254 United States
                EIN: 85-2352677 VAT Reg # : EU372067381
                
                ## BILLED TO
                Quentin Gaillardet
                quentin.gaillardet01's organization
                France
                
                ## INVOICE
                Invoice # 328321 
                Invoice Date Mar 01, 2025 
                Invoice Amount 48,00 € (EUR) 
                Customer ID 2f78bbf5-4b32-44dd-8293-8827a74280b9 
                Payment Terms Due Upon Receipt PAID
                
                SUBSCRIPTION ID AzqMTPUeEaFIi2tm3 
                Billing Period Mar 01, 2025 to Feb 28, 2026 
                Next Billing Date Mar 01, 2026
                
                | DESCRIPTION | UNIT PRICE | DISCOUNT | TOTAL EXCL. VAT | VAT | AMOUNT (EUR) |
                | GitKraken Pro | 60,00 € × 1 | -20,00 € | 40,00 € | 8,00 € | 48,00 € |
                
                Total excl. VAT: 40,00 €
                VAT (standard) @ 20%: 8,00 €
                Total: 48,00 €
                Payments: -48,00 €
                Amount Due (EUR): 0,00 €
                
                ## PAYMENTS
                48,00 € was paid on 01 Mar, 2025 15:24 MST by MasterCard card ending 0873.
                
                ## DISCOUNT  
                GitKraken Holiday applied on line item #1 - 20,00 € (33.33%).
                """,
                extractions=[
                    ExtractionEntity(
                        extraction_class="invoice_number",
                        extraction_text="328321",
                        attributes={"confidence": 1.0}
                    ),
                    ExtractionEntity(
                        extraction_class="invoice_date",
                        extraction_text="Mar 01, 2025",
                        attributes={"confidence": 1.0, "format": "date"}
                    ),
                    ExtractionEntity(
                        extraction_class="vendor_name",
                        extraction_text="Axosoft LLC (DBA GitKraken)",
                        attributes={"confidence": 1.0}
                    ),
                    ExtractionEntity(
                        extraction_class="vendor_address",
                        extraction_text="16435 N Scottsdale Road, Suite 130, Scottsdale, AZ 85254 United States",
                        attributes={"confidence": 1.0}
                    ),
                    ExtractionEntity(
                        extraction_class="customer_name",
                        extraction_text="Quentin Gaillardet", 
                        attributes={"confidence": 1.0}
                    ),
                    ExtractionEntity(
                        extraction_class="total_amount",
                        extraction_text="48,00 €",
                        attributes={"currency": "EUR", "confidence": 1.0, "amount_type": "total"}
                    ),
                    ExtractionEntity(
                        extraction_class="subtotal_amount",
                        extraction_text="40,00 €",
                        attributes={"currency": "EUR", "confidence": 1.0, "amount_type": "subtotal"}
                    ),
                    ExtractionEntity(
                        extraction_class="tax_amount",
                        extraction_text="8,00 €",
                        attributes={"currency": "EUR", "confidence": 1.0, "tax_rate": "20%"}
                    ),
                    ExtractionEntity(
                        extraction_class="due_date",
                        extraction_text="Due Upon Receipt",
                        attributes={"confidence": 1.0, "format": "payment_terms"}
                    ),
                    ExtractionEntity(
                        extraction_class="payment_terms",
                        extraction_text="Due Upon Receipt",
                        attributes={"confidence": 1.0}
                    ),
                    ExtractionEntity(
                        extraction_class="line_items",
                        extraction_text="GitKraken Pro - 60,00 € × 1 with -20,00 € discount = 40,00 € + 8,00 € VAT = 48,00 €",
                        attributes={"confidence": 0.9, "item_count": 1}
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
        document_id=document_id,
        ocr_service=ocr_service,
        extraction_service=extraction_service
    )
