import {
    DashboardPage,
    DashboardPageHeader,
    DashboardPageHeaderTitle,
    DashboardPageMain,
} from "@/components/dashboard/page"
import { prisma } from "@/services/database"
import { auth } from "@/services/auth"
import { getTenantContext } from "@/lib/multi-tenant"
import { WorkoutManagement } from "../__components/workouts/workout-management"

/**
 * Página de Treinos (Server Component)
 */
export default async function WorkoutsPage(props: {
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

    // Buscar workouts do banco
    const whereClause = gymIdFilter ? { gymId: gymIdFilter } : {}

    const workouts = await prisma.workout.findMany({
        where: whereClause,
        include: {
            trainer: {
                select: {
                    id: true,
                    name: true,
                    specialty: true,
                },
            },
            gym: {
                select: {
                    id: true,
                    name: true,
                },
            },
            workoutMembers: {
                include: {
                    member: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    })

    // Buscar membros e treinadores para dropdowns
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

    const trainers = await prisma.trainer.findMany({
        where: whereClause,
        select: {
            id: true,
            name: true,
            specialty: true,
        },
        orderBy: {
            name: 'asc',
        },
    })

    return (
        <WorkoutManagement 
            initialWorkouts={workouts}
            initialMembers={members}
            initialTrainers={trainers}
            gymId={gymIdFilter || ''}
        />
    )
}
