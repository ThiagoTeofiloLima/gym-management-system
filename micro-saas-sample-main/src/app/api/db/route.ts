import { NextRequest } from 'next/server';
import * as db from '@/services/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const resource = searchParams.get('resource');

    if (!userId || !resource) {
      return Response.json({ error: 'userId and resource are required' }, { status: 400 });
    }

    switch (resource) {
      case 'attendance': {
        const attendance = await db.findAttendanceRecords({ userId });
        return Response.json(attendance);
      }
      case 'members': {
        const members = await db.findMembers({ userId });
        return Response.json(members);
      }
      case 'trainers': {
        const trainers = await db.findTrainers({ userId });
        return Response.json(trainers);
      }
      case 'workouts': {
        const workouts = await db.findWorkouts({ userId });
        return Response.json(workouts);
      }
      case 'financial': {
        const financial = await db.findExpenses({ userId });
        return Response.json(financial);
      }
      case 'all': {
        const [attendance, members, trainers, workouts, financial] = await Promise.all([
          db.findAttendanceRecords({ userId }),
          db.findMembers({ userId }),
          db.findTrainers({ userId }),
          db.findWorkouts({ userId }),
          db.findExpenses({ userId }),
        ]);
        return Response.json({
          attendance,
          members,
          trainers,
          workouts,
          financial,
        });
      }
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
      case 'attendance': {
        const newAttendance = await db.createAttendance({
          ...data,
          userId,
          date: data.date || new Date().toISOString().split('T')[0],
          status: data.status || 'Presente',
        });
        return Response.json(newAttendance);
      }
      case 'members': {
        const newMember = await db.createMember({
          ...data,
          userId,
          paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
        });
        return Response.json(newMember);
      }
      case 'trainers': {
        const newTrainer = await db.createTrainer({
          ...data,
          userId,
          certifications: Array.isArray(data.certifications)
            ? data.certifications.join(', ')
            : data.certifications || '',
        });
        return Response.json(newTrainer);
      }
      case 'workouts': {
        const newWorkout = await db.createWorkout({
          ...data,
          userId,
        });
        return Response.json(newWorkout);
      }
      case 'financial': {
        const newFinancial = await db.createExpense({
          ...data,
          userId,
          date: data.date || new Date().toISOString(),
        });
        return Response.json(newFinancial);
      }
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
      case 'attendance': {
        const updatedAttendance = await db.updateAttendance(id, data);
        return Response.json(updatedAttendance);
      }
      case 'members': {
        const updatedMember = await db.updateMember(id, {
          ...data,
          paymentDate: data.paymentDate || undefined,
        });
        return Response.json(updatedMember);
      }
      case 'trainers': {
        const updatedTrainer = await db.updateTrainer(id, {
          ...data,
          certifications: Array.isArray(data.certifications)
            ? data.certifications.join(', ')
            : data.certifications,
        });
        return Response.json(updatedTrainer);
      }
      case 'workouts': {
        const updatedWorkout = await db.updateWorkout(id, data);
        return Response.json(updatedWorkout);
      }
      case 'financial': {
        const updatedFinancial = await db.updateExpense(id, {
          ...data,
          date: data.date || undefined,
        });
        return Response.json(updatedFinancial);
      }
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
      case 'attendance': {
        await db.deleteAttendance(id);
        return Response.json({ deleted: true });
      }
      case 'members': {
        await db.deleteMember(id);
        return Response.json({ deleted: true });
      }
      case 'trainers': {
        await db.deleteTrainer(id);
        return Response.json({ deleted: true });
      }
      case 'workouts': {
        await db.deleteWorkout(id);
        return Response.json({ deleted: true });
      }
      case 'financial': {
        await db.deleteExpense(id);
        return Response.json({ deleted: true });
      }
      default:
        return Response.json({ error: 'Invalid resource type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error deleting data:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
