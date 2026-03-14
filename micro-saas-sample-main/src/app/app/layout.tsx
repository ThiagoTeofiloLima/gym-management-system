import { MainSidebar } from "./__components/main-sidebar"
import { AppHeader } from "./__components/app-header"
import { auth } from "@/services/auth"
import { getTenantContext, getUserAccessibleGyms } from "@/lib/multi-tenant"
import { redirect } from "next/navigation"
import { prisma } from "@/services/database"

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    // Se não estiver autenticado, redireciona para auth
    if (!session?.user) {
        redirect("/auth")
    }

    // Obter contexto do tenant
    const context = await getTenantContext()

    if (!context) {
        redirect("/auth")
    }

    // Obter academias acessíveis
    const accessibleGyms = await getUserAccessibleGyms(session.user.id)

    // Se usuário não tem nenhuma academia e não é super admin, mostra página de seleção
    if (accessibleGyms.length === 0 && !context.isSuperAdmin) {
        // Redireciona para página de seleção de academia
        // Esta página será criada depois
    }

    // Para Super Admin, carregar todas as academias se não tiver nenhuma associada
    if (context.isSuperAdmin && accessibleGyms.length === 0) {
        const allGyms = await prisma.gym.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        })

        // Se houver academias no sistema, o Super Admin pode acessá-las
        if (allGyms.length > 0) {
            // Não redirecionamos, permitimos que o Super Admin navegue
        }
    }

    return (
        <div className="grid grid-cols-[16rem_1fr] min-h-screen">
            <MainSidebar
                user={session.user}
                context={context}
                accessibleGyms={accessibleGyms}
            />
            <div className="flex flex-col">
                <AppHeader />
                <main className="overflow-auto flex-1">
                    {children}
                </main>
            </div>
        </div>
    )
}
