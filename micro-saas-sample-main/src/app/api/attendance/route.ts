import { NextRequest } from 'next/server';
import { jsonDb } from '@/services/json-db';

// API route to get attendance records for a user
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

    // Get all attendance records for this user
    const allAttendance = await jsonDb.getData();
    const userAttendance = allAttendance.attendance.filter(
      (record) => record.userId === userId
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by date, newest first

    return Response.json(userAttendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// API route to record attendance for a member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { memberId, date, checkIn, checkOut, userId } = body;

    // Validate required fields
    if (!memberId || !date || !userId) {
      return Response.json(
        { message: 'Missing required fields: memberId, date, and userId are required' },
        { status: 400 }
      );
    }

    // Check if member exists and belongs to the user
    const member = await jsonDb.findMemberById(memberId);
    if (!member || member.userId !== userId) {
      return Response.json(
        { message: 'Member not found or does not belong to user' },
        { status: 404 }
      );
    }

    // Create attendance record
    const attendance = await jsonDb.createAttendance({
      date,
      member: member.name,
      memberEmail: member.email,
      checkIn: checkIn || null,
      checkOut: checkOut || null,
      status: 'Presente', // Default status
      userId
    });

    // Update the member's last visit date
    await jsonDb.updateMember(memberId, {
      lastVisit: date
    });

    return Response.json(attendance, { status: 201 });
  } catch (error) {
    console.error('Error recording attendance:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}