import { NextRequest } from 'next/server';
import { jsonDb } from '@/services/json-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, plan, userId, planRenewalDate } = body;

    // Validate required fields
    if (!name || !email || !phone || !plan || !userId) {
      return Response.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if member with this email already exists for this user
    const allData = await jsonDb.getData();
    const existingMember = allData.members.find(
      (member) => member.email === email && member.userId === userId
    );

    if (existingMember) {
      return Response.json(
        { message: 'Member with this email already exists' },
        { status: 409 }
      );
    }

    // Calculate renewal date if not provided
    let renewalDate = planRenewalDate;
    if (!renewalDate) {
      const today = new Date();
      switch (plan.toLowerCase()) {
        case 'mensal':
          today.setMonth(today.getMonth() + 1);
          break;
        case 'trimestral':
          today.setMonth(today.getMonth() + 3);
          break;
        case 'anual':
          today.setFullYear(today.getFullYear() + 1);
          break;
        default:
          today.setMonth(today.getMonth() + 1); // Default to monthly
      }
      renewalDate = today.toISOString().split('T')[0];
    }

    // Create new member
    const newMember = await jsonDb.createMember({
      name,
      email,
      phone,
      plan,
      status: 'Ativo', // Default status
      lastVisit: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      planRenewalDate: renewalDate,
      userId
    });

    return Response.json(newMember, { status: 201 });
  } catch (error) {
    console.error('Error creating member:', error);
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