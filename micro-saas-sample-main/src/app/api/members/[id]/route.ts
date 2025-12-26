import { NextRequest } from 'next/server';
import { jsonDb } from '@/services/json-db';

// Update member by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, email, phone, plan, status, planRenewalDate } = body;

    // Validate required fields
    if (!name || !email || !phone || !plan || !status) {
      return Response.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if member exists
    const existingMember = await jsonDb.findMemberById(id);
    if (!existingMember) {
      return Response.json(
        { message: 'Member not found' },
        { status: 404 }
      );
    }

    // Calculate renewal date if plan changed and no new date provided
    let renewalDate = planRenewalDate;
    if (!renewalDate && plan !== existingMember.plan) {
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
    } else if (!renewalDate) {
      // Keep the original renewal date if not provided
      renewalDate = existingMember.planRenewalDate;
    }

    // Update member
    const updatedMember = await jsonDb.updateMember(id, {
      name,
      email,
      phone,
      plan,
      status,
      planRenewalDate: renewalDate,
      lastVisit: existingMember.lastVisit, // Keep the original lastVisit unless explicitly changed
      userId: existingMember.userId
    });

    return Response.json(updatedMember);
  } catch (error) {
    console.error('Error updating member:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete member by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if member exists
    const existingMember = await jsonDb.findMemberById(id);
    if (!existingMember) {
      return Response.json(
        { message: 'Member not found' },
        { status: 404 }
      );
    }

    // Delete member
    const deleted = await jsonDb.deleteMember(id);

    if (deleted) {
      return Response.json({ message: 'Member deleted successfully' });
    } else {
      return Response.json(
        { message: 'Failed to delete member' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting member:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}