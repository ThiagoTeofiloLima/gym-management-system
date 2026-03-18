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
import { Dumbbell, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
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

    // Se ainda não tem gymId e é super admin, pega a primeira academia
    if (!gymIdFilter && context.isSuperAdmin) {
        const firstGym = await prisma.gym.findFirst({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        })
        gymIdFilter = firstGym?.id
    }

    // Buscar dados do banco em paralelo
    const whereClause = gymIdFilter ? { gymId: gymIdFilter } : {}

    const [members, attendance, gymPlans, expenses] = await Promise.all([
        prisma.member.findMany({ 
            where: whereClause,
            include: {
                gymPlan: true,
            }
        }),
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
        // Buscar planos da academia
        prisma.gymPlan.findMany({
            where: gymIdFilter ? { gymId: gymIdFilter } : {},
        }),
        // Buscar despesas para cálculo de lucro
        prisma.expense.findMany({
            where: whereClause,
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

    // Criar mapa de preços dos planos (nome -> preço)
    const planPriceMap = new Map<string, number>()
    gymPlans.forEach(plan => {
        if (plan.isActive) {
            planPriceMap.set(plan.name.toLowerCase(), plan.price)
        }
    })

    // Função para obter preço do plano
    const getPlanPrice = (planName: string): number => {
        const price = planPriceMap.get(planName.toLowerCase())
        if (price !== undefined) {
            return price
        }
        // Fallback para preços padrão se não encontrar no mapa
        const defaultPrices: Record<string, number> = {
            'mensal': 100,
            'trimestral': 250,
            'anual': 900,
        }
        return defaultPrices[planName.toLowerCase()] || 0
    }

    // Calcular receita baseada nos planos dos membros ativos
    let totalRevenue = 0
    const revenueByPlan: Record<string, { count: number; revenue: number }> = {}
    
    members.forEach(member => {
        // Apenas membros ativos geram receita
        if (member.status === 'Ativo' || member.status === 'ativo') {
            const planPrice = getPlanPrice(member.plan)
            totalRevenue += planPrice
            
            // Agrupar por plano
            if (!revenueByPlan[member.plan]) {
                revenueByPlan[member.plan] = { count: 0, revenue: 0 }
            }
            revenueByPlan[member.plan].count += 1
            revenueByPlan[member.plan].revenue += planPrice
        }
    })

    // Calcular ticket médio por membro
    const averageTicketPerMember = activeMembers > 0 ? totalRevenue / activeMembers : 0

    // Calcular receita média mensal (annualiza receitas de planos longos e divide por 12)
    let projectedMonthlyRevenue = 0
    members.forEach(member => {
        if (member.status === 'Ativo' || member.status === 'ativo') {
            const planPrice = getPlanPrice(member.plan)
            const planLower = member.plan.toLowerCase()
            
            if (planLower.includes('anual')) {
                projectedMonthlyRevenue += planPrice / 12
            } else if (planLower.includes('trimestral')) {
                projectedMonthlyRevenue += planPrice / 3
            } else {
                // Mensal ou outros
                projectedMonthlyRevenue += planPrice
            }
        }
    })

    // Calcular despesas do mês
    const now = new Date()
    const currentMonthExpenses = expenses
        .filter(e => {
            const expenseDate = new Date(e.date)
            return expenseDate.getMonth() === now.getMonth() && 
                   expenseDate.getFullYear() === now.getFullYear()
        })
        .reduce((sum, e) => sum + e.amount, 0)

    // Calcular lucro líquido
    const netProfit = projectedMonthlyRevenue - currentMonthExpenses
    const profitMargin = projectedMonthlyRevenue > 0 
        ? ((netProfit / projectedMonthlyRevenue) * 100).toFixed(1) 
        : '0'

    // Calcular retenção baseada em membros que renovaram
    const membersDueForRenewal = members.filter(m => {
        const renewalDate = new Date(m.planRenewalDate)
        return renewalDate <= now
    })
    
    const membersWhoRenewed = membersDueForRenewal.filter(m => {
        const paymentDate = new Date(m.paymentDate)
        return paymentDate > renewalDate // Pagou após vencimento
    })
    
    const retentionRate = membersDueForRenewal.length > 0
        ? Math.round((membersWhoRenewed.length / membersDueForRenewal.length) * 100)
        : 100 // Se não há membros para renovar, considera 100%

    // Calcular crescimento de membros (comparando com mês anterior)
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    
    const currentMonthMembers = members.filter(m => {
        const memberDate = new Date(m.createdAt)
        return memberDate.getMonth() === now.getMonth() && 
               memberDate.getFullYear() === now.getFullYear()
    }).length
    
    const lastMonthMembers = members.filter(m => {
        const memberDate = new Date(m.createdAt)
        return memberDate.getMonth() === lastMonth.getMonth() && 
               memberDate.getFullYear() === lastMonth.getFullYear()
    }).length
    
    const growthRate = lastMonthMembers > 0
        ? (((currentMonthMembers - lastMonthMembers) / lastMonthMembers) * 100).toFixed(1)
        : currentMonthMembers > 0 ? '100' : '0'

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
                            {growthRate !== '0' && (
                                <div className={`flex items-center gap-1 text-xs mt-1 ${
                                    parseFloat(growthRate) >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {parseFloat(growthRate) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    {parseFloat(growthRate) >= 0 ? '+' : ''}{growthRate}% vs mês anterior
                                </div>
                            )}
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
                            <CardTitle className="text-sm font-medium">Receita Projetada/Mês</CardTitle>
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">R$ {projectedMonthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <p className="text-xs text-muted-foreground">baseado nos planos ativos</p>
                            <div className="text-xs text-muted-foreground mt-1">
                                Ticket médio: R$ {averageTicketPerMember.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/membro
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                            <BarChartIcon className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-muted-foreground">margem de {profitMargin}%</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Receitas: R$ {projectedMonthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} | 
                                Despesas: R$ {currentMonthExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Cards de Receita por Plano */}
                {Object.keys(revenueByPlan).length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Receita por Plano</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Distribuição de receita e membros por tipo de plano
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(revenueByPlan).map(([planName, data]) => (
                                    <div key={planName} className="border rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-semibold">{planName}</h3>
                                            <Badge variant="outline">{data.count} membro(s)</Badge>
                                        </div>
                                        <div className="text-2xl font-bold text-green-600">
                                            R$ {data.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {((data.revenue / totalRevenue) * 100).toFixed(1)}% da receita total
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <AnalyticsCharts gymId={gymIdFilter} />

                {/* Insights */}
                <Card>
                    <CardHeader>
                        <CardTitle>Insights e Recomendações</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Insight de Crescimento */}
                            <div className="border rounded-lg p-4">
                                <h3 className="font-medium mb-2 flex items-center gap-2">
                                    {parseFloat(growthRate) >= 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
                                    Crescimento de Membros
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                    {parseFloat(growthRate) >= 0 
                                        ? `+${growthRate}% de crescimento neste mês` 
                                        : `${growthRate}% de redução neste mês`}
                                </p>
                                <Badge variant={parseFloat(growthRate) >= 0 ? "default" : "destructive"} className="text-xs">
                                    {parseFloat(growthRate) >= 0 
                                        ? 'Recomendação: Manter estratégias de aquisição' 
                                        : 'Recomendação: Revisar estratégias de marketing'}
                                </Badge>
                            </div>
                            
                            {/* Insight de Frequência */}
                            <div className="border rounded-lg p-4">
                                <h3 className="font-medium mb-2 flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-blue-600" />
                                    Taxa de Frequência
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                    {attendanceRate}% dos membros frequentaram nos últimos 30 dias
                                </p>
                                <Badge variant={attendanceRate >= 70 ? "default" : attendanceRate >= 50 ? "secondary" : "destructive"} className="text-xs">
                                    {attendanceRate >= 70 
                                        ? 'Excelente! Engajamento alto' 
                                        : attendanceRate >= 50 
                                            ? 'Recomendação: Campanhas de reengajamento' 
                                            : 'Atenção: Risco de cancelamento'}
                                </Badge>
                            </div>
                            
                            {/* Insight de Lucratividade */}
                            <div className="border rounded-lg p-4">
                                <h3 className="font-medium mb-2 flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-green-600" />
                                    Saúde Financeira
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                    Margem de lucro de {profitMargin}%
                                </p>
                                <Badge variant={parseFloat(profitMargin) >= 30 ? "default" : parseFloat(profitMargin) >= 15 ? "secondary" : "destructive"} className="text-xs">
                                    {parseFloat(profitMargin) >= 30 
                                        ? 'Ótima lucratividade!' 
                                        : parseFloat(profitMargin) >= 15 
                                            ? 'Recomendação: Otimizar custos' 
                                            : 'Atenção: Revisar estrutura de custos'}
                                </Badge>
                            </div>
                            
                            {/* Insight de Retenção */}
                            <div className="border rounded-lg p-4">
                                <h3 className="font-medium mb-2 flex items-center gap-2">
                                    <Dumbbell className="h-4 w-4 text-purple-600" />
                                    Taxa de Retenção
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                    {retentionRate}% de renovação de planos
                                </p>
                                <Badge variant={retentionRate >= 80 ? "default" : retentionRate >= 60 ? "secondary" : "destructive"} className="text-xs">
                                    {retentionRate >= 80 
                                        ? 'Excelente retenção!' 
                                        : retentionRate >= 60 
                                            ? 'Recomendação: Programa de fidelidade' 
                                            : 'Atenção: Melhorar experiência do membro'}
                                </Badge>
                            </div>
                            
                            {/* Insight de Plano Mais Popular */}
                            {Object.keys(revenueByPlan).length > 0 && (
                                <div className="border rounded-lg p-4">
                                    <h3 className="font-medium mb-2 flex items-center gap-2">
                                        <BarChartIcon className="h-4 w-4 text-orange-600" />
                                        Plano Mais Popular
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        {(() => {
                                            const mostPopular = Object.entries(revenueByPlan).reduce((a, b) => 
                                                a[1].count > b[1].count ? a : b
                                            )[0]
                                            return `${mostPopular} com ${revenueByPlan[mostPopular].count} membro(s)`
                                        })()}
                                    </p>
                                    <Badge variant="secondary" className="text-xs">
                                        Recomendação: Promover planos similares
                                    </Badge>
                                </div>
                            )}
                            
                            {/* Insight de Ticket Médio */}
                            <div className="border rounded-lg p-4">
                                <h3 className="font-medium mb-2 flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-cyan-600" />
                                    Ticket Médio
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                    R$ {averageTicketPerMember.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} por membro
                                </p>
                                <Badge variant="outline" className="text-xs">
                                    {averageTicketPerMember >= 150 
                                        ? 'Ticket alto - focar em premium' 
                                        : averageTicketPerMember >= 80 
                                            ? 'Ticket médio - upsell possível' 
                                            : 'Ticket baixo - revisar preços'}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </DashboardPageMain>
        </DashboardPage>
    );
}