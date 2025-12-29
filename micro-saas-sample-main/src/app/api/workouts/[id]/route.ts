import { NextRequest } from 'next/server';
import { jsonDb } from '@/services/json-db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const workoutId = params.id;

    if (!workoutId) {
      return Response.json(
        { message: 'Workout ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, type, duration, level, description, trainerId, assignedMemberIds } = body;

    // Update the workout
    const updatedWorkout = await jsonDb.updateWorkout(workoutId, {
      name,
      type,
      duration,
      level,
      description,
      trainerId,
      assignedMemberIds
    });

    if (!updatedWorkout) {
      return Response.json(
        { message: 'Workout not found' },
        { status: 404 }
      );
    }

    return Response.json(updatedWorkout);
  } catch (error) {
    console.error('Error updating workout:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const workoutId = params.id;

    if (!workoutId) {
      return Response.json(
        { message: 'Workout ID is required' },
        { status: 400 }
      );
    }

    const deleted = await jsonDb.deleteWorkout(workoutId);

    if (!deleted) {
      return Response.json(
        { message: 'Workout not found' },
        { status: 404 }
      );
    }

    return Response.json({ message: 'Workout deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting workout:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}