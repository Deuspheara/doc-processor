import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Create authenticated Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    convex.setAuth(token);

    const { id } = await params;
    
    try {
      const document = await convex.query(api.documents.get, { 
        id: id as Id<"documents"> 
      });
      
      if (!document) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }

      if (!document.processing_result) {
        return NextResponse.json(
          { error: 'No processing results available for this document' },
          { status: 404 }
        );
      }

      return NextResponse.json(document.processing_result);
    } catch (error) {
      if (error instanceof Error && error.message === 'Access denied') {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Document results API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document results' },
      { status: 500 }
    );
  }
}