import {
    DashboardPage,
    DashboardPageHeader,
    DashboardPageHeaderTitle,
    DashboardPageMain,
} from "@/components/dashboard/page"
import { prisma } from "@/services/database"
import { auth } from "@/services/auth"
import { getTenantContext } from "@/lib/multi-tenant"
import AttendancePageClient from "../__components/attendance/attendance-page-client"

/**
 * Página de Frequência (Server Component)
 */
export default async function AttendancePage(props: {
    searchParams: Promise<{ gymId?: string }>
}) {
    const searchParams = await props.searchParams
    let queryGymId = searchParams.gymId

    const session = await auth()

    if (!session?.user) {
        return <div>Unauthorized</div>
    }

    const context = await getTenantContext()

    if (!context) {
        return <div>Unauthorized</div>
    }

    // Obter gymId
    let gymIdFilter: string | undefined

    if (queryGymId) {
        gymIdFilter = queryGymId
    } else if (context.gymId) {
        gymIdFilter = context.gymId
    } else if (context.gyms && context.gyms.length > 0) {
        const firstGym = context.gyms.find((g: any) => g.status === 'ACTIVE' && g.isActive)
        gymIdFilter = firstGym?.gymId
    }

    // Se ainda não tem gymId e é super admin, pega a primeira academia
    if (!gymIdFilter && context.isSuperAdmin) {
        const firstGym = await prisma.gym.findFirst({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        })
        gymIdFilter = firstGym?.id
    }

    // Buscar attendance do banco
    const whereClause = gymIdFilter ? { gymId: gymIdFilter } : {}

    // Buscar membros primeiro para depois buscar attendance
    const members = await prisma.member.findMany({
        where: whereClause,
        select: {
            id: true,
            name: true,
            email: true,
        },
        orderBy: {
            name: 'asc',
        },
    })

    // Buscar attendance records
    const memberIds = members.map(m => m.id)
    const attendanceRecords = memberIds.length > 0 ? await prisma.attendance.findMany({
        where: {
            memberId: { in: memberIds },
        },
        include: {
            member: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: {
            date: 'desc',
        },
    }) : []

    return (
        <AttendancePageClient 
            initialAttendance={attendanceRecords}
            initialMembers={members}
            gymId={gymIdFilter || ''}
        />
    )
}
