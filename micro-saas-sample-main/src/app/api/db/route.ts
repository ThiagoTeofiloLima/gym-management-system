import { NextRequest } from 'next/server';
import { JsonDatabase } from '@/services/json-db';

const db = new JsonDatabase();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const resource = searchParams.get('resource'); // e.g., 'attendance', 'members', 'trainers', etc.

    if (!userId || !resource) {
      return Response.json({ error: 'userId and resource are required' }, { status: 400 });
    }

    const allData = await db.getData();

    switch (resource) {
      case 'attendance':
        const userAttendance = allData.attendance.filter(record => record.userId === userId);
        return Response.json(userAttendance);
      case 'members':
        const userMembers = allData.members.filter(record => record.userId === userId);
        return Response.json(userMembers);
      case 'trainers':
        const userTrainers = allData.trainers.filter(record => record.userId === userId);
        return Response.json(userTrainers);
      case 'workouts':
        const userWorkouts = allData.workouts.filter(record => record.userId === userId);
        return Response.json(userWorkouts);
      case 'financial':
        const userFinancial = allData.financial.filter(record => record.userId === userId);
        return Response.json(userFinancial);
      case 'all':
        // Return all data for the user
        return Response.json({
          attendance: allData.attendance.filter(record => record.userId === userId),
          members: allData.members.filter(record => record.userId === userId),
          trainers: allData.trainers.filter(record => record.userId === userId),
          workouts: allData.workouts.filter(record => record.userId === userId),
          financial: allData.financial.filter(record => record.userId === userId)
        });
      default:
        return Response.json({ error: 'Invalid resource type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, resource, data } = await request.json();

    if (!userId || !resource || !data) {
      return Response.json({ error: 'userId, resource, and data are required' }, { status: 400 });
    }

    switch (resource) {
      case 'attendance':
        const newAttendance = await db.createAttendance({ ...data, userId });
        return Response.json(newAttendance);
      case 'members':
        const newMember = await db.createMember({ ...data, userId });
        return Response.json(newMember);
      case 'trainers':
        const newTrainer = await db.createTrainer({ ...data, userId });
        return Response.json(newTrainer);
      case 'workouts':
        const newWorkout = await db.createWorkout({ ...data, userId });
        return Response.json(newWorkout);
      case 'financial':
        const newFinancial = await db.createFinancial({ ...data, userId });
        return Response.json(newFinancial);
      default:
        return Response.json({ error: 'Invalid resource type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error creating data:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, resource, data } = await request.json();

    if (!id || !resource || !data) {
      return Response.json({ error: 'id, resource, and data are required' }, { status: 400 });
    }

    switch (resource) {
      case 'attendance':
        const updatedAttendance = await db.updateAttendance(id, data);
        return Response.json(updatedAttendance);
      case 'members':
        const updatedMember = await db.updateMember(id, data);
        return Response.json(updatedMember);
      case 'trainers':
        const updatedTrainer = await db.updateTrainer(id, data);
        return Response.json(updatedTrainer);
      case 'workouts':
        const updatedWorkout = await db.updateWorkout(id, data);
        return Response.json(updatedWorkout);
      case 'financial':
        const updatedFinancial = await db.updateFinancial(id, data);
        return Response.json(updatedFinancial);
      default:
        return Response.json({ error: 'Invalid resource type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating data:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const resource = searchParams.get('resource');

    if (!id || !resource) {
      return Response.json({ error: 'id and resource are required' }, { status: 400 });
    }

    switch (resource) {
      case 'attendance':
        const deletedAttendance = await db.deleteAttendance(id);
        return Response.json({ deleted: deletedAttendance });
      case 'members':
        const deletedMember = await db.deleteMember(id);
        return Response.json({ deleted: deletedMember });
      case 'trainers':
        const deletedTrainer = await db.deleteTrainer(id);
        return Response.json({ deleted: deletedTrainer });
      case 'workouts':
        const deletedWorkout = await db.deleteWorkout(id);
        return Response.json({ deleted: deletedWorkout });
      case 'financial':
        const deletedFinancial = await db.deleteFinancial(id);
        return Response.json({ deleted: deletedFinancial });
      default:
        return Response.json({ error: 'Invalid resource type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error deleting data:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}