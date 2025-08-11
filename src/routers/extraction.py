"""
Information extraction API endpoints.

This module contains endpoints for structured information extraction
using LangExtract and various language models.
"""

from fastapi import APIRouter, Form, HTTPException
import json
from typing import Dict, Any

from ..dependencies import ExtractionServiceDep
from ..models import ExtractionRequest, ExtractionResult
from ..services.extraction_service import LangExtractService

router = APIRouter(
    prefix="/extract",
    tags=["Information Extraction"],
    responses={
        400: {"description": "Bad request - invalid parameters or examples"},
        500: {"description": "Internal server error"}
    }
)


@router.post(
    "/information",
    response_model=ExtractionResult,
    summary="Extract structured information from text",
    description="""
    Extract structured information from text using LangExtract with customizable AI models.
    
    **Key Features:**
    - Few-shot learning with custom examples
    - Support for multiple AI models (OpenAI, Gemini, Ollama)
    - Flexible entity extraction with attributes
    - Customizable prompts and descriptions
    
    **Supported Models:**
    - **OpenAI:** gpt-4o, gpt-4-turbo, gpt-3.5-turbo
    - **Gemini:** gemini-pro, gemini-1.5-pro  
    - **Ollama:** Local models (requires Ollama installation)
    
    **Example Use Cases:**
    - Invoice processing (vendor, amounts, dates)
    - Contract analysis (parties, terms, clauses)
    - Resume parsing (skills, experience, education)
    - Medical record extraction (diagnoses, medications, dates)
    """
)
async def extract_information(
    text: str = Form(..., description="Text to extract information from"),
    extraction_request: str = Form(
        ..., 
        description="JSON string containing extraction configuration (ExtractionRequest format)"
    ),
    extraction_service: ExtractionServiceDep = None
):
    """Extract structured information from text using LangExtract."""
    
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
    LangExtractService.validate_examples(extraction_req.examples)
    
    # Validate text input
    if not text.strip():
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty"
        )
    
    if len(text) > 100000:  # 100KB limit for text
        raise HTTPException(
            status_code=400,
            detail=f"Text too long: {len(text)} characters. Maximum: 100,000 characters"
        )
    
    # Process with extraction service
    result = extraction_service.extract_information(
        text=text,
        prompt_description=extraction_req.prompt_description,
        examples=extraction_req.examples,
        model_type=extraction_req.model_type,
        model_id=extraction_req.model_id
    )
    
    return ExtractionResult(
        entities=result["entities"],
        metadata=result["metadata"]
    )


@router.get(
    "/models",
    summary="List available extraction models",
    description="""
    Get information about available AI models for information extraction.
    
    Returns details about supported model types and their capabilities.
    """
)
async def list_available_models() -> Dict[str, Any]:
    """List available models for information extraction."""
    return {
        "model_types": {
            "openai": {
                "description": "OpenAI GPT models",
                "models": [
                    {
                        "id": "gpt-4o",
                        "name": "GPT-4 Omni",
                        "description": "Latest and most capable OpenAI model",
                        "recommended": True
                    },
                    {
                        "id": "gpt-4-turbo",
                        "name": "GPT-4 Turbo",
                        "description": "Fast and capable GPT-4 variant",
                        "recommended": True
                    },
                    {
                        "id": "gpt-3.5-turbo",
                        "name": "GPT-3.5 Turbo",
                        "description": "Fast and cost-effective option",
                        "recommended": False
                    }
                ],
                "requirements": ["OPENAI_API_KEY or LANGEXTRACT_API_KEY environment variable"]
            },
            "gemini": {
                "description": "Google Gemini models",
                "models": [
                    {
                        "id": "gemini-pro",
                        "name": "Gemini Pro",
                        "description": "Google's advanced language model",
                        "recommended": True
                    },
                    {
                        "id": "gemini-1.5-pro",
                        "name": "Gemini 1.5 Pro",
                        "description": "Enhanced Gemini model with longer context",
                        "recommended": True
                    }
                ],
                "requirements": ["GOOGLE_API_KEY environment variable", "langextract[gemini] installation"]
            },
            "ollama": {
                "description": "Local Ollama models",
                "models": [
                    {
                        "id": "llama2",
                        "name": "Llama 2",
                        "description": "Meta's open-source language model",
                        "recommended": True
                    },
                    {
                        "id": "mistral",
                        "name": "Mistral 7B",
                        "description": "Efficient open-source model",
                        "recommended": True
                    },
                    {
                        "id": "codellama",
                        "name": "Code Llama",
                        "description": "Specialized for code understanding",
                        "recommended": False
                    }
                ],
                "requirements": ["Ollama installation and running service", "langextract[ollama] installation"]
            }
        },
        "default": {
            "model_type": "openai",
            "model_id": "gpt-4o"
        },
        "notes": [
            "Model availability depends on API key configuration",
            "OpenAI models generally provide the most reliable extraction",
            "Ollama models run locally and don't require API keys",
            "Custom models can be used by specifying the exact model ID"
        ]
    }
