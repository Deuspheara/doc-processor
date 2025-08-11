"""
Service layer for LangExtract information extraction.

This module handles all interactions with LangExtract for structured
information extraction from text, including model management and result formatting.
"""

import os
from typing import Dict, Any, List

from fastapi import HTTPException

from ..config import settings
from ..models import ExtractionEntity, ExtractionExample

try:
    import langextract as lx
    from langextract.inference import OpenAILanguageModel
except ImportError:
    raise ImportError("Please install langextract: pip install langextract[openai]")


class LangExtractService:
    """
    Service for structured information extraction using LangExtract.
    
    Handles conversion between API models and LangExtract formats,
    manages different LLM providers, and provides structured extraction capabilities.
    """
    
    def __init__(self):
        if not settings.effective_api_key:
            raise ValueError("OpenAI/LangExtract API key not configured")
    
    def extract_information(
        self, 
        text: str, 
        prompt_description: str, 
        examples: List[ExtractionExample],
        model_type: str = None,
        model_id: str = None
    ) -> Dict[str, Any]:
        """
        Extract structured information from text using LangExtract.
        
        Args:
            text: Input text to process
            prompt_description: Description of what information to extract
            examples: Few-shot examples for guidance
            model_type: LLM model type (openai, gemini, ollama)
            model_id: Specific model identifier
            
        Returns:
            Dictionary containing extracted entities and metadata
            
        Raises:
            HTTPException: If extraction fails or configuration is invalid
        """
        # Use defaults if not provided
        model_type = model_type or settings.default_model_type
        model_id = model_id or settings.default_model_id
        
        try:
            # Convert examples to LangExtract format
            lx_examples = self._convert_examples_to_langextract(examples)
            
            # Set up API key in environment for LangExtract
            os.environ['OPENAI_API_KEY'] = settings.effective_api_key
            
            # Perform extraction
            result = lx.extract(
                text_or_documents=text,
                prompt_description=prompt_description,
                examples=lx_examples,
                model_id=model_id,
                api_key=settings.effective_api_key,
                language_model_type=self._get_language_model_type(model_type),
                fence_output=True,
                use_schema_constraints=False
            )
            
# Log the raw result for debugging
            import logging
            logging.debug(f"Raw extraction result: {result}")
            # Convert result to standard format
            entities = self._convert_extractions_to_entities(result)
            
            return {
                "entities": entities,
                "metadata": {
                    "model_type": model_type,
                    "model_id": model_id,
                    "extraction_count": len(entities),
                    "prompt_description": prompt_description
                }
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Information extraction failed: {str(e)}"
            )
    
    def _convert_examples_to_langextract(
        self, 
        examples: List[ExtractionExample]
    ) -> List[lx.data.ExampleData]:
        """
        Convert API examples to LangExtract format.
        
        Args:
            examples: List of API extraction examples
            
        Returns:
            List of LangExtract ExampleData objects
        """
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
        
        return lx_examples
    
    def _convert_extractions_to_entities(self, result) -> List[Dict[str, Any]]:
        """
        Convert LangExtract results to API entity format.
        
        Args:
            result: LangExtract extraction result
            
        Returns:
            List of entity dictionaries
        """
        entities = []
        
        if hasattr(result, 'extractions') and result.extractions:
            for extraction in result.extractions:
                # Ensure attributes is always a dictionary, never None
                attributes = getattr(extraction, 'attributes', {})
                if attributes is None:
                    attributes = {}
                
                entity_dict = {
                    "extraction_class": getattr(extraction, 'extraction_class', 'unknown'),
                    "extraction_text": getattr(extraction, 'extraction_text', ''),
                    "attributes": attributes,
                    "start_char": getattr(extraction, 'start_char', None),
                    "end_char": getattr(extraction, 'end_char', None)
                }
                entities.append(entity_dict)
        
        return entities
    
    def _get_language_model_type(self, model_type: str):
        """
        Get the appropriate LangExtract language model class.
        
        Args:
            model_type: String identifier for model type
            
        Returns:
            LangExtract language model class
            
        Raises:
            HTTPException: If model type is not supported
        """
        if model_type.lower() == "openai":
            return OpenAILanguageModel
        elif model_type.lower() == "gemini":
            try:
                from langextract.inference import GeminiLanguageModel
                return GeminiLanguageModel
            except ImportError:
                raise HTTPException(
                    status_code=400,
                    detail="Gemini model not available. Install langextract[gemini]"
                )
        elif model_type.lower() == "ollama":
            try:
                from langextract.inference import OllamaLanguageModel
                return OllamaLanguageModel
            except ImportError:
                raise HTTPException(
                    status_code=400,
                    detail="Ollama model not available. Install langextract[ollama]"
                )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported model type: {model_type}. Supported: openai, gemini, ollama"
            )
    
    @staticmethod
    def validate_examples(examples: List[ExtractionExample]) -> None:
        """
        Validate extraction examples.
        
        Args:
            examples: List of examples to validate
            
        Raises:
            HTTPException: If examples are invalid
        """
        if not examples:
            raise HTTPException(
                status_code=400,
                detail="At least one example is required for extraction"
            )
        
        for i, example in enumerate(examples):
            if not example.text.strip():
                raise HTTPException(
                    status_code=400,
                    detail=f"Example {i+1} has empty text"
                )
            
            if not example.extractions:
                raise HTTPException(
                    status_code=400,
                    detail=f"Example {i+1} has no extractions"
                )
            
            for j, extraction in enumerate(example.extractions):
                if not extraction.extraction_class.strip():
                    raise HTTPException(
                        status_code=400,
                        detail=f"Example {i+1}, extraction {j+1} has empty class"
                    )
                
                if not extraction.extraction_text.strip():
                    raise HTTPException(
                        status_code=400,
                        detail=f"Example {i+1}, extraction {j+1} has empty text"
                    )


class ExtractionService:
    """
    Main extraction service that wraps LangExtractService with additional convenience methods.
    """
    
    def __init__(self):
        self.lang_extract = LangExtractService()
    
    async def extract_invoice_data(self, text: str) -> Dict[str, Any]:
        """
        Extract standard invoice fields from text.
        
        Args:
            text: OCR text from invoice
            
        Returns:
            Dictionary with extracted invoice data
        """
        # Predefined invoice extraction example
        examples = [
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
        ]
        
        result = self.lang_extract.extract_information(
            text=text,
            prompt_description="Extract key invoice information including vendor details, amounts, and dates",
            examples=examples
        )
        
        # Convert to dictionary format expected by workflow
        extracted_data = {}
        for entity in result['entities']:
            extracted_data[entity['extraction_class']] = entity['extraction_text']
            
        return {
            **extracted_data,
            'confidence': {entity['extraction_class']: entity.get('attributes', {}).get('confidence', 0.8) 
                          for entity in result['entities']}
        }

    @staticmethod
    def validate_examples(examples: List[ExtractionExample]) -> None:
        """
        Validate extraction examples - delegate to LangExtractService.
        
        Args:
            examples: List of examples to validate
            
        Raises:
            HTTPException: If examples are invalid
        """
        # Use the static method from LangExtractService for validation
        LangExtractService.validate_examples(examples)
    
    async def extract_custom_fields(
        self, 
        text: str, 
        fields: List[str], 
        model: str = "gpt-4o",
        description: str = ""
    ) -> Dict[str, Any]:
        """
        Extract custom fields from text based on node configuration.
        
        Args:
            text: Input text to process
            fields: List of field names to extract
            model: Model to use for extraction
            description: Custom description for extraction
            
        Returns:
            Dictionary with extracted field data
        """
        # Create generic examples based on fields
        example_extractions = []
        for field in fields:
            example_extractions.append(
                ExtractionEntity(
                    extraction_class=field,
                    extraction_text=f"example_{field}",
                    attributes={"confidence": 1.0}
                )
            )
        
        examples = [
            ExtractionExample(
                text="Sample text with relevant information",
                extractions=example_extractions
            )
        ]
        
        prompt_desc = description or f"Extract the following fields: {', '.join(fields)}"
        
        result = self.lang_extract.extract_information(
            text=text,
            prompt_description=prompt_desc,
            examples=examples,
            model_id=model
        )
        
        # Convert to dictionary format
        extracted_data = {}
        for entity in result['entities']:
            extracted_data[entity['extraction_class']] = entity['extraction_text']
            
        return {
            **extracted_data,
            'confidence': {entity['extraction_class']: entity.get('attributes', {}).get('confidence', 0.8) 
                          for entity in result['entities']}
        }
    
    def extract_information(
        self, 
        text: str, 
        prompt_description: str, 
        examples: List[ExtractionExample],
        model_type: str = "openai",
        model_id: str = "gpt-4o"
    ) -> Dict[str, Any]:
        """
        Extract structured information using LangExtract - compatibility method.
        
        This method maintains compatibility with the existing pipeline.
        
        Args:
            text: Input text to process
            prompt_description: Description of what information to extract
            examples: Few-shot examples for guidance
            model_type: LLM model type (openai, gemini, ollama)
            model_id: Specific model identifier
            
        Returns:
import logging
        result = self.lang_extract.extract_information(
            text=text,
            prompt_description=prompt_description,
            examples=examples,
            model_type=model_type,
            model_id=model_id
        )
        logging.debug(f"Raw extraction result from ExtractionService: {result}")
        return result
            Dictionary containing extracted entities and metadata
        """
        # Delegate to the underlying LangExtractService
        return self.lang_extract.extract_information(
            text=text,
            prompt_description=prompt_description,
            examples=examples,
            model_type=model_type,
            model_id=model_id
        )