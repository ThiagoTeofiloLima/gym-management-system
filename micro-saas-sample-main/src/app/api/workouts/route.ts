import { NextRequest } from 'next/server';
import { jsonDb } from '@/services/json-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, duration, level, description, trainerId, userId } = body;

    // Validate required fields
    if (!name || !type || !duration || !level || !userId) {
      return Response.json(
        { message: 'Missing required fields: name, type, duration, level, or userId' },
        { status: 400 }
      );
    }

    // Create new workout
    const newWorkout = await jsonDb.createWorkout({
      name,
      type,
      duration,
      level,
      description,
      trainerId: trainerId || undefined,
      assignedMemberIds: [],
      userId
    });

    return Response.json(newWorkout, { status: 201 });
  } catch (error) {
    console.error('Error creating workout:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const userWorkouts = await jsonDb.findWorkoutsByUserId(userId);

    // Get member and trainer information for each workout
    const allData = await jsonDb.getData();
    const userMembers = allData.members.filter(member => member.userId === userId);
    const userTrainers = allData.trainers.filter(trainer => trainer.userId === userId);

    const workoutsWithDetails = userWorkouts.map(workout => {
      const assignedMembers = workout.assignedMemberIds.map(memberId => {
        const member = userMembers.find(m => m.id === memberId);
        return member ? { id: member.id, name: member.name, email: member.email } : null;
      }).filter(Boolean);

      const trainer = userTrainers.find(t => t.id === workout.trainerId);

      return {
        ...workout,
        members: assignedMembers,
        trainer: trainer ? { id: trainer.id, name: trainer.name } : null
      };
    });

    return Response.json(workoutsWithDetails);
  } catch (error) {
    console.error('Error fetching workouts:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}