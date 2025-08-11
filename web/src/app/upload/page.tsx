'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Workflow, ArrowRight } from 'lucide-react';

interface ProcessingResult {
  ocr_text: string;
  extracted_entities: Array<{
    extraction_class: string;
    extraction_text: string;
    attributes?: Record<string, unknown>;
  }>;
  processing_stats: {
    entity_count: number;
    file_size_mb: number;
    ocr_processing_time: number;
    page_count: number;
    text_length: number;
  };
}

interface DocumentType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  endpoint: string;
}

const documentTypes: DocumentType[] = [
  {
    id: 'invoice',
    name: 'Invoice',
    description: 'Automatically extract invoice data including vendor, amounts, dates',
    icon: <FileText className="h-6 w-6" />,
    endpoint: '/process/invoice'
  },
  {
    id: 'custom',
    name: 'Custom Document',
    description: 'Define custom extraction rules for any document type',
    icon: <FileText className="h-6 w-6" />,
    endpoint: '/process/document'
  }
];

export default function UploadPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string>('auto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customExtraction, setCustomExtraction] = useState('');
  const [detectionResult, setDetectionResult] = useState<{type: string, confidence: number, fileName: string} | null>(null);
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    onDrop: handleFileDrop
  });

  async function handleFileDrop(acceptedFiles: File[]) {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsProcessing(true);
    setError(null);
    setResult(null);

    // Variable to track detection result throughout the function
    let currentDetectionResult: {type: string, confidence: number, fileName: string} | null = null;

    try {
      let endpoint = '/api/process/document';
      const formData = new FormData();
      formData.append('file', file);

      // Auto-detect document type or use selected type
      if (selectedType === 'invoice') {
        endpoint = '/api/process/invoice';
        // Set detection result for invoice type
        currentDetectionResult = {
          type: 'invoice',
          confidence: 1.0, // High confidence since user selected it
          fileName: file.name
        };
        setDetectionResult(currentDetectionResult);
      } else if (selectedType === 'custom' && customExtraction) {
        formData.append('extraction_request', customExtraction);
        // Set detection result for custom processing
        currentDetectionResult = {
          type: 'custom',
          confidence: 0.8,
          fileName: file.name
        };
        setDetectionResult(currentDetectionResult);
      } else if (selectedType === 'auto') {
        // For auto-detection, first do OCR to get text, then detect type
        const ocrFormData = new FormData();
        ocrFormData.append('file', file);
        
        const ocrResponse = await fetch('/api/ocr/extract', {
          method: 'POST',
          body: ocrFormData,
        });

        if (!ocrResponse.ok) {
          throw new Error('Failed to extract text for auto-detection');
        }

        const ocrData = await ocrResponse.json();
        
        // Use document detection utility
        const { detectDocumentType, getExtractionConfigForType } = await import('@/lib/documentDetection');
        const { createExtractionRequest } = await import('@/lib/extractionUtils');
        const detectionResult = detectDocumentType(ocrData.text);
        
        console.log('Document detection result:', detectionResult); // Debug log
        
        // Store detection result for potential workflow creation
        currentDetectionResult = {
          type: detectionResult.type,
          confidence: detectionResult.confidence,
          fileName: file.name
        };
        setDetectionResult(currentDetectionResult);
        
        // If we detected an invoice, use the invoice endpoint
        if (detectionResult.type === 'invoice' && detectionResult.confidence > 0.6) {
          endpoint = '/api/process/invoice';
        } else {
          // Use the general document endpoint with auto-generated extraction config
          const entityConfig = getExtractionConfigForType(detectionResult.type);
          
          // Convert to proper ExtractionRequest format
          const extractionRequest = createExtractionRequest(detectionResult.type, entityConfig);
          formData.append('extraction_request', JSON.stringify(extractionRequest));
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Processing failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
      
      // Show workflow creation dialog after successful processing
      console.log('Checking workflow dialog conditions:', { detectionResult: currentDetectionResult, confidence: currentDetectionResult?.confidence }); // Debug log
      
      // Use the local variable instead of state to avoid closure issues
      if (currentDetectionResult) {
        console.log('Showing workflow dialog for:', currentDetectionResult.type, 'with confidence:', currentDetectionResult.confidence); // Debug log
        setShowWorkflowDialog(true);
      } else {
        console.log('No detection result available - dialog will not show'); // Debug log
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  }

  const handleCreateWorkflow = async () => {
    if (!detectionResult) {
      console.error('No detection result available');
      return;
    }

    console.log('Creating workflow for:', detectionResult);

    try {
      const { createWorkflowFromDetection } = await import('@/lib/workflowTemplates');
      const workflowTemplate = createWorkflowFromDetection(
        { 
          type: detectionResult.type, 
          confidence: detectionResult.confidence, 
          reasons: [] 
        },
        detectionResult.fileName
      );
      
      console.log('Generated workflow template:', workflowTemplate);

      // Save the workflow
      console.log('Saving workflow with payload:', {
        name: workflowTemplate.name,
        description: workflowTemplate.description,
        definition: {
          nodes: workflowTemplate.nodes,
          edges: workflowTemplate.edges
        }
      });

      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: workflowTemplate.name,
          description: workflowTemplate.description,
          definition: {
            nodes: workflowTemplate.nodes,
            edges: workflowTemplate.edges
          }
        }),
      });

      console.log('Workflow save response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Workflow saved successfully:', result);
        setShowWorkflowDialog(false);
        router.push('/workflows');
      } else {
        const errorText = await response.text();
        console.error('Workflow save failed:', errorText);
        throw new Error(`Failed to create workflow: ${errorText}`);
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
      setError('Failed to create workflow');
    }
  };

  const handleSkipWorkflow = () => {
    setShowWorkflowDialog(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Document</h1>
        <p className="text-gray-600 mt-2">
          Upload documents for OCR processing and information extraction
        </p>
      </div>

      {/* Document Type Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Document Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setSelectedType('auto')}
            className={`p-4 rounded-lg border-2 text-left ${
              selectedType === 'auto'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Auto-Detect</h3>
                <p className="text-sm text-gray-600">Automatically detect document type</p>
              </div>
            </div>
          </button>

          {documentTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`p-4 rounded-lg border-2 text-left ${
                selectedType === type.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  {type.icon}
                </div>
                <div>
                  <h3 className="font-semibold">{type.name}</h3>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Custom Extraction Configuration */}
        {selectedType === 'custom' && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Extraction Rules (JSON)
            </label>
            <textarea
              value={customExtraction}
              onChange={(e) => setCustomExtraction(e.target.value)}
              placeholder={`{
  "entities": [
    {
      "entity": "company_name",
      "description": "Extract the company name from the document"
    },
    {
      "entity": "date",
      "description": "Extract any dates mentioned"
    }
  ]
}`}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* File Upload Area */}
      <div className="bg-white rounded-lg shadow p-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="flex justify-center">
              <Upload className="h-12 w-12 text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive
                  ? 'Drop the file here...'
                  : 'Drag & drop a document here, or click to select'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Supports PDF, PNG, JPG, JPEG, WebP files up to 50MB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            <div>
              <h3 className="text-lg font-semibold">Processing Document...</h3>
              <p className="text-gray-600">
                Extracting text and analyzing content. This may take a few moments.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">Processing Failed</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-6">
          {/* Processing Statistics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Processing Results</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {result.processing_stats.entity_count}
                </p>
                <p className="text-sm text-gray-600">Entities Found</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {result.processing_stats.page_count}
                </p>
                <p className="text-sm text-gray-600">Pages</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {result.processing_stats.file_size_mb.toFixed(2)}MB
                </p>
                <p className="text-sm text-gray-600">File Size</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {result.processing_stats.ocr_processing_time.toFixed(2)}s
                </p>
                <p className="text-sm text-gray-600">Processing Time</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {result.processing_stats.text_length}
                </p>
                <p className="text-sm text-gray-600">Characters</p>
              </div>
            </div>
          </div>

          {/* Extracted Entities */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Extracted Information</h3>
            <div className="space-y-3">
              {result.extracted_entities.map((entity, index) => (
                <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">
                      {entity.extraction_class.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <p className="text-gray-600 mt-1">{entity.extraction_text}</p>
                  </div>
                  {entity.attributes && (
                    <div className="text-sm text-gray-500">
                      {Object.entries(entity.attributes).map(([key, value]) => (
                        <div key={key}>
                          {key}: {JSON.stringify(value)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* OCR Text Preview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Extracted Text Preview</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {result.ocr_text.substring(0, 2000)}
                {result.ocr_text.length > 2000 && '...'}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Creation Dialog */}
      {showWorkflowDialog && detectionResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-96 max-w-90vw">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Workflow className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Create Workflow?
                </h3>
                <p className="text-gray-600 mb-4">
                  We detected this is a <strong>{detectionResult.type.replace('_', ' ')}</strong> with {Math.round(detectionResult.confidence * 100)}% confidence.
                </p>
                <p className="text-gray-500 text-sm mb-6">
                  Would you like to create a pre-configured workflow optimized for processing {detectionResult.type.replace('_', ' ')} documents?
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-left space-y-2 text-sm">
                  <div className="font-medium text-gray-900">This workflow will include:</div>
                  <ul className="space-y-1 text-gray-600">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      OCR processing optimized for {detectionResult.type}
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      AI extraction with relevant field detection
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Data validation rules
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Export configuration
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleSkipWorkflow}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Skip for Now
                </button>
                <button
                  onClick={handleCreateWorkflow}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  Create Workflow
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
