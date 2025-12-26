import { NextRequest } from 'next/server';
import { jsonDb } from '@/services/json-db';

// This API route allows getting members by user ID from the client side
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return Response.json(
        { message: 'User ID is required' },
        { status: 400 }
      );
    }

    const allData = await jsonDb.getData();
    const userMembers = allData.members.filter(
      (member) => member.userId === userId
    );

    return Response.json(userMembers);
  } catch (error) {
    console.error('Error fetching members:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}