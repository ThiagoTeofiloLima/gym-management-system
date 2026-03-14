import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/services/auth';
import { getTenantContext } from '@/lib/multi-tenant';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const gymId = url.searchParams.get('gymId');

    // Se gymId estiver especificado, buscar dados do Prisma filtrados
    if (gymId) {
      const session = await auth();
      if (!session?.user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const context = await getTenantContext();
      if (!context) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Verificar se usuário tem acesso a esta academia
      if (!context.isSuperAdmin && !context.gyms?.some((g: any) => g.gymId === gymId)) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
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
      const attendance = await prisma.attendance.findMany({
        where: {
          memberId: { in: memberIds },
        },
        include: { member: true },
        orderBy: { date: 'desc' },
      });

      return Response.json({
        members,
        attendance,
        financial,
        gymId,
      });
    }

    // Sem gymId, retorna erro (não usa mais JSON)
    return Response.json({ error: 'gymId is required' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching data:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
