import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { detectDocumentType, getExtractionConfigForType } from '@/lib/documentDetection';
import { createExtractionRequest } from '@/lib/extractionUtils';

const API_BASE_URL = process.env.DOCUMENT_API_URL || 'http://localhost:8000';

// Helper function to clean processing result data for Convex
function cleanProcessingResult(data: any): any {
  if (data === null || data === undefined) {
    return undefined;
  }
  
  if (Array.isArray(data)) {
    return data.map(cleanProcessingResult).filter(item => item !== undefined);
  }
  
  if (typeof data === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(data)) {
      const cleanedValue = cleanProcessingResult(value);
      if (cleanedValue !== undefined && cleanedValue !== null) {
        cleaned[key] = cleanedValue;
      }
    }
    return cleaned;
  }
  
  return data;
}

export async function POST(request: NextRequest) {
  try {
    // Get authentication info
    const { userId, getToken } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the Convex token from Clerk
    const token = await getToken({ template: 'convex' });
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unable to get authentication token' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    
    // Create authenticated Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    convex.setAuth(token);

    // Get the file for processing
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' }, 
        { status: 400 }
      );
    }

    // Store initial document record in Convex with userId
    const docId = await convex.mutation(api.documents.create, {
      filename: file.name,
      file_size_mb: file.size / (1024 * 1024), // Convert bytes to MB
      content_type: file.type || 'application/octet-stream',
      status: 'processing' as const,
      userId: userId
    });

    try {
      // Check if extraction_request is provided
      if (!formData.has('extraction_request')) {
        // Need to detect document type first by doing OCR
        // First, extract text using OCR
        const ocrFormData = new FormData();
        ocrFormData.append('file', file);
        
        const ocrResponse = await fetch(`${API_BASE_URL}/ocr/extract`, {
          method: 'POST',
          body: ocrFormData,
        });

        if (!ocrResponse.ok) {
          // Update document status to failed
          await convex.mutation(api.documents.update, {
            id: docId,
            status: 'failed' as const,
            error_message: 'Failed to extract text for document type detection'
          });
          return NextResponse.json(
            { error: 'Failed to extract text for document type detection' }, 
            { status: 500 }
          );
        }

        const ocrData = await ocrResponse.json();
        
        // Detect document type based on OCR text
        const detectionResult = detectDocumentType(ocrData.text);
        
        // If we detected an invoice, use the invoice endpoint (lowered threshold)
        if (detectionResult.type === 'invoice' && detectionResult.confidence > 0.3) {
          // Add document ID to form data
          formData.append('document_id', docId);
          
          const invoiceResponse = await fetch(`${API_BASE_URL}/process/invoice`, {
            method: 'POST',
            body: formData,
          });
          const invoiceData = await invoiceResponse.json();
          
          // Update document with processing results since Python backend won't do it
          if (invoiceResponse.ok) {
            await convex.mutation(api.documents.update, {
              id: docId,
              status: 'processed' as const,
              processing_result: cleanProcessingResult(invoiceData),
              bypass_auth: true
            });
          } else {
            await convex.mutation(api.documents.update, {
              id: docId,
              status: 'failed' as const,
              error_message: 'Invoice processing failed'
            });
          }
          
          return NextResponse.json(invoiceData, { status: invoiceResponse.status });
        } 
        // Also check if the text contains obvious invoice keywords as fallback
        else if (ocrData.text.toLowerCase().includes('invoice') || 
                 ocrData.text.toLowerCase().includes('billed to') ||
                 ocrData.text.match(/total.*€|total.*\$/i) ||
                 ocrData.text.match(/vat|tax/i)) {
          // Add document ID to form data
          formData.append('document_id', docId);
          
          const invoiceResponse = await fetch(`${API_BASE_URL}/process/invoice`, {
            method: 'POST',
            body: formData,
          });
          const invoiceData = await invoiceResponse.json();
          
          // Update document with processing results since Python backend won't do it
          if (invoiceResponse.ok) {
            await convex.mutation(api.documents.update, {
              id: docId,
              status: 'processed' as const,
              processing_result: cleanProcessingResult(invoiceData),
              bypass_auth: true
            });
          } else {
            await convex.mutation(api.documents.update, {
              id: docId,
              status: 'failed' as const,
              error_message: 'Invoice processing failed'
            });
          }
          
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
      
      // Add document ID to form data for the general document processing
      formData.append('document_id', docId);
      
      const response = await fetch(`${API_BASE_URL}/process/document`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      // Update document with processing results since Python backend won't do it
      if (response.ok) {
        await convex.mutation(api.documents.update, {
          id: docId,
          status: 'processed' as const,
          processing_result: cleanProcessingResult(data),
          bypass_auth: true
        });
      } else {
        await convex.mutation(api.documents.update, {
          id: docId,
          status: 'failed' as const,
          error_message: data.error || 'Processing failed'
        });
      }
      
      return NextResponse.json(data, { status: response.status });
    } catch (error) {
      // Update document status to failed
      await convex.mutation(api.documents.update, {
        id: docId,
        status: 'failed' as const,
        error_message: error instanceof Error ? error.message : 'Processing failed'
      });
      throw error;
    }
  } catch (error) {
    console.error('Document processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process document' }, 
      { status: 500 }
    );
  }
}
