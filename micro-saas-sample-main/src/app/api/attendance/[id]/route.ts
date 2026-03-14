import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// API route to get attendance records for a specific member
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const { id: memberId } = params;

    if (!memberId || !userId) {
      return Response.json(
        { message: 'Member ID and User ID are required' },
        { status: 400 }
      );
    }

    // Verify that the member belongs to the user
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member || member.userId !== userId) {
      return Response.json(
        { message: 'Member not found or does not belong to user' },
        { status: 404 }
      );
    }

    // Get all attendance records for this member
    const memberAttendance = await prisma.attendance.findMany({
      where: { memberId },
      include: { member: true },
      orderBy: { date: 'desc' },
    });

    return Response.json(memberAttendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// API route to record attendance for a specific member
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: memberId } = params;
    const body = await request.json();
    const { date, checkIn, checkOut, userId } = body;

    // Validate required fields
    if (!memberId || !date || !userId) {
      return Response.json(
        { message: 'Missing required fields: memberId, date, and userId are required' },
        { status: 400 }
      );
    }

    // Check if member exists and belongs to the user
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member || member.userId !== userId) {
      return Response.json(
        { message: 'Member not found or does not belong to user' },
        { status: 404 }
      );
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        date,
        memberId,
        memberEmail: member.email,
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        status: 'Presente',
        userId,
      },
    });

    // Update the member's last visit date
    await prisma.member.update({
      where: { id: memberId },
      data: {
        lastVisit: date,
      },
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

// Update attendance record by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: attendanceId } = params;
    const body = await request.json();
    const { date, checkIn, checkOut, status, userId } = body;

    // Check if attendance record exists
    const attendanceRecord = await prisma.attendance.findUnique({
      where: { id: attendanceId },
    });

    if (!attendanceRecord || attendanceRecord.userId !== userId) {
      return Response.json(
        { message: 'Attendance record not found or does not belong to user' },
        { status: 404 }
      );
    }

    // Update attendance record
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        date,
        checkIn,
        checkOut,
        status,
      },
    });

    return Response.json(updatedAttendance);
  } catch (error) {
    console.error('Error updating attendance:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete attendance record by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: attendanceId } = params;
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!attendanceId || !userId) {
      return Response.json(
        { message: 'Attendance ID and User ID are required' },
        { status: 400 }
      );
    }

    // Check if attendance record exists and belongs to the user
    const attendanceRecord = await prisma.attendance.findUnique({
      where: { id: attendanceId },
    });

    if (!attendanceRecord || attendanceRecord.userId !== userId) {
      return Response.json(
        { message: 'Attendance record not found or does not belong to user' },
        { status: 404 }
      );
    }

    // Delete attendance record
    await prisma.attendance.delete({
      where: { id: attendanceId },
    });

    return Response.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
