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
    const { name, email, phone, plan, status, planRenewalDate, paymentDate } = body;

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

    // Calculate renewal date based on payment date and plan
    let renewalDate = planRenewalDate;
    let paymentDateValue = paymentDate;

    if (!paymentDateValue) {
      // If no payment date provided, keep the existing one or use today's date
      paymentDateValue = existingMember.paymentDate || new Date().toISOString().split('T')[0];
    } else {
      // If payment date is provided, use it and calculate renewal date
      // Parse the date string to avoid timezone issues
      const [year, month, day] = paymentDateValue.split('-').map(Number);
      const paymentDateObj = new Date(year, month - 1, day); // month is 0-indexed in JS Date
      switch (plan.toLowerCase()) {
        case 'mensal':
          paymentDateObj.setMonth(paymentDateObj.getMonth() + 1);
          break;
        case 'trimestral':
          paymentDateObj.setMonth(paymentDateObj.getMonth() + 3);
          break;
        case 'anual':
          paymentDateObj.setFullYear(paymentDateObj.getFullYear() + 1);
          break;
        default:
          paymentDateObj.setMonth(paymentDateObj.getMonth() + 1); // Default to monthly
      }
      // Format date back to YYYY-MM-DD format to avoid timezone conversion
      const year_renewal = paymentDateObj.getFullYear();
      const month_renewal = String(paymentDateObj.getMonth() + 1).padStart(2, '0');
      const day_renewal = String(paymentDateObj.getDate()).padStart(2, '0');
      renewalDate = `${year_renewal}-${month_renewal}-${day_renewal}`;
    }

    // Update member
    const updatedMember = await jsonDb.updateMember(id, {
      name,
      email,
      phone,
      plan,
      status,
      planRenewalDate: renewalDate,
      paymentDate: paymentDateValue,
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