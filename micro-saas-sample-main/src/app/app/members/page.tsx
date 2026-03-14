import {
    DashboardPage,
    DashboardPageHeader,
    DashboardPageHeaderTitle,
    DashboardPageMain,
} from "@/components/dashboard/page"
import { prisma } from "@/services/database"
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
    let queryGymId = searchParams.gymId

    const session = await auth()

    if (!session?.user) {
        return <div>Unauthorized</div>
    }

    const context = await getTenantContext()

    if (!context) {
        return <div>Unauthorized</div>
    }

    console.log('[MembersPage] session.user.id:', session.user.id)
    console.log('[MembersPage] context:', { 
        gymId: context.gymId, 
        isSuperAdmin: context.isSuperAdmin,
        gyms: context.gyms?.length 
    })
    console.log('[MembersPage] queryGymId:', queryGymId)

    // PRIORIDADE MÁXIMA: gymId da query string
    let gymIdFilter: string | undefined

    if (queryGymId) {
        gymIdFilter = queryGymId
    } else if (context.gymId) {
        gymIdFilter = context.gymId
    } else if (context.gyms && context.gyms.length > 0) {
        // Pega a primeira academia
        const firstGym = context.gyms.find((g: any) => g.status === 'ACTIVE' && g.isActive)
        gymIdFilter = firstGym?.gymId
    }

    // Se ainda não tem gymId e é super admin, pega a primeira academia do banco
    if (!gymIdFilter && context.isSuperAdmin) {
        const firstGym = await prisma.gym.findFirst({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        })
        gymIdFilter = firstGym?.id
    }

    console.log('[MembersPage] gymIdFilter final:', gymIdFilter)

    // Obter membros do banco de dados - FILTRAR POR gymId
    const whereClause = gymIdFilter ? { gymId: gymIdFilter } : {}

    const userMembers = await prisma.member.findMany({
        where: whereClause,
        include: {
            trainer: {
                select: {
                    id: true,
                    name: true,
                },
            },
            gym: {
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

    console.log('[MembersPage] Members found:', userMembers.length)

    // Serializar datas para o componente cliente
    const serializedMembers = userMembers.map((member) => ({
        ...member,
        createdAt: member.createdAt.toISOString(),
        updatedAt: member.updatedAt.toISOString(),
        lastVisit: member.lastVisit,
        planRenewalDate: member.planRenewalDate,
        paymentDate: member.paymentDate,
    }))

    // Passar gymId para o componente cliente
    return (
        <MembersPageClient 
            initialMembers={serializedMembers} 
            gymId={gymIdFilter || ''}
        />
    )
}
