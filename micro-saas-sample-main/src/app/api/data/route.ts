import { NextRequest } from 'next/server';
import * as db from '@/services/database';
import { auth } from '@/services/auth';
import type { Attendance } from '@/types/database';

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
    const userGym = await db.findUserGymByUserIdGymId(session.user.id, gymId);

    if (!userGym) {
      return Response.json({ error: 'Access denied to this gym' }, { status: 403 });
    }

    // Buscar dados filtrados por gymId
    const [members, financial] = await Promise.all([
      db.findMembers({ gymId }),
      db.findExpenses({ gymId }),
    ]);

    // Buscar attendance dos membros da academia
    const memberIds = members.map(m => m.id);
    let attendance: Attendance[] = [];
    if (memberIds.length > 0) {
      // Buscar attendance para cada membro (já que não há filtro por múltiplos memberIds)
      const attendancePromises = memberIds.map(memberId =>
        db.findAttendanceRecords({ memberId })
      );
      const attendanceResults = await Promise.all(attendancePromises);
      attendance = attendanceResults.flat().sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }

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
