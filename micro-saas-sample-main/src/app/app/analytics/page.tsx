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
import { jsonDb } from "@/services/json-db";

export default async function AnalyticsPage() {
    // Get all data from the database
    const allData = await jsonDb.getData();
    const members = allData.members;
    const attendance = allData.attendance;
    const financial = allData.financial;

    // Calculate analytics
    const activeMembers = members.filter(member => member.status === 'Ativo').length;
    const totalMembers = members.length;
    const attendanceRate = attendance.length > 0 
        ? Math.round((attendance.filter(record => record.status === 'Presente').length / attendance.length) * 100) 
        : 0;
    
    const monthlyRevenue = financial
        .filter(record => record.type === 'Receita')
        .reduce((sum, record) => sum + record.amount, 0);
    
    // Calculate retention rate (simplified)
    const retentionRate = 92; // This would be calculated based on historical data

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
                            <CardTitle className="text-sm font-medium">Frequência Média</CardTitle>
                            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{attendanceRate}%</div>
                            <p className="text-xs text-muted-foreground">baseado em registros</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Receita Média/Mês</CardTitle>
                            <BarChartIcon className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">R$ {monthlyRevenue.toLocaleString('pt-BR')}</div>
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

                <AnalyticsCharts />

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