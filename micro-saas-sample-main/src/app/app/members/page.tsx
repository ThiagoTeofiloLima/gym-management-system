import {
    DashboardPage,
    DashboardPageHeader,
    DashboardPageHeaderTitle,
    DashboardPageMain,
} from "@/components/dashboard/page"
import * as db from "@/services/database"
import { auth } from "@/services/auth"
import { getTenantContext } from "@/lib/multi-tenant"
import MembersPageClient from "./__components/MemberForm"

/**
 * Página de Membros (Server Component)
 * Busca os membros APENAS da academia selecionada
 */
export default async function MembersPage(props: {
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

    // Se ainda não tem gymId e é super admin, pega a primeira academia do banco
    if (!gymIdFilter && context.isSuperAdmin) {
        const allGyms = await db.findAllGyms()
        const firstGym = allGyms.find(g => g.isActive)
        gymIdFilter = firstGym?.id
    }

    // Obter membros do banco de dados - FILTRAR POR gymId
    const whereClause = gymIdFilter ? { gymId: gymIdFilter } : {}

    const userMembers = await db.findMembers({
        gymId: gymIdFilter,
    })

    // Datas já são strings no Supabase
    const serializedMembers = userMembers.map((member) => ({
        ...member,
    }))

    // Passar gymId para o componente cliente
    return (
        <MembersPageClient
            initialMembers={serializedMembers}
            gymId={gymIdFilter || ''}
        />
    )
}
