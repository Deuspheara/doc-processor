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
            
            # Perform extraction with error handling
            try:
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
                
            except Exception as langextract_error:
                # Handle LangExtract internal errors, including the 'extractions' key issue
                import logging
                logging.warning(f"LangExtract failed with error: {langextract_error}")
                logging.info("Attempting manual extraction fallback...")
                
                # Try to extract using direct OpenAI API call as fallback
                entities = self._manual_extraction_fallback(
                    text, prompt_description, examples, model_id
                )
                
                logging.info(f"Manual fallback extracted {len(entities)} entities")
            
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
        
        # Handle different result formats
        if hasattr(result, 'extractions') and result.extractions:
            # Standard LangExtract result format
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
        elif isinstance(result, dict):
            # Handle case where result is a dictionary (potentially JSON response)
            import logging
            logging.warning(f"LangExtract returned dictionary instead of extraction object: {result}")
            
            # Try to extract entities from JSON-like structure
            # This is a fallback for when LangExtract returns raw JSON
            # We'll convert the JSON to entities based on common patterns
            try:
                # Look for common invoice fields in the JSON
                common_fields = {
                    'invoice_number': 'invoice_number',
                    'vendor_name': 'vendor_name', 
                    'invoice_date': 'invoice_date',
                    'due_date': 'due_date',
                    'total_amount': 'total_amount',
                    'tax_amount': 'tax_amount'
                }
                
                for json_key, json_value in result.items():
                    if json_key in common_fields and json_value:
                        entity_dict = {
                            "extraction_class": common_fields[json_key],
                            "extraction_text": str(json_value),
                            "attributes": {"confidence": 0.8, "source": "json_fallback"},
                            "start_char": None,
                            "end_char": None
                        }
                        entities.append(entity_dict)
                
                # Handle line_items if present
                if 'line_items' in result and isinstance(result['line_items'], list):
                    for i, item in enumerate(result['line_items']):
                        if isinstance(item, dict):
                            for item_key, item_value in item.items():
                                if item_value:
                                    entity_dict = {
                                        "extraction_class": f"line_item_{i+1}_{item_key}",
                                        "extraction_text": str(item_value),
                                        "attributes": {"confidence": 0.7, "source": "json_fallback", "line_item": i+1},
                                        "start_char": None,
                                        "end_char": None
                                    }
                                    entities.append(entity_dict)
                                    
            except Exception as fallback_error:
                logging.error(f"Failed to parse JSON result as entities: {fallback_error}")
        else:
            import logging
            logging.warning(f"Unexpected result type from LangExtract: {type(result)}")
        
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
    
    def _manual_extraction_fallback(
        self, 
        text: str, 
        prompt_description: str, 
        examples: List[ExtractionExample],
        model_id: str
    ) -> List[Dict[str, Any]]:
        """
        Manual extraction fallback when LangExtract fails.
        
        This method directly calls OpenAI API to perform extraction
        when LangExtract's internal parsing fails.
        """
        import json
        import openai
        from openai import OpenAI
        
        # Initialize OpenAI client
        client = OpenAI(api_key=settings.effective_api_key)
        
        # Build prompt with examples
        system_prompt = f"""You are an expert at extracting structured information from documents.

Task: {prompt_description}

Please extract information and return it as a JSON object with this exact structure:
{{
  "extractions": [
    {{
      "extraction_class": "field_name",
      "extraction_text": "extracted_value",
      "attributes": {{"confidence": 0.9}}
    }}
  ]
}}

Examples of expected output:"""

        # Add examples to the prompt
        for i, example in enumerate(examples[:2]):  # Limit to 2 examples for token efficiency
            system_prompt += f"\n\nExample {i+1}:\nInput text: {example.text[:500]}...\n"
            system_prompt += "Expected output:\n{\n  \"extractions\": [\n"
            for extraction in example.extractions[:5]:  # Limit extractions per example
                system_prompt += f"    {{\n"
                system_prompt += f"      \"extraction_class\": \"{extraction.extraction_class}\",\n"
                system_prompt += f"      \"extraction_text\": \"{extraction.extraction_text}\",\n"
                system_prompt += f"      \"attributes\": {json.dumps(extraction.attributes)}\n"
                system_prompt += f"    }},\n"
            system_prompt = system_prompt.rstrip(',\n') + "\n  ]\n}"

        user_prompt = f"Extract information from this document:\n\n{text}"
        
        try:
            response = client.chat.completions.create(
                model=model_id,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            
            # Parse the JSON response
            try:
                parsed_response = json.loads(content)
                if "extractions" in parsed_response:
                    entities = []
                    for extraction in parsed_response["extractions"]:
                        entity_dict = {
                            "extraction_class": extraction.get("extraction_class", "unknown"),
                            "extraction_text": extraction.get("extraction_text", ""),
                            "attributes": extraction.get("attributes", {"confidence": 0.8}),
                            "start_char": None,
                            "end_char": None
                        }
                        entities.append(entity_dict)
                    return entities
                else:
                    # Fallback: treat the response as key-value pairs
                    return self._parse_json_as_entities(parsed_response)
            except json.JSONDecodeError:
                # Last resort: try to extract JSON from the content
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    try:
                        parsed_response = json.loads(json_match.group())
                        return self._parse_json_as_entities(parsed_response)
                    except:
                        pass
                
                # Ultimate fallback: return empty list
                import logging
                logging.error(f"Could not parse manual extraction response: {content}")
                return []
                
        except Exception as api_error:
            import logging
            logging.error(f"Manual extraction API call failed: {api_error}")
            return []
    
    def _parse_json_as_entities(self, json_data: dict) -> List[Dict[str, Any]]:
        """Helper method to convert JSON data to entity format."""
        entities = []
        
        # Common invoice fields mapping
        field_mapping = {
            'invoice_number': 'invoice_number',
            'vendor_name': 'vendor_name',
            'invoice_date': 'invoice_date', 
            'due_date': 'due_date',
            'total_amount': 'total_amount',
            'tax_amount': 'tax_amount',
            'subtotal': 'subtotal_amount',
            'customer_name': 'customer_name',
            'line_items': 'line_items'
        }
        
        for key, value in json_data.items():
            if key in field_mapping and value:
                entity_dict = {
                    "extraction_class": field_mapping[key],
                    "extraction_text": str(value),
                    "attributes": {"confidence": 0.8, "source": "manual_fallback"},
                    "start_char": None,
                    "end_char": None
                }
                entities.append(entity_dict)
        
        return entities

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
            Dictionary containing extracted entities and metadata
        """
        import logging
        
        # Delegate to the underlying LangExtractService
        result = self.lang_extract.extract_information(
            text=text,
            prompt_description=prompt_description,
            examples=examples,
            model_type=model_type,
            model_id=model_id
        )
        logging.debug(f"Raw extraction result from ExtractionService: {result}")
        return result