"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from "recharts";
import {
    BarChartIcon,
    PersonIcon,
    CalendarIcon
} from "@radix-ui/react-icons";
import { Dumbbell } from "lucide-react";
import { DashboardData } from "../(home)/types";
import { useEffect, useState } from "react";

// Mock data for charts
const attendanceData = [
    { day: 'Seg', present: 45 },
    { day: 'Ter', present: 52 },
    { day: 'Qua', present: 48 },
    { day: 'Qui', present: 55 },
    { day: 'Sex', present: 62 },
    { day: 'Sáb', present: 40 },
    { day: 'Dom', present: 25 },
];

const membershipData = [
    { name: 'Mensal', value: 65 },
    { name: 'Trimestral', value: 25 },
    { name: 'Anual', value: 10 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

interface DashboardChartsProps {
    gymData: DashboardData;
}

export function DashboardCharts({ gymData }: DashboardChartsProps) {
    return (
        <div className="space-y-6">
            {/* Summary Cards */}
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

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Frequência Semanal</CardTitle>
                    </CardHeader>
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
                    <CardHeader>
                        <CardTitle>Tipos de Plano</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={membershipData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
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

export function AnalyticsCharts() {
    const [chartData, setChartData] = useState<any[]>([]);
    const [membershipData, setMembershipData] = useState<any[]>([]);

    useEffect(() => {
        const loadChartData = async () => {
            try {
                // Fetch data from API route instead of direct file access
                const response = await fetch('/api/data');
                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }
                const allData = await response.json();
                const members = allData.members;
                const attendance = allData.attendance;

                // Prepare attendance data for chart
                const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
                const attendanceByDay = days.map(day => {
                    // Simplified calculation - in a real app you'd group by day of week
                    return {
                        day,
                        present: Math.floor(Math.random() * 30) + 30 // Random data for demo
                    };
                });

                setChartData(attendanceByDay);

                // Prepare membership data
                const membershipCounts = members.reduce((acc, member) => {
                    acc[member.plan] = (acc[member.plan] || 0) + 1;
                    return acc;
                }, {});

                const membershipArray = Object.entries(membershipCounts).map(([name, value]) => ({
                    name,
                    value: value as number
                }));

                setMembershipData(membershipArray);

            } catch (error) {
                console.error("Error loading chart data:", error);

                // Fallback to mock data if API fails
                setChartData([
                    { day: 'Seg', present: 45 },
                    { day: 'Ter', present: 52 },
                    { day: 'Qua', present: 48 },
                    { day: 'Qui', present: 55 },
                    { day: 'Sex', present: 62 },
                    { day: 'Sáb', present: 40 },
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

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    // Mock data for other charts
    const monthlyAttendance = [
        { month: 'Jan', attendance: 85 },
        { month: 'Fev', attendance: 88 },
        { month: 'Mar', attendance: 92 },
        { month: 'Abr', attendance: 87 },
        { month: 'Mai', attendance: 90 },
        { month: 'Jun', attendance: 93 },
        { month: 'Jul', attendance: 91 },
        { month: 'Ago', attendance: 89 },
        { month: 'Set', attendance: 94 },
        { month: 'Out', attendance: 95 },
        { month: 'Nov', attendance: 92 },
        { month: 'Dez', attendance: 85 },
    ];

    const memberGrowth = [
        { month: 'Jan', new: 12, churned: 3 },
        { month: 'Fev', new: 15, churned: 2 },
        { month: 'Mar', new: 18, churned: 4 },
        { month: 'Abr', new: 14, churned: 3 },
        { month: 'Mai', new: 16, churned: 2 },
        { month: 'Jun', new: 20, churned: 1 },
        { month: 'Jul', new: 17, churned: 3 },
        { month: 'Ago', new: 19, churned: 2 },
        { month: 'Set', new: 22, churned: 4 },
        { month: 'Out', new: 25, churned: 3 },
        { month: 'Nov', new: 21, churned: 2 },
        { month: 'Dez', new: 18, churned: 3 },
    ];

    const workoutPopularity = [
        { name: 'Musculação', value: 35 },
        { name: 'Yoga', value: 20 },
        { name: 'Crossfit', value: 25 },
        { name: 'Pilates', value: 15 },
        { name: 'Cardio', value: 5 },
    ];

    return (
        <div className="space-y-6">
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Taxa de Frequência ao Longo do Ano</CardTitle>
                    </CardHeader>
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
                    <CardHeader>
                        <CardTitle>Tipos de Treino Mais Populares</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={workoutPopularity}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
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
                <CardHeader>
                    <CardTitle>Crescimento e Churn de Membros</CardTitle>
                </CardHeader>
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