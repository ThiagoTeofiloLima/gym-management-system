import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

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
        const attendance = await prisma.attendance.findMany({
          where: { userId },
          include: { member: true },
          orderBy: { date: 'desc' },
        });
        return Response.json(attendance);
      }
      case 'members': {
        const members = await prisma.member.findMany({
          where: { userId },
          include: { trainer: true },
          orderBy: { name: 'asc' },
        });
        return Response.json(members);
      }
      case 'trainers': {
        const trainers = await prisma.trainer.findMany({
          where: { userId },
          orderBy: { name: 'asc' },
        });
        return Response.json(trainers);
      }
      case 'workouts': {
        const workouts = await prisma.workout.findMany({
          where: { userId },
          include: {
            workoutMembers: {
              include: { member: true },
            },
            trainer: true,
          },
          orderBy: { name: 'asc' },
        });
        return Response.json(workouts);
      }
      case 'financial': {
        const financial = await prisma.expense.findMany({
          where: { userId },
          orderBy: { date: 'desc' },
        });
        return Response.json(financial);
      }
      case 'all': {
        const [attendance, members, trainers, workouts, financial] = await Promise.all([
          prisma.attendance.findMany({
            where: { userId },
            include: { member: true },
            orderBy: { date: 'desc' },
          }),
          prisma.member.findMany({
            where: { userId },
            include: { trainer: true },
            orderBy: { name: 'asc' },
          }),
          prisma.trainer.findMany({
            where: { userId },
            orderBy: { name: 'asc' },
          }),
          prisma.workout.findMany({
            where: { userId },
            include: {
              workoutMembers: {
                include: { member: true },
              },
              trainer: true,
            },
            orderBy: { name: 'asc' },
          }),
          prisma.expense.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
          }),
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
        const newAttendance = await prisma.attendance.create({
          data: {
            ...data,
            userId,
            date: data.date || new Date().toISOString().split('T')[0],
            status: data.status || 'Presente',
          },
        });
        return Response.json(newAttendance);
      }
      case 'members': {
        const newMember = await prisma.member.create({
          data: {
            ...data,
            userId,
            paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
          },
        });
        return Response.json(newMember);
      }
      case 'trainers': {
        const newTrainer = await prisma.trainer.create({
          data: {
            ...data,
            userId,
            certifications: Array.isArray(data.certifications)
              ? data.certifications.join(', ')
              : data.certifications || '',
          },
        });
        return Response.json(newTrainer);
      }
      case 'workouts': {
        const newWorkout = await prisma.workout.create({
          data: {
            ...data,
            userId,
          },
        });
        return Response.json(newWorkout);
      }
      case 'financial': {
        const newFinancial = await prisma.expense.create({
          data: {
            ...data,
            userId,
            date: data.date ? new Date(data.date) : new Date(),
          },
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
        const updatedAttendance = await prisma.attendance.update({
          where: { id },
          data,
        });
        return Response.json(updatedAttendance);
      }
      case 'members': {
        const updatedMember = await prisma.member.update({
          where: { id },
          data: {
            ...data,
            paymentDate: data.paymentDate || undefined,
          },
        });
        return Response.json(updatedMember);
      }
      case 'trainers': {
        const updatedTrainer = await prisma.trainer.update({
          where: { id },
          data: {
            ...data,
            certifications: Array.isArray(data.certifications)
              ? data.certifications.join(', ')
              : data.certifications,
          },
        });
        return Response.json(updatedTrainer);
      }
      case 'workouts': {
        const updatedWorkout = await prisma.workout.update({
          where: { id },
          data,
        });
        return Response.json(updatedWorkout);
      }
      case 'financial': {
        const updatedFinancial = await prisma.expense.update({
          where: { id },
          data: {
            ...data,
            date: data.date ? new Date(data.date) : undefined,
          },
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
        await prisma.attendance.delete({
          where: { id },
        });
        return Response.json({ deleted: true });
      }
      case 'members': {
        await prisma.member.delete({
          where: { id },
        });
        return Response.json({ deleted: true });
      }
      case 'trainers': {
        await prisma.trainer.delete({
          where: { id },
        });
        return Response.json({ deleted: true });
      }
      case 'workouts': {
        await prisma.workout.delete({
          where: { id },
        });
        return Response.json({ deleted: true });
      }
      case 'financial': {
        await prisma.expense.delete({
          where: { id },
        });
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
