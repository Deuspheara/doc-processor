import { NextRequest, NextResponse } from 'next/server';
import { detectDocumentType, getExtractionConfigForType } from '@/lib/documentDetection';
import { createExtractionRequest } from '@/lib/extractionUtils';

const API_BASE_URL = process.env.DOCUMENT_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Check if extraction_request is provided
    if (!formData.has('extraction_request')) {
      // Need to detect document type first by doing OCR
      const file = formData.get('file') as File;
      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' }, 
          { status: 400 }
        );
      }

      // First, extract text using OCR
      const ocrFormData = new FormData();
      ocrFormData.append('file', file);
      
      const ocrResponse = await fetch(`${API_BASE_URL}/ocr/extract`, {
        method: 'POST',
        body: ocrFormData,
      });

      if (!ocrResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to extract text for document type detection' }, 
          { status: 500 }
        );
      }

      const ocrData = await ocrResponse.json();
      
      // Detect document type based on OCR text
      const detectionResult = detectDocumentType(ocrData.text);
      
      // If we detected an invoice with high confidence, use the invoice endpoint
      if (detectionResult.type === 'invoice' && detectionResult.confidence > 0.6) {
        const invoiceResponse = await fetch(`${API_BASE_URL}/process/invoice`, {
          method: 'POST',
          body: formData,
        });
        const invoiceData = await invoiceResponse.json();
        return NextResponse.json(invoiceData, { status: invoiceResponse.status });
      } else {
        // Use general document endpoint with type-specific extraction config
        const entityConfig = getExtractionConfigForType(detectionResult.type);
        console.log('Entity config:', entityConfig);
        
        const extractionRequest = createExtractionRequest(detectionResult.type, entityConfig);
        console.log('Extraction request:', JSON.stringify(extractionRequest, null, 2));
        
        formData.append('extraction_request', JSON.stringify(extractionRequest));
      }
    }
    
    const response = await fetch(`${API_BASE_URL}/process/document`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Document processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process document' }, 
      { status: 500 }
    );
  }
}
