"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { PersonIcon, CalendarIcon, BarChartIcon } from "@radix-ui/react-icons";
import { Dumbbell } from "lucide-react";
import { DashboardData } from "../(home)/types";
import { useEffect, useState } from "react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

interface DashboardChartsProps {
    gymData: DashboardData;
}

export function DashboardCharts({ gymData }: DashboardChartsProps) {
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [membershipData, setMembershipData] = useState<any[]>([]);

    useEffect(() => {
        const loadChartData = async () => {
            try {
                const response = await fetch('/api/data');
                if (!response.ok) throw new Error('Failed to fetch data');
                const allData = await response.json();
                const members = allData.members || [];
                const attendance = allData.attendance || [];

                // Weekly attendance
                const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

                const recentAttendance = attendance.filter((r: any) => {
                    const recordDate = new Date(r.date);
                    return recordDate >= oneWeekAgo && r.status === 'Presente';
                });

                const attendanceByDay = days.map(day => {
                    const dayAttendance = recentAttendance.filter((r: any) => {
                        const recordDate = new Date(r.date);
                        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                        return dayNames[recordDate.getDay()] === day;
                    });
                    return { day, present: dayAttendance.length };
                });

                setAttendanceData(attendanceByDay);

                // Membership by plan
                const membershipCounts = members.reduce((acc: Record<string, number>, m: any) => {
                    acc[m.plan] = (acc[m.plan] || 0) + 1;
                    return acc;
                }, {});

                setMembershipData(Object.entries(membershipCounts).map(([name, value]) => ({
                    name, value: value as number
                })));

            } catch (error) {
                console.error("Error loading chart data:", error);
                setAttendanceData([
                    { day: 'Seg', present: 45 }, { day: 'Ter', present: 52 },
                    { day: 'Qua', present: 48 }, { day: 'Qui', present: 55 },
                    { day: 'Sex', present: 62 }, { day: 'Sáb', present: 40 },
                    { day: 'Dom', present: 25 },
                ]);
                setMembershipData([
                    { name: 'Mensal', value: 65 },
                    { name: 'Trimestral', value: 25 },
                    { name: 'Anual', value: 10 },
                ]);
            }
        };

        loadChartData();
    }, []);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Membros Ativos</CardTitle>
                        <PersonIcon className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{gymData.activeMembers}</div>
                        <p className="text-xs text-muted-foreground">+{gymData.newMembers} este mês</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Frequência</CardTitle>
                        <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{gymData.attendanceRate}%</div>
                        <p className="text-xs text-muted-foreground">Taxa de comparecimento</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Receita</CardTitle>
                        <BarChartIcon className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {gymData.revenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">+12% desde o mês passado</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Lucro</CardTitle>
                        <Dumbbell className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {gymData.profit.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Margem de {gymData.revenue > 0 ? Math.round((gymData.profit/gymData.revenue)*100) : 0}%</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Frequência Semanal</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={attendanceData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="present" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Tipos de Plano</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={membershipData}
                                    cx="50%" cy="50%" labelLine={false}
                                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                                    outerRadius={80} fill="#8884d8" dataKey="value"
                                >
                                    {membershipData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export function AnalyticsCharts({ gymId }: { gymId?: string }) {
    const [monthlyAttendance, setMonthlyAttendance] = useState<any[]>([]);
    const [membershipData, setMembershipData] = useState<any[]>([]);
    const [memberGrowth, setMemberGrowth] = useState<any[]>([]);
    const [workoutPopularity, setWorkoutPopularity] = useState<any[]>([]);

    useEffect(() => {
        const loadChartData = async () => {
            try {
                const url = gymId ? `/api/data?gymId=${gymId}` : '/api/data';
                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch data');
                const allData = await response.json();
                const members = allData.members || [];
                const attendance = allData.attendance || [];

                console.log('[AnalyticsCharts] Loaded:', gymId, 'Attendance:', attendance.length);

                // Monthly attendance - últimos 12 meses
                const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                const currentYear = new Date().getFullYear();
                
                const monthlyData = months.map((month, index) => {
                    const monthAttendance = attendance.filter((r: any) => {
                        const recordDate = new Date(r.date);
                        return recordDate.getFullYear() === currentYear &&
                               recordDate.getMonth() === index &&
                               r.status === 'Presente';
                    });
                    return { month, attendance: monthAttendance.length };
                });

                setMonthlyAttendance(monthlyData);

                // Membership by plan
                const membershipCounts = members.reduce((acc: Record<string, number>, m: any) => {
                    acc[m.plan] = (acc[m.plan] || 0) + 1;
                    return acc;
                }, {});

                setMembershipData(Object.entries(membershipCounts).map(([name, value]) => ({
                    name, value: value as number
                })));

                // Mock data
                setMemberGrowth([
                    { month: 'Jan', new: 12, churned: 3 },
                    { month: 'Fev', new: 15, churned: 2 },
                    { month: 'Mar', new: 18, churned: 4 },
                    { month: 'Abr', new: 14, churned: 3 },
                    { month: 'Mai', new: 16, churned: 2 },
                    { month: 'Jun', new: 20, churned: 1 },
                ]);

                setWorkoutPopularity([
                    { name: 'Musculação', value: 35 },
                    { name: 'Crossfit', value: 25 },
                    { name: 'Yoga', value: 20 },
                    { name: 'Pilates', value: 15 },
                    { name: 'Cardio', value: 5 },
                ]);

            } catch (error) {
                console.error("Error loading chart data:", error);
                // Fallback data
                setMonthlyAttendance([
                    { month: 'Jan', attendance: 85 }, { month: 'Fev', attendance: 88 },
                    { month: 'Mar', attendance: 92 }, { month: 'Abr', attendance: 87 },
                    { month: 'Mai', attendance: 90 }, { month: 'Jun', attendance: 93 },
                ]);
                setMembershipData([
                    { name: 'Mensal', value: 65 },
                    { name: 'Trimestral', value: 25 },
                    { name: 'Anual', value: 10 },
                ]);
                setMemberGrowth([
                    { month: 'Jan', new: 12, churned: 3 },
                    { month: 'Fev', new: 15, churned: 2 },
                ]);
                setWorkoutPopularity([
                    { name: 'Musculação', value: 35 },
                    { name: 'Yoga', value: 20 },
                ]);
            }
        };

        loadChartData();
    }, [gymId]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Taxa de Frequência ao Longo do Ano</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={monthlyAttendance}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="attendance" stroke="#8884d8" activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Tipos de Treino Mais Populares</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={workoutPopularity}
                                    cx="50%" cy="50%" labelLine={false}
                                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                                    outerRadius={80} fill="#8884d8" dataKey="value"
                                >
                                    {workoutPopularity.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle>Crescimento e Churn de Membros</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={memberGrowth}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="new" fill="#8884d8" name="Novos Membros" />
                            <Bar dataKey="churned" fill="#ff7300" name="Membros Cancelaram" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
