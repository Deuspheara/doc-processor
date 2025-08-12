import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.DOCUMENT_API_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const documentId = id;

    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/results/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: response.status === 404 ? 'Document or results not found' : 'Failed to fetch document results' 
      }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Document results API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document results' },
      { status: 500 }
    );
  }
}