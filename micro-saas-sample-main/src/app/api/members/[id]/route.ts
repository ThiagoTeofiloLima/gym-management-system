import { NextRequest } from 'next/server';
import { jsonDb } from '@/services/json-db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await request.json();
    
    // Update member in the database
    const updatedMember = await jsonDb.updateMember(id, body);
    
    if (!updatedMember) {
      return Response.json({ error: 'Member not found' }, { status: 404 });
    }
    
    return Response.json(updatedMember);
  } catch (error) {
    console.error('Error updating member:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    
    // Delete member from the database
    const success = await jsonDb.deleteMember(id);
    
    if (!success) {
      return Response.json({ error: 'Member not found' }, { status: 404 });
    }
    
    return Response.json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Error deleting member:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}