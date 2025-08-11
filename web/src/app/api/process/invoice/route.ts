import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.DOCUMENT_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const response = await fetch(`${API_BASE_URL}/process/invoice`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Invoice processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process invoice' }, 
      { status: 500 }
    );
  }
}
