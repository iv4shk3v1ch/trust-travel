import { NextResponse } from 'next/server';

export async function GET() {
  const response = NextResponse.json({ message: 'Auth GET endpoint' });
  
  // Cache static endpoint info for 1 hour
  response.headers.set('Cache-Control', 'public, max-age=3600');
  
  return response;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Handle authentication logic here
    console.log('Auth POST request:', body);
    
    const response = NextResponse.json({ message: 'Auth POST endpoint', data: body });
    
    // Don't cache auth operations (sensitive, session-specific)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    
    return response;
  } catch {
    const errorResponse = NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
    
    errorResponse.headers.set('Cache-Control', 'no-store');
    return errorResponse;
  }
}
