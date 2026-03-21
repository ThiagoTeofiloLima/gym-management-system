import {
    DashboardPage,
    DashboardPageHeader,
    DashboardPageHeaderTitle,
    DashboardPageMain,
} from "@/components/dashboard/page"
import * as db from "@/services/database"
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
    const queryGymId = searchParams.gymId

    const session = await auth()

    if (!session?.user) {
        return <div>Unauthorized</div>
    }

    // Passa o gymId da URL para o contexto
    const context = await getTenantContext(queryGymId)

    if (!context) {
        return <div>Unauthorized</div>
    }

    // Determinar qual gymId usar
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
        const allGyms = await db.findAllGyms()
        const firstGym = allGyms.find(g => g.isActive)
        gymIdFilter = firstGym?.id
    }

    // Buscar treinadores do banco
    const whereClause = gymIdFilter ? { gymId: gymIdFilter } : {}

    const trainers = await db.findTrainers({
        gymId: gymIdFilter,
    })

    // Buscar membros para o dropdown
    const members = await db.findMembers({
        gymId: gymIdFilter,
    })

    return (
        <TrainerManagement
            initialTrainers={trainers}
            initialMembers={members}
            gymId={gymIdFilter || ''}
        />
    )
}
