import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Example users data - replace with database query
    const users = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ];
    
    const response = NextResponse.json({ users });
    
    // Cache for 1 minute - user list changes infrequently
    // Use private cache since this could contain sensitive data
    response.headers.set('Cache-Control', 'private, max-age=60');
    
    return response;
  } catch (error) {
    console.error('Users GET error:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
    
    errorResponse.headers.set('Cache-Control', 'no-store');
    return errorResponse;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle user creation logic here
    console.log('Create user:', body);
    
    // Example response - replace with actual user creation
    const newUser = {
      id: Date.now(),
      ...body,
      createdAt: new Date().toISOString()
    };
    
    const response = NextResponse.json({ user: newUser }, { status: 201 });
    
    // Don't cache POST requests (write operations)
    response.headers.set('Cache-Control', 'no-store');
    
    return response;
  } catch (error) {
    console.error('Users POST error:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
    
    errorResponse.headers.set('Cache-Control', 'no-store');
    return errorResponse;
  }
}
