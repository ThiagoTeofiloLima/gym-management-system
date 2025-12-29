import { NextRequest } from 'next/server';
import { jsonDb } from '@/services/json-db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const trainerId = params.id;

    if (!trainerId) {
      return Response.json(
        { message: 'Trainer ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, phone, specialty, status, certifications, assignedMemberIds } = body;

    // Update the trainer
    const updatedTrainer = await jsonDb.updateTrainer(trainerId, {
      name,
      email,
      phone,
      specialty,
      status,
      certifications,
      assignedMemberIds
    });

    if (!updatedTrainer) {
      return Response.json(
        { message: 'Trainer not found' },
        { status: 404 }
      );
    }

    return Response.json(updatedTrainer);
  } catch (error) {
    console.error('Error updating trainer:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const trainerId = params.id;

    if (!trainerId) {
      return Response.json(
        { message: 'Trainer ID is required' },
        { status: 400 }
      );
    }

    const deleted = await jsonDb.deleteTrainer(trainerId);

    if (!deleted) {
      return Response.json(
        { message: 'Trainer not found' },
        { status: 404 }
      );
    }

    return Response.json({ message: 'Trainer deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting trainer:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}