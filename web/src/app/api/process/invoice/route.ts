import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

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
      // Add document ID to form data
      formData.append('document_id', docId);
      
      const response = await fetch(`${API_BASE_URL}/process/invoice`, {
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
          error_message: data.error || 'Invoice processing failed'
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
    console.error('Invoice processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process invoice' }, 
      { status: 500 }
    );
  }
}
