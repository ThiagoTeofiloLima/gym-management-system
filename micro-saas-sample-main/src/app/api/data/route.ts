import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/services/auth';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const gymId = url.searchParams.get('gymId');

    if (!gymId) {
      // Retorna dados vazios se não tiver gymId
      return Response.json({
        members: [],
        attendance: [],
        financial: [],
        gymId: null,
      });
    }

    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se usuário tem acesso a esta academia
    const userGym = await prisma.userGym.findUnique({
      where: {
        userId_gymId: {
          userId: session.user.id,
          gymId: gymId,
        },
      },
    });

    if (!userGym) {
      return Response.json({ error: 'Access denied to this gym' }, { status: 403 });
    }

    // Buscar dados filtrados por gymId
    const [members, financial] = await Promise.all([
      prisma.member.findMany({
        where: { gymId },
        include: {
          trainer: { select: { id: true, name: true } },
        },
      }),
      prisma.expense.findMany({
        where: { gymId },
      }),
    ]);

    // Buscar attendance dos membros da academia
    const memberIds = members.map(m => m.id);
    const attendance = memberIds.length > 0 ? await prisma.attendance.findMany({
      where: {
        memberId: { in: memberIds },
      },
      include: { member: true },
      orderBy: { date: 'desc' },
    }) : [];

    return Response.json({
      members,
      attendance,
      financial,
      gymId,
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
