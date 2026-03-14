import {
    DashboardPage,
    DashboardPageHeader,
    DashboardPageHeaderTitle,
    DashboardPageMain,
} from "@/components/dashboard/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {Badge } from "@/components/ui/badge";
import {
    PersonIcon,
    CalendarIcon,
    BarChartIcon
} from "@radix-ui/react-icons";
import { Dumbbell } from "lucide-react";
import { AnalyticsCharts } from "../__components/dashboard-charts";
import { prisma } from "@/lib/prisma";
import { auth } from "@/services/auth";
import { getTenantContext } from "@/lib/multi-tenant";

export default async function AnalyticsPage(props: {
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

    // Buscar dados do banco
    const whereClause = gymIdFilter ? { gymId: gymIdFilter } : {}

    const [members, attendance] = await Promise.all([
        prisma.member.findMany({ where: whereClause }),
        prisma.attendance.findMany({ 
            where: gymIdFilter ? {
                memberId: {
                    in: (await prisma.member.findMany({
                        where: { gymId: gymIdFilter },
                        select: { id: true }
                    })).map(m => m.id)
                }
            } : {}
        }),
    ])

    // Calcular analytics
    const activeMembers = members.filter(m => m.status === 'Ativo').length
    const totalMembers = members.length
    
    // Taxa de frequência: membros únicos que vieram nos últimos 30 dias / total de membros
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentAttendance = attendance.filter(a => 
        new Date(a.date) >= thirtyDaysAgo && a.status === 'Presente'
    )
    const uniqueMembersWhoAttended = new Set(recentAttendance.map(a => a.memberId)).size
    const attendanceRate = totalMembers > 0 
        ? Math.round((uniqueMembersWhoAttended / totalMembers) * 100) 
        : 0

    const monthlyRevenue = await prisma.expense.findMany({
        where: whereClause,
    })
    const revenue = monthlyRevenue
        .filter(r => ['Mensalidades', 'Mensalidades Anuais', 'Mensalidades Trimestrais', 'Receita'].includes(r.category))
        .reduce((sum, r) => sum + Number(r.amount), 0)

    const retentionRate = 92 // Fixo por enquanto

    return (
        <DashboardPage>
            <DashboardPageHeader>
                <DashboardPageHeaderTitle>Análises</DashboardPageHeaderTitle>
            </DashboardPageHeader>

            <DashboardPageMain className="space-y-6">
                {/* Analytics Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Membros Ativos</CardTitle>
                            <PersonIcon className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{activeMembers}</div>
                            <p className="text-xs text-muted-foreground">de {totalMembers} membros</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Taxa de Frequência</CardTitle>
                            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{attendanceRate}%</div>
                            <p className="text-xs text-muted-foreground">membros únicos (30 dias)</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Receita Média/Mês</CardTitle>
                            <BarChartIcon className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">R$ {revenue.toLocaleString('pt-BR')}</div>
                            <p className="text-xs text-muted-foreground">último mês</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Retenção</CardTitle>
                            <Dumbbell className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{retentionRate}%</div>
                            <p className="text-xs text-muted-foreground">taxa de retenção</p>
                        </CardContent>
                    </Card>
                </div>

                <AnalyticsCharts gymId={gymIdFilter} />

                {/* Insights */}
                <Card>
                    <CardHeader>
                        <CardTitle>Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="border rounded-lg p-4">
                                <h3 className="font-medium mb-2">Melhor Mês</h3>
                                <p className="text-sm text-muted-foreground">Novembro com 95% de frequência</p>
                                <Badge variant="default" className="mt-2">Recomendação: Replicar estratégias de novembro</Badge>
                            </div>
                            <div className="border rounded-lg p-4">
                                <h3 className="font-medium mb-2">Treino Mais Popular</h3>
                                <p className="text-sm text-muted-foreground">Musculação com 35% das preferências</p>
                                <Badge variant="default" className="mt-2">Recomendação: Investir em mais equipamentos de musculação</Badge>
                            </div>
                            <div className="border rounded-lg p-4">
                                <h3 className="font-medium mb-2">Tendência</h3>
                                <p className="text-sm text-muted-foreground">Aumento de 12% em membros ativos</p>
                                <Badge variant="default" className="mt-2">Recomendação: Expandir capacidade da academia</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </DashboardPageMain>
        </DashboardPage>
    );
}