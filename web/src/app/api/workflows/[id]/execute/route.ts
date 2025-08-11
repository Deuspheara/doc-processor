import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Parse form data (for file uploads)
    const formData = await request.formData();
    
    // Forward the form data to the backend
    const response = await fetch(`${BACKEND_URL}/api/workflows/${id}/execute`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Workflow not found' },
          { status: 404 }
        );
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Workflow execution failed: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to execute workflow:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute workflow' },
      { status: 500 }
    );
  }
}
