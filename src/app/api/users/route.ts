import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Example users data - replace with database query
    const users = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ];
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Users GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
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
    
    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Users POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
