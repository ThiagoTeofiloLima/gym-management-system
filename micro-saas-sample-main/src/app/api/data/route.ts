import { NextRequest } from 'next/server';
import { jsonDb } from '@/services/json-db';

export async function GET(request: NextRequest) {
  try {
    const data = await jsonDb.getData();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}