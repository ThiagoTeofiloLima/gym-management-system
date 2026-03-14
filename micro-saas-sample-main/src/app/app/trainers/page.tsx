import {
    DashboardPage,
    DashboardPageHeader,
    DashboardPageHeaderTitle,
    DashboardPageMain,
} from "@/components/dashboard/page"
import { prisma } from "@/services/database"
import { auth } from "@/services/auth"
import { getTenantContext } from "@/lib/multi-tenant"
import { TrainerManagement } from "../__components/trainers/trainer-management"

/**
 * Página de Treinadores (Server Component)
 */
export default async function TrainersPage(props: {
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

    // Buscar treinadores do banco
    const whereClause = gymIdFilter ? { gymId: gymIdFilter } : {}

    const trainers = await prisma.trainer.findMany({
        where: whereClause,
        include: {
            gym: {
                select: {
                    id: true,
                    name: true,
                },
            },
            members: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    })

    // Buscar membros para o dropdown
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

    return (
        <TrainerManagement 
            initialTrainers={trainers}
            initialMembers={members}
            gymId={gymIdFilter || ''}
        />
    )
}
