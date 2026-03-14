import {
    DashboardPage,
    DashboardPageHeader,
    DashboardPageHeaderTitle,
    DashboardPageMain,
} from "@/components/dashboard/page"
import { prisma } from "@/services/database"
import { auth } from "@/services/auth"
import { getTenantContext } from "@/lib/multi-tenant"
import { ExpenseManagement } from "../__components/expenses/expense-management"

/**
 * Página de Despesas (Server Component)
 */
export default async function ExpensesPage(props: {
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

    // Buscar expenses do banco
    const whereClause = gymIdFilter ? { gymId: gymIdFilter } : {}

    const expensesData = await prisma.expense.findMany({
        where: whereClause,
        include: {
            gym: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: {
            date: 'desc',
        },
    })

    // Serializar datas
    const expenses = expensesData.map(e => ({
        ...e,
        date: e.date.toISOString().split('T')[0],
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
    }))

    return (
        <ExpenseManagement 
            initialExpenses={expenses}
            gymId={gymIdFilter || ''}
        />
    )
}
