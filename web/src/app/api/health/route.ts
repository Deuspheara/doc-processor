import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.DOCUMENT_API_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to connect to document processing API',
        mistral_api_configured: false,
        langextract_api_configured: false,
        available_endpoints: []
      }, 
      { status: 503 }
    );
  }
}
