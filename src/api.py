"""
FastAPI application combining Mistral OCR and Google LangExtract
for comprehensive document processing and information extraction.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse, HTMLResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import httpx
import base64
import os
import tempfile
import json
from pathlib import Path
import asyncio

# Import LangExtract
try:
    import langextract as lx
except ImportError:
    raise ImportError("Please install langextract: pip install langextract")

app = FastAPI(
    title="Document Processing API",
    description="Combine Mistral OCR and LangExtract for advanced document understanding",
    version="1.0.0"
)

# Configuration
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
OPENAI_API_KEY = os.getenv("LANGEXTRACT_API_KEY")  # OpenAI key from LANGEXTRACT_API_KEY
LANGEXTRACT_API_KEY = os.getenv("LANGEXTRACT_API_KEY")  # For compatibility

# Pydantic models for request/response
class ExtractionEntity(BaseModel):
    extraction_class: str = Field(..., description="Type/class of the entity")
    extraction_text: str = Field(..., description="Exact text from source")
    attributes: Dict[str, Any] = Field(default_factory=dict, description="Additional attributes")

class ExtractionExample(BaseModel):
    text: str
    extractions: List[ExtractionEntity]

class ExtractionRequest(BaseModel):
    model_config = {'protected_namespaces': ()}
    
    prompt_description: str = Field(..., description="Description of what to extract")
    examples: List[ExtractionExample] = Field(..., description="Few-shot examples")
    model_type: str = Field("openai", description="LLM model type (gemini, openai, ollama)")
    model_id: str = Field("gpt-4o", description="Specific model ID")

class ProcessingResult(BaseModel):
    ocr_text: str
    extracted_entities: List[Dict[str, Any]]
    extraction_metadata: Dict[str, Any]
    processing_stats: Dict[str, Any]

class OCRResult(BaseModel):
    text: str
    processing_time: float
    page_count: int

@app.get("/", response_class=HTMLResponse)
async def root():
    """API Documentation and Test Interface"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Document Processing API</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .container { max-width: 800px; margin: 0 auto; }
            .endpoint { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .method { color: white; padding: 5px 10px; border-radius: 3px; }
            .post { background-color: #49cc90; }
            .get { background-color: #61affe; }
            code { background: #f0f0f0; padding: 2px 5px; border-radius: 3px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Document Processing API</h1>
            <p>Combines Mistral OCR and LangExtract for advanced document understanding.</p>
            
            <div class="endpoint">
                <h3><span class="method post">POST</span> /process-document</h3>
                <p>Complete pipeline: OCR + Information Extraction</p>
                <p><strong>Input:</strong> Document file + extraction parameters</p>
            </div>
            
            <div class="endpoint">
                <h3><span class="method post">POST</span> /ocr-only</h3>
                <p>OCR extraction only using Mistral OCR</p>
                <p><strong>Input:</strong> Document file (PDF/Image)</p>
            </div>
            
            <div class="endpoint">
                <h3><span class="method post">POST</span> /extract-only</h3>
                <p>Information extraction only using LangExtract</p>
                <p><strong>Input:</strong> Text + extraction parameters</p>
            </div>
            
            <div class="endpoint">
                <h3><span class="method post">POST</span> /test-ocr</h3>
                <p>Test Mistral OCR functionality with debugging info</p>
                <p><strong>Input:</strong> Document file only</p>
            </div>
            
            <div class="endpoint">
                <h3><span class="method post">POST</span> /example-invoice-processing</h3>
                <p>Example pipeline with predefined invoice extraction</p>
                <p><strong>Input:</strong> Invoice document file only</p>
            </div>
            
            <div class="endpoint">
                <h3><span class="method get">GET</span> /health</h3>
                <p>Check API health and configuration</p>
            </div>
            
            <h2>🐛 Troubleshooting</h2>
            <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4>Common Issues:</h4>
                <ul>
                    <li><strong>File format error:</strong> Use PDF, PNG, JPG, JPEG, or WebP files only</li>
                    <li><strong>File size error:</strong> Files must be under 50MB</li>
                    <li><strong>API key error:</strong> Check that MISTRAL_API_KEY is set correctly</li>
                    <li><strong>OCR extraction error:</strong> Try the <code>/test-ocr</code> endpoint first</li>
                </ul>
                
                <h4>Testing Steps:</h4>
                <ol>
                    <li>Use <code>/health</code> to check API configuration</li>
                    <li>Use <code>/test-ocr</code> to test OCR functionality</li>
                    <li>Use <code>/example-invoice-processing</code> for full pipeline test</li>
                    <li>Then try <code>/process-document</code> with your own extraction config</li>
                </ol>
            </div>
            
            <h2>Setup Instructions</h2>
            <ol>
                <li>Set environment variables:
                    <ul>
                        <li><code>MISTRAL_API_KEY</code> - Your Mistral API key</li>
                        <li><code>LANGEXTRACT_API_KEY</code> - Your OpenAI API key (for OpenAI models)</li>
                    </ul>
                </li>
                <li>Install dependencies: <code>pip install fastapi langextract httpx python-multipart</code></li>
                <li>Run: <code>uvicorn main:app --reload</code></li>
            </ol>
            
            <p><a href="/docs">Interactive API Documentation</a></p>
        </div>
    </body>
    </html>
    """

@app.get("/health")
async def health_check():
    """Check API health and configuration"""
    return {
        "status": "healthy",
        "mistral_api_configured": bool(MISTRAL_API_KEY),
        "langextract_api_configured": bool(LANGEXTRACT_API_KEY),
        "available_endpoints": [
            "/process-document",
            "/ocr-only", 
            "/extract-only",
            "/health"
        ]
    }

async def mistral_ocr(file_content: bytes, filename: str) -> Dict[str, Any]:
    """Extract text from document using Mistral OCR"""
    if not MISTRAL_API_KEY:
        raise HTTPException(status_code=400, detail="MISTRAL_API_KEY not configured")
    
    import time
    import base64
    start_time = time.time()
    
    # Determine content type
    content_type = "application/pdf"
    if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        content_type = f"image/{filename.split('.')[-1].lower()}"
        if content_type == "image/jpg":
            content_type = "image/jpeg"
    elif filename.lower().endswith('.webp'):
        content_type = "image/webp"
    
    # Encode file content to base64
    base64_content = base64.b64encode(file_content).decode('utf-8')
    data_url = f"data:{content_type};base64,{base64_content}"
    
    async with httpx.AsyncClient(timeout=300.0) as client:
        headers = {
            "Authorization": f"Bearer {MISTRAL_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "mistral-ocr-latest",
            "document": {
                "type": "document_url",
                "document_url": data_url
            },
            "include_image_base64": True,
            "image_limit": 10
        }
        
        response = await client.post(
            "https://api.mistral.ai/v1/ocr",
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
        
        # Extract text from pages
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
            "raw_result": result  # Include raw result for debugging
        }

def langextract_process(
    text: str, 
    prompt_description: str, 
    examples: List[ExtractionExample],
    model_type: str = "openai",
    model_id: str = "gpt-4o"
) -> Dict[str, Any]:
    """Extract structured information using LangExtract"""
    
    # Convert examples to LangExtract format
    lx_examples = []
    for example in examples:
        lx_extractions = []
        for entity in example.extractions:
            lx_extractions.append(
                lx.data.Extraction(
                    extraction_class=entity.extraction_class,
                    extraction_text=entity.extraction_text,
                    attributes=entity.attributes
                )
            )
        
        lx_examples.append(
            lx.data.ExampleData(
                text=example.text,
                extractions=lx_extractions
            )
        )
    
    # Perform extraction using OpenAI (as per documentation format)
    try:
        if not OPENAI_API_KEY:
            raise HTTPException(status_code=400, detail="OPENAI_API_KEY required for OpenAI models")
        
        # Use the OpenAI format from the documentation
        import os
        # Set OpenAI API key in environment for LangExtract
        os.environ['OPENAI_API_KEY'] = OPENAI_API_KEY
        
        # Use OpenAI language model type from inference module
        from langextract.inference import OpenAILanguageModel
        
        result = lx.extract(
            text_or_documents=text,
            prompt_description=prompt_description,
            examples=lx_examples,
            model_id=model_id,
            api_key=OPENAI_API_KEY,
            language_model_type=OpenAILanguageModel,  # Use OpenAI language model type
            fence_output=True,
            use_schema_constraints=False
        )
        
        # Convert result to standard format - check for 'extractions' attribute
        entities = []
        if hasattr(result, 'extractions') and result.extractions:
            for extraction in result.extractions:
                entity_dict = {
                    "extraction_class": getattr(extraction, 'extraction_class', 'unknown'),
                    "extraction_text": getattr(extraction, 'extraction_text', ''),
                    "attributes": getattr(extraction, 'attributes', {}),
                    "start_char": getattr(extraction, 'start_char', None),
                    "end_char": getattr(extraction, 'end_char', None)
                }
                entities.append(entity_dict)
        
        return {
            "entities": entities,
            "metadata": {
                "model_type": model_type,
                "model_id": model_id,
                "extraction_count": len(entities)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LangExtract processing failed: {str(e)}")

@app.post("/ocr-only", response_model=OCRResult)
async def ocr_only(file: UploadFile = File(...)):
    """Extract text from document using Mistral OCR only"""
    
    # Validate file type
    if not file.content_type or not (
        file.content_type.startswith('image/') or 
        file.content_type == 'application/pdf'
    ):
        raise HTTPException(
            status_code=400, 
            detail="File must be an image or PDF"
        )
    
    # Read file content
    file_content = await file.read()
    
    # Process with Mistral OCR
    result = await mistral_ocr(file_content, file.filename)
    
    return OCRResult(
        text=result["text"],
        processing_time=result["processing_time"],
        page_count=result["page_count"]
    )

@app.post("/extract-only")
async def extract_only(
    text: str = Form(...),
    extraction_request: str = Form(..., description="JSON string of ExtractionRequest")
):
    """Extract structured information from text using LangExtract only"""
    
    try:
        extraction_params = json.loads(extraction_request)
        extraction_req = ExtractionRequest(**extraction_params)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in extraction_request")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid extraction parameters: {str(e)}")
    
    # Process with LangExtract
    result = langextract_process(
        text=text,
        prompt_description=extraction_req.prompt_description,
        examples=extraction_req.examples,
        model_type=extraction_req.model_type,
        model_id=extraction_req.model_id
    )
    
    return {
        "extracted_entities": result["entities"],
        "extraction_metadata": result["metadata"]
    }

@app.post("/process-document", response_model=ProcessingResult)
async def process_document(
    file: UploadFile = File(...),
    extraction_request: str = Form(..., description="JSON string of ExtractionRequest")
):
    """
    Complete pipeline: OCR extraction followed by information extraction
    
    This combines Mistral OCR and LangExtract for comprehensive document processing:
    1. Extract text/markdown from document using Mistral OCR
    2. Extract structured information using LangExtract
    """
    
    # Validate file type
    if not file.content_type or not (
        file.content_type.startswith('image/') or 
        file.content_type == 'application/pdf'
    ):
        raise HTTPException(
            status_code=400, 
            detail="File must be an image (PNG, JPG, JPEG, WebP) or PDF"
        )
    
    # Check file size (Mistral OCR has 50MB limit)
    file_content = await file.read()
    file_size_mb = len(file_content) / (1024 * 1024)
    if file_size_mb > 50:
        raise HTTPException(
            status_code=400,
            detail=f"File too large: {file_size_mb:.1f}MB. Mistral OCR supports files up to 50MB."
        )
    
    # Parse extraction parameters
    try:
        extraction_params = json.loads(extraction_request)
        extraction_req = ExtractionRequest(**extraction_params)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in extraction_request")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid extraction parameters: {str(e)}")
    
    try:
        # Step 1: OCR with Mistral
        ocr_result = await mistral_ocr(file_content, file.filename)
        
        # Check if we got meaningful text
        if len(ocr_result["text"].strip()) < 10:
            raise HTTPException(
                status_code=422,
                detail="OCR extracted very little text. Check if the document is readable or contains text."
            )
        
        # Step 2: Extract with LangExtract
        extraction_result = langextract_process(
            text=ocr_result["text"],
            prompt_description=extraction_req.prompt_description,
            examples=extraction_req.examples,
            model_type=extraction_req.model_type,
            model_id=extraction_req.model_id
        )
        
        return ProcessingResult(
            ocr_text=ocr_result["text"],
            extracted_entities=extraction_result["entities"],
            extraction_metadata=extraction_result["metadata"],
            processing_stats={
                "ocr_processing_time": ocr_result["processing_time"],
                "page_count": ocr_result["page_count"],
                "text_length": len(ocr_result["text"]),
                "entity_count": len(extraction_result["entities"]),
                "file_size_mb": file_size_mb
            }
        )
    
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log and wrap unexpected errors
        import traceback
        error_details = {
            "error": str(e),
            "type": type(e).__name__,
            "traceback": traceback.format_exc()
        }
        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}"
        )

# Example usage function for testing
@app.post("/example-invoice-processing")
async def example_invoice_processing(file: UploadFile = File(...)):
    """
    Example: Process an invoice to extract key financial information
    """
    
    # Predefined extraction configuration for invoices
    extraction_config = ExtractionRequest(
        prompt_description="""
        Extract key invoice information including vendor details, line items, 
        totals, and payment terms. Focus on financial data and structured information.
        """,
        examples=[
            ExtractionExample(
                text="Invoice #12345\nABC Company\n123 Main St\nTotal: $1,250.00\nDue: 2024-01-15",
                extractions=[
                    ExtractionEntity(
                        extraction_class="invoice_number",
                        extraction_text="12345",
                        attributes={"confidence": 1.0}
                    ),
                    ExtractionEntity(
                        extraction_class="vendor_name", 
                        extraction_text="ABC Company",
                        attributes={"confidence": 1.0}
                    ),
                    ExtractionEntity(
                        extraction_class="total_amount",
                        extraction_text="$1,250.00",
                        attributes={"currency": "USD", "confidence": 1.0}
                    ),
                    ExtractionEntity(
                        extraction_class="due_date",
                        extraction_text="2024-01-15",
                        attributes={"confidence": 1.0}
                    )
                ]
            )
        ],
        model_type="openai",
        model_id="gpt-4o"
    )
    
    # Process using the main pipeline
    extraction_request_json = extraction_config.model_dump_json()
    
    return await process_document(file, extraction_request_json)

@app.post("/test-ocr")
async def test_ocr(file: UploadFile = File(...)):
    """
    Simple test endpoint to check if Mistral OCR is working
    Returns OCR result with debugging information
    """
    
    if not file.content_type or not (
        file.content_type.startswith('image/') or 
        file.content_type == 'application/pdf'
    ):
        raise HTTPException(
            status_code=400, 
            detail="File must be an image (PNG, JPG, JPEG, WebP) or PDF"
        )
    
    file_content = await file.read()
    file_size_mb = len(file_content) / (1024 * 1024)
    
    if file_size_mb > 50:
        raise HTTPException(
            status_code=400,
            detail=f"File too large: {file_size_mb:.1f}MB. Mistral OCR supports files up to 50MB."
        )
    
    try:
        result = await mistral_ocr(file_content, file.filename)
        
        return {
            "success": True,
            "text_preview": result["text"][:500] + "..." if len(result["text"]) > 500 else result["text"],
            "full_text_length": len(result["text"]),
            "processing_time": result["processing_time"],
            "page_count": result["page_count"],
            "file_info": {
                "filename": file.filename,
                "size_mb": round(file_size_mb, 2),
                "content_type": file.content_type
            },
            "debug_info": {
                "mistral_api_configured": bool(MISTRAL_API_KEY),
                "api_key_prefix": MISTRAL_API_KEY[:8] + "..." if MISTRAL_API_KEY else None
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "file_info": {
                "filename": file.filename,
                "size_mb": round(file_size_mb, 2),
                "content_type": file.content_type
            },
            "debug_info": {
                "mistral_api_configured": bool(MISTRAL_API_KEY),
                "api_key_prefix": MISTRAL_API_KEY[:8] + "..." if MISTRAL_API_KEY else None
            }
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)