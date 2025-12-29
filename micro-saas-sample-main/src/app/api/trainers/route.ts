import { NextRequest } from 'next/server';
import { jsonDb } from '@/services/json-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, specialty, certifications, userId } = body;

    // Validate required fields
    if (!name || !email || !phone || !specialty || !userId) {
      return Response.json(
        { message: 'Missing required fields: name, email, phone, specialty, or userId' },
        { status: 400 }
      );
    }

    // Check if trainer with this email already exists for this user
    const allData = await jsonDb.getData();
    const existingTrainer = allData.trainers.find(
      (trainer) => trainer.email === email && trainer.userId === userId
    );

    if (existingTrainer) {
      return Response.json(
        { message: 'Trainer with this email already exists' },
        { status: 409 }
      );
    }

    // Create new trainer
    const newTrainer = await jsonDb.createTrainer({
      name,
      email,
      phone,
      specialty,
      status: 'Ativo', // Default status
      certifications: certifications || [],
      userId
    });

    return Response.json(newTrainer, { status: 201 });
  } catch (error) {
    console.error('Error creating trainer:', error);
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

    const userTrainers = await jsonDb.findTrainersByUserId(userId);

    // Get member information for each trainer
    const allData = await jsonDb.getData();
    const userMembers = allData.members.filter(member => member.userId === userId);

    const trainersWithMembers = userTrainers.map(trainer => {
      const assignedMemberIds = trainer.assignedMemberIds || [];
      const assignedMembers = assignedMemberIds.map(memberId => {
        const member = userMembers.find(m => m.id === memberId);
        return member ? { id: member.id, name: member.name, email: member.email } : null;
      }).filter(Boolean);

      return {
        ...trainer,
        members: assignedMembers
      };
    });

    return Response.json(trainersWithMembers);
  } catch (error) {
    console.error('Error fetching trainers:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}