import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status_filter = searchParams.get('status') || undefined;

    // Query documents from Convex (will automatically filter by userId)
    const result = await convex.query(api.documents.list, {
      limit,
      offset,
      status_filter
    });

    // Transform documents to use 'id' instead of '_id' for frontend compatibility
    const transformedResult = {
      ...result,
      documents: result.documents.map((doc: any) => ({
        ...doc,
        id: doc._id,
        _id: undefined
      }))
    };

    return NextResponse.json(transformedResult);
  } catch (error) {
    console.error('Documents API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}