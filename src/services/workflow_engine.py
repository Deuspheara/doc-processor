from typing import Dict, List, Any, Optional
import asyncio
import json
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class WorkflowNode:
    def __init__(self, node_id: str, node_type: str, config: Dict[str, Any]):
        self.id = node_id
        self.type = node_type
        self.config = config
        self.outputs = {}
        
    async def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Execute this node with given inputs"""
        logger.info(f"Executing node {self.id} of type {self.type}")
        
        try:
            if self.type == 'document-input':
                return await self._handle_document_input(inputs)
            elif self.type == 'ocr-processor':
                return await self._handle_ocr_processing(inputs)
            elif self.type == 'ai-extractor':
                return await self._handle_ai_extraction(inputs)
            elif self.type == 'data-validator':
                return await self._handle_data_validation(inputs)
            elif self.type == 'export-data':
                return await self._handle_data_export(inputs)
            else:
                raise ValueError(f"Unknown node type: {self.type}")
        except Exception as e:
            logger.error(f"Error executing node {self.id}: {str(e)}")
            raise
    
    async def _handle_document_input(self, inputs: Dict) -> Dict:
        """Handle file uploads or document sources"""
        documents = inputs.get('documents', [])
        logger.info(f"Processing {len(documents)} documents in document input node")
        
        # Process each document and prepare for next nodes
        processed_documents = []
        for i, doc in enumerate(documents):
            processed_doc = {
                'id': doc.get('id', f'doc_{i}'),
                'filename': doc.get('filename', f'document_{i}'),
                'content': doc.get('content'),
                'content_type': doc.get('content_type', 'application/octet-stream'),
                'metadata': doc.get('metadata', {}),
                'processing_stage': 'input'
            }
            processed_documents.append(processed_doc)
        
        return {
            'documents': processed_documents, 
            'count': len(processed_documents),
            'stage': 'document_input_complete'
        }
    
    async def _handle_ocr_processing(self, inputs: Dict) -> Dict:
        """Handle OCR processing using existing OCR service"""
        from ..services.ocr_service import MistralOCRService
        
        documents = inputs.get('documents', [])
        
        # Use node configuration for OCR settings
        language = self.config.get('language', 'auto')
        confidence_threshold = self.config.get('confidence_threshold', 0.8)
        
        logger.info(f"Processing OCR for {len(documents)} documents with language={language}, threshold={confidence_threshold}")
        
        ocr_service = MistralOCRService()
        processed_docs = []
        
        for doc in documents:
            try:
                # Convert document content for OCR processing
                if doc.get('content'):
                    # Use existing OCR service
                    ocr_result = await ocr_service.extract_text(
                        doc['content'], 
                        doc.get('filename', 'document.pdf')
                    )
                    text = ocr_result.get('text', '')
                    
                    # Get confidence from OCR result or use default
                    actual_confidence = ocr_result.get('confidence', 0.95)
                    if actual_confidence < confidence_threshold:
                        logger.warning(f"OCR confidence {actual_confidence} below threshold {confidence_threshold} for {doc['id']}")
                    
                    processed_doc = {
                        'document_id': doc['id'],
                        'filename': doc['filename'],
                        'extracted_text': text,
                        'confidence_score': actual_confidence,
                        'metadata': {
                            **doc.get('metadata', {}),
                            'ocr_completed_at': datetime.utcnow().isoformat(),
                            'text_length': len(text),
                            'language': language,
                            'confidence_threshold': confidence_threshold
                        },
                        'processing_stage': 'ocr_complete'
                    }
                    processed_docs.append(processed_doc)
                    
            except Exception as e:
                logger.error(f"OCR processing failed for document {doc['id']}: {str(e)}")
                # Add error document
                processed_docs.append({
                    'document_id': doc['id'],
                    'filename': doc['filename'],
                    'extracted_text': '',
                    'error': str(e),
                    'processing_stage': 'ocr_error'
                })
        
        return {
            'processed_documents': processed_docs,
            'successful_count': len([d for d in processed_docs if 'error' not in d]),
            'failed_count': len([d for d in processed_docs if 'error' in d]),
            'stage': 'ocr_complete'
        }
    
    async def _handle_ai_extraction(self, inputs: Dict) -> Dict:
        """Handle AI-powered data extraction"""
        from ..services.extraction_service import ExtractionService
        
        processed_docs = inputs.get('processed_documents', [])
        
        # Use node configuration for extraction settings
        extraction_fields = self.config.get('extraction_fields', [])
        model = self.config.get('model', 'gpt-4o')
        description = self.config.get('description', '')
        
        logger.info(f"Running AI extraction on {len(processed_docs)} documents using model {model}")
        
        extraction_service = ExtractionService()
        extracted_data = []
        
        for doc in processed_docs:
            if 'error' in doc or not doc.get('extracted_text'):
                # Skip failed documents
                extracted_data.append({
                    'document_id': doc['document_id'],
                    'filename': doc['filename'],
                    'extracted_data': {},
                    'error': doc.get('error', 'No text available for extraction'),
                    'processing_stage': 'extraction_error'
                })
                continue
            
            try:
                # Use node configuration for extraction
                if extraction_fields:
                    # Use specific fields if configured
                    extraction_result = await extraction_service.extract_custom_fields(
                        doc['extracted_text'],
                        extraction_fields,
                        model=model,
                        description=description
                    )
                else:
                    # Use default invoice extraction
                    extraction_result = await extraction_service.extract_invoice_data(
                        doc['extracted_text']
                    )
                
                extracted_data.append({
                    'document_id': doc['document_id'],
                    'filename': doc['filename'],
                    'extracted_data': extraction_result,
                    'confidence_scores': extraction_result.get('confidence', {}),
                    'metadata': {
                        **doc.get('metadata', {}),
                        'extraction_completed_at': datetime.utcnow().isoformat(),
                        'model_used': model,
                        'extraction_fields': extraction_fields
                    },
                    'processing_stage': 'extraction_complete'
                })
                
            except Exception as e:
                logger.error(f"AI extraction failed for document {doc['document_id']}: {str(e)}")
                extracted_data.append({
                    'document_id': doc['document_id'],
                    'filename': doc['filename'],
                    'extracted_data': {},
                    'error': str(e),
                    'processing_stage': 'extraction_error'
                })
        
        return {
            'extracted_data': extracted_data,
            'successful_count': len([d for d in extracted_data if 'error' not in d]),
            'failed_count': len([d for d in extracted_data if 'error' in d]),
            'stage': 'extraction_complete'
        }
    
    async def _handle_data_validation(self, inputs: Dict) -> Dict:
        """Handle data validation with configurable rules"""
        extracted_data = inputs.get('extracted_data', [])
        validation_rules = self.config.get('validation_rules', [])
        
        logger.info(f"Validating {len(extracted_data)} documents")
        
        validated_data = []
        
        for item in extracted_data:
            if 'error' in item:
                # Skip failed items
                validated_data.append({
                    **item,
                    'validation_results': [],
                    'is_valid': False,
                    'processing_stage': 'validation_skipped'
                })
                continue
            
            validation_results = self._validate_data(item['extracted_data'], validation_rules)
            is_valid = all(r['is_valid'] for r in validation_results)
            
            validated_data.append({
                **item,
                'validation_results': validation_results,
                'is_valid': is_valid,
                'metadata': {
                    **item.get('metadata', {}),
                    'validation_completed_at': datetime.utcnow().isoformat()
                },
                'processing_stage': 'validation_complete'
            })
        
        return {
            'validated_data': validated_data,
            'valid_count': len([d for d in validated_data if d.get('is_valid', False)]),
            'invalid_count': len([d for d in validated_data if not d.get('is_valid', False)]),
            'stage': 'validation_complete'
        }
    
    def _validate_data(self, data: Dict, rules: List[Dict]) -> List[Dict]:
        """Apply validation rules to extracted data"""
        results = []
        
        for rule in rules:
            field_name = rule.get('field')
            rule_type = rule.get('type')
            rule_value = rule.get('value')
            
            if field_name not in data:
                results.append({
                    'field': field_name,
                    'rule': rule_type,
                    'is_valid': rule.get('required', True) is False,
                    'message': f'Field {field_name} is missing'
                })
                continue
            
            field_value = data[field_name]
            is_valid = True
            message = 'Valid'
            
            if rule_type == 'required':
                is_valid = field_value is not None and str(field_value).strip() != ''
                message = 'Field is required' if not is_valid else 'Valid'
                
            elif rule_type == 'min_value':
                try:
                    is_valid = float(field_value) >= float(rule_value)
                    message = f'Value must be >= {rule_value}' if not is_valid else 'Valid'
                except (ValueError, TypeError):
                    is_valid = False
                    message = 'Value is not numeric'
                    
            elif rule_type == 'max_value':
                try:
                    is_valid = float(field_value) <= float(rule_value)
                    message = f'Value must be <= {rule_value}' if not is_valid else 'Valid'
                except (ValueError, TypeError):
                    is_valid = False
                    message = 'Value is not numeric'
                    
            elif rule_type == 'regex':
                import re
                try:
                    is_valid = re.match(rule_value, str(field_value)) is not None
                    message = f'Value does not match pattern {rule_value}' if not is_valid else 'Valid'
                except re.error:
                    is_valid = False
                    message = 'Invalid regex pattern'
            
            results.append({
                'field': field_name,
                'rule': rule_type,
                'is_valid': is_valid,
                'message': message
            })
        
        return results
    
    async def _handle_data_export(self, inputs: Dict) -> Dict:
        """Handle data export to various formats"""
        validated_data = inputs.get('validated_data', [])
        export_format = self.config.get('format', 'json')
        export_path = self.config.get('export_path', 'exports')
        include_metadata = self.config.get('include_metadata', False)
        
        logger.info(f"Exporting {len(validated_data)} documents to {export_format} (metadata: {include_metadata})")
        
        import os
        os.makedirs(export_path, exist_ok=True)
        
        exported_files = []
        export_summary = {
            'total_documents': len(validated_data),
            'exported_count': 0,
            'failed_count': 0,
            'export_format': export_format
        }
        
        for item in validated_data:
            try:
                filename = f"{item['document_id']}.{export_format}"
                file_path = os.path.join(export_path, filename)
                
                if export_format == 'json':
                    export_data = {
                        'document_id': item['document_id'],
                        'filename': item['filename'],
                        'extracted_data': item['extracted_data'],
                        'validation_results': item.get('validation_results', []),
                        'is_valid': item.get('is_valid', False),
                        'exported_at': datetime.utcnow().isoformat()
                    }
                    
                    if include_metadata:
                        export_data['metadata'] = item.get('metadata', {})
                    
                    with open(file_path, 'w') as f:
                        json.dump(export_data, f, indent=2, default=str)
                        
                elif export_format == 'csv':
                    # Flatten data for CSV export
                    import csv
                    flattened_data = self._flatten_dict(item['extracted_data'])
                    
                    with open(file_path, 'w', newline='') as f:
                        if flattened_data:
                            writer = csv.DictWriter(f, fieldnames=flattened_data.keys())
                            writer.writeheader()
                            writer.writerow(flattened_data)
                
                exported_files.append({
                    'document_id': item['document_id'],
                    'filename': item['filename'],
                    'export_path': file_path,
                    'export_format': export_format
                })
                export_summary['exported_count'] += 1
                
            except Exception as e:
                logger.error(f"Export failed for document {item['document_id']}: {str(e)}")
                export_summary['failed_count'] += 1
        
        return {
            'exported_files': exported_files,
            'export_summary': export_summary,
            'stage': 'export_complete'
        }
    
    def _flatten_dict(self, d: Dict, parent_key: str = '', sep: str = '_') -> Dict:
        """Flatten nested dictionary for CSV export"""
        items = []
        for k, v in d.items():
            new_key = f"{parent_key}{sep}{k}" if parent_key else k
            if isinstance(v, dict):
                items.extend(self._flatten_dict(v, new_key, sep=sep).items())
            else:
                items.append((new_key, v))
        return dict(items)


class WorkflowEngine:
    def __init__(self):
        self.execution_context = {}
    
    async def execute_workflow(self, workflow_definition: Dict, input_data: Dict = None) -> Dict:
        """Execute a complete workflow"""
        logger.info("Starting workflow execution")
        logger.info(f"Workflow definition: nodes={len(workflow_definition.get('nodes', []))}, edges={len(workflow_definition.get('edges', []))}")
        logger.info(f"Input data: {input_data}")
        
        nodes = workflow_definition.get('nodes', [])
        edges = workflow_definition.get('edges', [])
        
        if not nodes:
            raise ValueError("Workflow has no nodes to execute")
        
        # Build execution graph
        node_map = {}
        for node in nodes:
            try:
                logger.info(f"Processing node: {node.get('id', 'unknown')} of type {node.get('type', 'unknown')}")
                node_config = node.get('data', {}).get('config', {})
                node_map[node['id']] = WorkflowNode(
                    node['id'], 
                    node['type'], 
                    node_config
                )
            except Exception as e:
                logger.error(f"Error creating node {node.get('id', 'unknown')}: {str(e)}")
                raise ValueError(f"Failed to create workflow node {node.get('id', 'unknown')}: {str(e)}")
        
        # Build dependency graph
        dependencies = self._build_dependency_graph(edges, node_map.keys())
        
        # Execute nodes in topological order
        execution_order = self._topological_sort(dependencies, node_map.keys())
        execution_results = {}
        
        # Initialize with input data
        if input_data:
            execution_results['__input__'] = {
                'status': 'success',
                'data': input_data,
                'node_type': 'input'
            }
        
        for node_id in execution_order:
            node = node_map[node_id]
            
            try:
                # Gather inputs from predecessor nodes
                inputs = self._gather_node_inputs(node_id, dependencies, execution_results)
                
                # Execute node
                logger.info(f"Executing node: {node_id}")
                result = await node.execute(inputs)
                
                execution_results[node_id] = {
                    'status': 'success',
                    'data': result,
                    'node_type': node.type,
                    'executed_at': datetime.utcnow().isoformat()
                }
                
                logger.info(f"Node {node_id} executed successfully")
                
            except Exception as e:
                logger.error(f"Node {node_id} execution failed: {str(e)}")
                execution_results[node_id] = {
                    'status': 'error',
                    'error': str(e),
                    'node_type': node.type,
                    'executed_at': datetime.utcnow().isoformat()
                }
                # Stop execution on error
                break
        
        # Generate execution summary
        summary = self._generate_execution_summary(execution_results)
        
        return {
            'status': 'completed' if summary['failed_nodes'] == 0 else 'failed',
            'execution_id': str(uuid.uuid4()),
            'results': execution_results,
            'summary': summary,
            'completed_at': datetime.utcnow().isoformat()
        }
    
    def _build_dependency_graph(self, edges: List[Dict], all_nodes: set) -> Dict[str, List[str]]:
        """Build a dependency graph from edges"""
        dependencies = {node: [] for node in all_nodes}
        
        for edge in edges:
            target = edge['target']
            source = edge['source']
            if target in dependencies:
                dependencies[target].append(source)
        
        return dependencies
    
    def _topological_sort(self, dependencies: Dict[str, List[str]], all_nodes: set) -> List[str]:
        """Return nodes in topological execution order"""
        ordered = []
        remaining = set(all_nodes)
        visited = set()
        
        def visit(node):
            if node in visited:
                return
            
            visited.add(node)
            
            # Visit dependencies first
            for dep in dependencies.get(node, []):
                if dep in remaining:
                    visit(dep)
            
            if node in remaining:
                ordered.append(node)
                remaining.remove(node)
        
        while remaining:
            # Find nodes with no unprocessed dependencies
            ready = [node for node in remaining 
                    if all(dep in visited or dep not in remaining 
                          for dep in dependencies.get(node, []))]
            
            if not ready:
                # Take any remaining node (handles cycles)
                ready = [list(remaining)[0]]
            
            for node in ready:
                visit(node)
        
        return ordered
    
    def _gather_node_inputs(self, node_id: str, dependencies: Dict, results: Dict) -> Dict:
        """Gather inputs for a node from its dependencies"""
        inputs = {}
        
        # Include input data if available
        if '__input__' in results and results['__input__']['status'] == 'success':
            inputs.update(results['__input__']['data'])
        
        # Gather data from dependency nodes
        for dep_node_id in dependencies.get(node_id, []):
            if dep_node_id in results and results[dep_node_id]['status'] == 'success':
                inputs.update(results[dep_node_id]['data'])
        
        return inputs
    
    def _generate_execution_summary(self, results: Dict) -> Dict:
        """Generate a summary of workflow execution"""
        total_nodes = len([k for k in results.keys() if k != '__input__'])
        successful_nodes = len([r for r in results.values() if r['status'] == 'success'])
        failed_nodes = len([r for r in results.values() if r['status'] == 'error'])
        
        # If we count __input__ as successful, adjust
        if '__input__' in results:
            successful_nodes -= 1  # Don't count input in success count
            total_nodes += 1  # But count it in total for percentage
        
        return {
            'total_nodes': total_nodes,
            'successful_nodes': successful_nodes,
            'failed_nodes': failed_nodes,
            'success_rate': successful_nodes / total_nodes if total_nodes > 0 else 0,
            'execution_time': None  # Could add timing if needed
        }
